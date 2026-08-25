import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase-admin";
import { appendAuditLog } from "@/lib/audit-log";

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
