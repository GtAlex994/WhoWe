import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase-admin";
import { appendAuditLog } from "@/lib/audit-log";
import { sendEmail, escapeHtml } from "@/lib/email";

// Safety Mode: an explicit, off-by-default, per-event opt-in that privately
// records the attendee's own last-known location while active. It is NOT
// continuous background tracking in the sense a native app could offer —
// browsers throttle/suspend timers in backgrounded tabs, so this is
// best-effort while the page stays open, and the UI must say so rather than
// imply monitoring that isn't real.
//
// Stored at events/{eventId}/safetyLocations/{userId} — never exposed to the
// host or other attendees; only the owning user (and, for review, an admin)
// can read it. `expiresAt` is set/refreshed on every update to now + this
// window, but Firestore does NOT delete on that field automatically without
// a TTL policy enabled on it — that's a one-time `gcloud firestore fields
// ttls update` (or Firestore console) step outside this codebase. Until
// that's configured, `expiresAt` is a value ready to enforce, not enforcement
// itself — stated here rather than implied.
export const SAFETY_LOCATION_RETENTION_MS = 48 * 60 * 60 * 1000;

export type SafetyModeStatus = {
  active: boolean;
  lastUpdateAt: Date | null;
  accuracyMeters: number | null;
};

function safetyDocRef(eventId: string, userId: string) {
  return db.doc(`events/${eventId}/safetyLocations/${userId}`);
}

async function assertIsAttendee(eventId: string, userId: string) {
  const attendeeSnap = await db.doc(`events/${eventId}/attendees/${userId}`).get();
  if (!attendeeSnap.exists || attendeeSnap.data()!.status !== "joined") {
    throw new Error("Join this event before turning on Safety Mode.");
  }
}

export async function startSafetyMode(eventId: string, userId: string): Promise<void> {
  await assertIsAttendee(eventId, userId);

  await safetyDocRef(eventId, userId).set({
    userId,
    active: true,
    startedAt: FieldValue.serverTimestamp(),
    lastUpdateAt: FieldValue.serverTimestamp(),
    lastLat: null,
    lastLng: null,
    accuracyMeters: null,
    expiresAt: Date.now() + SAFETY_LOCATION_RETENTION_MS,
  });

  await appendAuditLog({ caseId: null, action: "safety_mode_started", actorId: userId, subjectId: userId, detail: eventId });
}

/** No-op if Safety Mode isn't active for this user/event — safe to call speculatively (e.g. from check-out). */
export async function stopSafetyMode(eventId: string, userId: string): Promise<void> {
  const ref = safetyDocRef(eventId, userId);
  const snap = await ref.get();
  if (!snap.exists) return;

  await ref.delete();
  await appendAuditLog({ caseId: null, action: "safety_mode_stopped", actorId: userId, subjectId: userId, detail: eventId });
}

export async function updateSafetyModeLocation(
  eventId: string,
  userId: string,
  lat: number,
  lng: number,
  accuracyMeters: number | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ref = safetyDocRef(eventId, userId);
  const snap = await ref.get();
  if (!snap.exists || snap.data()!.active !== true) {
    return { ok: false, error: "Safety Mode isn't active for this event." };
  }

  await ref.update({
    lastLat: lat,
    lastLng: lng,
    accuracyMeters,
    lastUpdateAt: FieldValue.serverTimestamp(),
    expiresAt: Date.now() + SAFETY_LOCATION_RETENTION_MS,
  });
  return { ok: true };
}

/**
 * Deliberately does not return the stored lat/lng — the owner's own status
 * display only needs "active + last update time + accuracy" (see the UI
 * spec this implements), so there's no reason to put raw coordinates on the
 * wire even back to their own browser.
 */
export async function getSafetyModeStatus(eventId: string, userId: string): Promise<SafetyModeStatus> {
  const snap = await safetyDocRef(eventId, userId).get();
  if (!snap.exists) return { active: false, lastUpdateAt: null, accuracyMeters: null };
  const data = snap.data()!;
  return {
    active: data.active === true,
    lastUpdateAt: data.lastUpdateAt?.toDate() ?? null,
    accuracyMeters: data.accuracyMeters ?? null,
  };
}

/**
 * Files an urgent review flag, same `reports` collection every other report
 * uses. Never claims emergency services were contacted — because they
 * aren't, this only reaches WhoWe's own moderation queue.
 */
export async function triggerSafetyHelp(eventId: string, userId: string): Promise<void> {
  const reportRef = db.collection("reports").doc();
  await reportRef.set({
    reporterId: userId,
    targetType: "safety_help_request",
    targetId: userId,
    eventId,
    category: "I feel unsafe",
    context: "Triggered via Safety Mode \"I need help\".",
    source: "auto",
    severity: "high",
    status: "open",
    createdAt: FieldValue.serverTimestamp(),
  });
  await appendAuditLog({
    caseId: reportRef.id,
    action: "safety_help_requested",
    actorId: userId,
    subjectId: userId,
    detail: eventId,
  });
}

// Missed check-out escalation. Heuristic, not exact: events don't currently
// carry an end time/duration (a separate gap — event creation only has a
// start time), so "possibly overdue" is approximated as "still checked in
// N hours after the event's start". Two stages: first a private reminder to
// the attendee themselves, then — only if they explicitly opted in for this
// event and are still checked in a further RETRY window later — one email to
// their trusted contact. Never messages the event group, never claims
// emergency services were contacted.
export const CHECKOUT_REMINDER_THRESHOLD_MS = 4 * 60 * 60 * 1000;
export const CHECKOUT_REMINDER_RETRY_MS = 2 * 60 * 60 * 1000;

/**
 * Does one pass over all currently-checked-in attendees and sends whichever
 * reminder/escalation each one is due for. Idempotent per attendee per
 * stage (guarded by checkoutReminderSentAt/trustedContactNotifiedAt), so
 * it's safe to call this repeatedly/frequently from an external scheduler.
 *
 * Nothing in this codebase calls this on a schedule — see
 * /api/cron/checkout-reminders, which needs an external scheduler (Cloud
 * Scheduler, cron-job.org, etc.) configured against it plus a CRON_SECRET
 * env var. That's an ops/deployment step, not something this code can do.
 */
export async function runCheckoutReminderSweep(): Promise<{ remindersSent: number; contactsNotified: number }> {
  const snap = await db.collectionGroup("attendees").where("checkInStatus", "==", "checked-in").get();
  let remindersSent = 0;
  let contactsNotified = 0;
  const now = Date.now();

  for (const doc of snap.docs) {
    const data = doc.data();
    const eventStartsAt: Date | null = data.eventStartsAt?.toDate?.() ?? null;
    if (!eventStartsAt || now - eventStartsAt.getTime() < CHECKOUT_REMINDER_THRESHOLD_MS) continue;

    const userId = data.userId as string;
    const eventId = doc.ref.parent.parent!.id;
    const eventTitle = (data.eventTitle as string | undefined) ?? "an event";
    const reminderSentAt: Date | null = data.checkoutReminderSentAt?.toDate?.() ?? null;
    const contactNotifiedAt: Date | null = data.trustedContactNotifiedAt?.toDate?.() ?? null;

    if (!reminderSentAt) {
      const userSnap = await db.doc(`users/${userId}`).get();
      const email = userSnap.data()?.email;
      if (email) {
        await sendEmail({
          to: email,
          subject: "Did you check out?",
          html: `<p>You checked in to <strong>${escapeHtml(eventTitle)}</strong> a while ago and haven't checked out yet.</p><p>Are you safe? <a href="https://whowe.live/events/${eventId}">Check out</a> when you're able to.</p>`,
        });
      }
      await doc.ref.update({ checkoutReminderSentAt: FieldValue.serverTimestamp() });
      await appendAuditLog({ caseId: null, action: "checkout_reminder_sent", actorId: null, subjectId: userId, detail: eventId });
      remindersSent++;
      continue;
    }

    if (!contactNotifiedAt && now - reminderSentAt.getTime() >= CHECKOUT_REMINDER_RETRY_MS) {
      if (data.notifyTrustedContact?.onMissedCheckOut === true) {
        const userSnap = await db.doc(`users/${userId}`).get();
        const trustedContact = userSnap.data()?.trustedContact;
        const username = userSnap.data()?.username as string | undefined;
        if (trustedContact?.email) {
          const label = username ? `@${username}` : "Someone you know";
          await sendEmail({
            to: trustedContact.email,
            subject: `${label} hasn't checked out on WhoWe`,
            html: `<p>${label} checked in to <strong>${escapeHtml(eventTitle)}</strong> on WhoWe and hasn't checked out. They listed you as a trusted contact for this event. You may want to check in on them.</p><p>WhoWe has not contacted emergency services.</p>`,
          });
          await appendAuditLog({
            caseId: null,
            action: "trusted_contact_notified",
            actorId: null,
            subjectId: userId,
            detail: `missed-checkout:${eventId}`,
          });
          contactsNotified++;
        }
      }
      await doc.ref.update({ trustedContactNotifiedAt: FieldValue.serverTimestamp() });
    }
  }

  return { remindersSent, contactsNotified };
}
