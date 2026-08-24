import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { db } from "@/lib/firebase-admin";
import { pickWildCandidates } from "@/lib/wildMatch";
import { distanceKm, CHECK_IN_RADIUS_KM } from "@/lib/geo";
import { getBlockedUserIds, getBlockStatus } from "@/lib/moderation";
import { getUsersByIds } from "@/lib/users-server";
import { sendEmail } from "@/lib/email";

export type EventDTO = {
  id: string;
  title: string;
  description: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  startsAt: Date;
  category: string;
  createdAt: Date;
  creatorId: string;
  attendeeCount: number;
  ratingSum: number;
  ratingCount: number;
  ratingAvg: number | null;
  isWild: boolean;
  targetHeadcount: number | null;
  cancelledAt: Date | null;
  minAttendees: number | null;
  maxAttendees: number | null;
  isFree: boolean;
  price: number | null;
};

export type CheckInStatus = "checked-in" | "left";

export type AttendeeDTO = {
  userId: string;
  joinedAt: Date;
  checkInStatus: CheckInStatus | null;
};

export type RatingDTO = {
  raterId: string;
  score: number;
  comment: string | null;
  createdAt: Date;
};

export type AttendanceStatus = "joined" | "invited" | "declined";

export type AttendanceDTO = {
  eventId: string;
  joinedAt: Date;
  eventTitle: string;
  eventStartsAt: Date;
  eventCategory: string;
  eventCreatorId: string;
  status: AttendanceStatus;
  lastReadAt: Date | null;
  checkInStatus: CheckInStatus | null;
};

/**
 * The single source of truth for a user's event activity numbers — used by
 * the profile page (own and public), settings, and anywhere else that shows
 * "hosting"/"attending" counts, so they can't disagree with each other again.
 * `eventsHosted`/`eventsJoined` mirror exactly what the My Events page lists
 * (every joined attendance, including past and cancelled events — those stay
 * "yours", they just get a Cancelled badge there); `eventsAttended` is the
 * distinct, narrower count of events actually checked into.
 */
export type UserEventStats = {
  eventsHosted: number;
  eventsJoined: number;
  eventsAttended: number;
};

export async function getUserEventStats(userId: string): Promise<UserEventStats> {
  const joined = (await getUserAttendances(userId)).filter((a) => a.status === "joined");

  let eventsHosted = 0;
  let eventsJoined = 0;
  let eventsAttended = 0;
  for (const a of joined) {
    if (a.eventCreatorId === userId) {
      eventsHosted++;
    } else {
      eventsJoined++;
    }
    if (a.checkInStatus) eventsAttended++;
  }

  return { eventsHosted, eventsJoined, eventsAttended };
}

function toEventDTO(id: string, data: FirebaseFirestore.DocumentData): EventDTO {
  return {
    id,
    title: data.title,
    description: data.description,
    location: data.location,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    startsAt: data.startsAt.toDate(),
    category: data.category,
    createdAt: data.createdAt?.toDate() ?? new Date(0),
    creatorId: data.creatorId,
    attendeeCount: data.attendeeCount ?? 0,
    ratingSum: data.ratingSum ?? 0,
    ratingCount: data.ratingCount ?? 0,
    ratingAvg: data.ratingCount ? data.ratingSum / data.ratingCount : null,
    isWild: data.isWild ?? false,
    targetHeadcount: data.targetHeadcount ?? null,
    cancelledAt: data.cancelledAt?.toDate() ?? null,
    minAttendees: data.minAttendees ?? null,
    maxAttendees: data.maxAttendees ?? null,
    isFree: data.isFree ?? true,
    price: data.price ?? null,
  };
}

export async function listUpcomingEvents({
  category,
  q,
  viewerId,
}: {
  category?: string;
  q?: string;
  viewerId?: string;
}): Promise<EventDTO[]> {
  let query: FirebaseFirestore.Query = db
    .collection("events")
    .where("startsAt", ">=", Timestamp.now());

  if (category) {
    query = query.where("category", "==", category);
  }

  const snap = await query.orderBy("startsAt", "asc").limit(500).get();
  let events = snap.docs.map((d) => toEventDTO(d.id, d.data())).filter((e) => !e.cancelledAt);

  if (q) {
    const needle = q.toLowerCase();
    events = events.filter(
      (e) =>
        e.title.toLowerCase().includes(needle) ||
        e.description.toLowerCase().includes(needle) ||
        e.location.toLowerCase().includes(needle),
    );
  }

  if (viewerId) {
    const blockedIds = await getBlockedUserIds(viewerId);
    if (blockedIds.size > 0) {
      events = events.filter((e) => !blockedIds.has(e.creatorId));
    }
  }

  return events;
}

export async function getEvent(id: string): Promise<EventDTO | null> {
  const snap = await db.doc(`events/${id}`).get();
  if (!snap.exists) return null;
  return toEventDTO(snap.id, snap.data()!);
}

export async function getEventsByIds(ids: string[]): Promise<Record<string, EventDTO>> {
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length === 0) return {};

  const snaps = await db.getAll(...uniqueIds.map((id) => db.doc(`events/${id}`)));
  const result: Record<string, EventDTO> = {};
  for (const snap of snaps) {
    if (snap.exists) {
      result[snap.id] = toEventDTO(snap.id, snap.data()!);
    }
  }
  return result;
}

export async function getEventAttendees(eventId: string, viewerId?: string): Promise<AttendeeDTO[]> {
  const snap = await db
    .collection(`events/${eventId}/attendees`)
    .orderBy("joinedAt", "asc")
    .get();
  let attendees = snap.docs
    .filter((d) => d.data().status === "joined")
    .map((d) => ({
      userId: d.data().userId,
      joinedAt: d.data().joinedAt.toDate(),
      checkInStatus: (d.data().checkInStatus as CheckInStatus | undefined) ?? null,
    }));

  if (viewerId) {
    const blockedIds = await getBlockedUserIds(viewerId);
    if (blockedIds.size > 0) {
      attendees = attendees.filter((a) => !blockedIds.has(a.userId));
    }
  }

  return attendees;
}

export async function getAttendeeStatus(
  eventId: string,
  userId: string,
): Promise<AttendanceStatus | null> {
  const snap = await db.doc(`events/${eventId}/attendees/${userId}`).get();
  if (!snap.exists) return null;
  return (snap.data()!.status ?? "joined") as AttendanceStatus;
}

export async function getEventRatings(eventId: string): Promise<RatingDTO[]> {
  const snap = await db
    .collection(`events/${eventId}/ratings`)
    .orderBy("createdAt", "desc")
    .get();
  return snap.docs.map((d) => ({
    raterId: d.data().raterId,
    score: d.data().score,
    comment: d.data().comment ?? null,
    createdAt: d.data().createdAt.toDate(),
  }));
}

export async function getUserAttendances(userId: string): Promise<AttendanceDTO[]> {
  const snap = await db
    .collectionGroup("attendees")
    .where("userId", "==", userId)
    .orderBy("eventStartsAt", "asc")
    .get();

  return snap.docs.map((d) => {
    const data = d.data();
    return {
      eventId: d.ref.parent.parent!.id,
      joinedAt: data.joinedAt.toDate(),
      eventTitle: data.eventTitle,
      eventStartsAt: data.eventStartsAt.toDate(),
      eventCategory: data.eventCategory,
      eventCreatorId: data.eventCreatorId,
      status: (data.status ?? "joined") as AttendanceStatus,
      lastReadAt: data.lastReadAt?.toDate() ?? null,
      checkInStatus: (data.checkInStatus as CheckInStatus | undefined) ?? null,
    };
  });
}

/** Marks an event's chat as read up to now for this attendee — used to compute unread badges. */
export async function markChatRead(eventId: string, userId: string): Promise<void> {
  await db.doc(`events/${eventId}/attendees/${userId}`).set({ lastReadAt: FieldValue.serverTimestamp() }, { merge: true });
}

export async function createEvent(data: {
  title: string;
  description: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  startsAt: Date;
  category: string;
  creatorId: string;
  minAttendees: number | null;
  maxAttendees: number | null;
  isFree: boolean;
  price: number | null;
}): Promise<string> {
  const eventRef = db.collection("events").doc();

  await db.runTransaction(async (tx) => {
    tx.set(eventRef, {
      ...data,
      createdAt: FieldValue.serverTimestamp(),
      attendeeCount: 1,
      ratingSum: 0,
      ratingCount: 0,
      isWild: false,
    });
    tx.set(eventRef.collection("attendees").doc(data.creatorId), {
      userId: data.creatorId,
      status: "joined",
      joinedAt: FieldValue.serverTimestamp(),
      eventTitle: data.title,
      eventStartsAt: data.startsAt,
      eventCategory: data.category,
      eventCreatorId: data.creatorId,
    });
  });

  return eventRef.id;
}

export async function updateEvent(
  eventId: string,
  requesterId: string,
  data: {
    title: string;
    description: string;
    location: string;
    latitude: number | null;
    longitude: number | null;
    startsAt: Date;
    category: string;
    minAttendees: number | null;
    maxAttendees: number | null;
    isFree: boolean;
    price: number | null;
  },
): Promise<void> {
  const eventRef = db.doc(`events/${eventId}`);

  await db.runTransaction(async (tx) => {
    const eventSnap = await tx.get(eventRef);
    if (!eventSnap.exists) throw new Error("Event not found");
    const event = eventSnap.data()!;

    if (event.creatorId !== requesterId) throw new Error("Only the host can edit this event");
    if (event.isWild) throw new Error("Wild events can't be edited");
    if (event.cancelledAt) throw new Error("This event has been cancelled");

    tx.update(eventRef, { ...data });
    tx.set(
      eventRef.collection("attendees").doc(event.creatorId),
      { eventTitle: data.title, eventStartsAt: data.startsAt, eventCategory: data.category },
      { merge: true },
    );
  });
}

export async function cancelEvent(eventId: string, requesterId: string): Promise<void> {
  const eventRef = db.doc(`events/${eventId}`);

  await db.runTransaction(async (tx) => {
    const eventSnap = await tx.get(eventRef);
    if (!eventSnap.exists) throw new Error("Event not found");
    const event = eventSnap.data()!;

    if (event.creatorId !== requesterId) throw new Error("Only the host can cancel this event");
    if (event.cancelledAt) return; // already cancelled, idempotent no-op

    tx.update(eventRef, { cancelledAt: FieldValue.serverTimestamp() });
  });
}

/** Host-initiated removal of an attendee (distinct from the attendee leaving on their own). */
export async function removeAttendee(eventId: string, requesterId: string, attendeeId: string): Promise<void> {
  if (attendeeId === requesterId) throw new Error("Use leaveEvent to remove yourself");

  const eventRef = db.doc(`events/${eventId}`);
  const attendeeRef = eventRef.collection("attendees").doc(attendeeId);

  const didRemove = await db.runTransaction(async (tx) => {
    const eventSnap = await tx.get(eventRef);
    if (!eventSnap.exists) throw new Error("Event not found");
    if (eventSnap.data()!.creatorId !== requesterId) throw new Error("Only the host can remove an attendee");

    const attendeeSnap = await tx.get(attendeeRef);
    if (!attendeeSnap.exists || attendeeSnap.data()!.status !== "joined") return false; // idempotent no-op

    tx.delete(attendeeRef);
    tx.update(eventRef, { attendeeCount: FieldValue.increment(-1) });
    return true;
  });

  if (didRemove) {
    await inviteReplacementIfNeeded(eventRef);
  }
}

export async function createWildEventDoc(data: {
  location: string;
  latitude: number;
  longitude: number;
  startsAt: Date;
  targetHeadcount: number;
  creatorId: string;
  isFree: boolean;
  price: number | null;
}): Promise<string> {
  const eventRef = db.collection("events").doc();
  const title = "Wild meetup";

  await db.runTransaction(async (tx) => {
    tx.set(eventRef, {
      title,
      description: "",
      location: data.location,
      latitude: data.latitude,
      longitude: data.longitude,
      startsAt: data.startsAt,
      category: "Wild",
      creatorId: data.creatorId,
      isWild: true,
      targetHeadcount: data.targetHeadcount,
      isFree: data.isFree,
      price: data.price,
      createdAt: FieldValue.serverTimestamp(),
      attendeeCount: 1,
      ratingSum: 0,
      ratingCount: 0,
    });
    tx.set(eventRef.collection("attendees").doc(data.creatorId), {
      userId: data.creatorId,
      status: "joined",
      joinedAt: FieldValue.serverTimestamp(),
      eventTitle: title,
      eventStartsAt: data.startsAt,
      eventCategory: "Wild",
      eventCreatorId: data.creatorId,
    });
  });

  // The event itself is already committed at this point — a failure below
  // means some invites don't go out, not that event creation failed, so it's
  // logged and swallowed rather than thrown back to the caller.
  try {
    const blockedIds = await getBlockedUserIds(data.creatorId);
    const candidateIds = await pickWildCandidates(
      data.latitude,
      data.longitude,
      new Set([data.creatorId, ...blockedIds]),
      data.targetHeadcount - 1,
    );

    await Promise.all(
      candidateIds.map((candidateId) =>
        eventRef
          .collection("attendees")
          .doc(candidateId)
          .set({
            userId: candidateId,
            status: "invited",
            joinedAt: FieldValue.serverTimestamp(),
            eventTitle: title,
            eventStartsAt: data.startsAt,
            eventCategory: "Wild",
            eventCreatorId: data.creatorId,
          }),
      ),
    );

    const candidates = await getUsersByIds(candidateIds);
    await Promise.all(
      candidateIds.map((candidateId) => {
        const candidate = candidates[candidateId];
        if (!candidate?.email || !candidate.notifyEmail) return;
        return sendEmail({
          to: candidate.email,
          subject: "You've been invited to a Wild meetup",
          html: `<p>You've been invited to a Wild meetup near ${data.location} on ${data.startsAt.toLocaleString()}.</p><p><a href="https://whowe.live/">Respond on WhoWe</a></p>`,
        });
      }),
    );
  } catch (error) {
    console.error(`Failed to send Wild event invites for ${eventRef.id}:`, error);
  }

  return eventRef.id;
}

/** Invites exactly one replacement candidate if a Wild event is still under its target headcount. */
async function inviteReplacementIfNeeded(eventRef: FirebaseFirestore.DocumentReference) {
  const eventSnap = await eventRef.get();
  if (!eventSnap.exists) return;
  const event = eventSnap.data()!;
  if (!event.isWild) return;

  const attendeesSnap = await eventRef.collection("attendees").get();
  const activeCount = attendeesSnap.docs.filter((d) => d.data().status !== "declined").length;
  if (activeCount >= event.targetHeadcount) return;

  const excludeIds = new Set(attendeesSnap.docs.map((d) => d.id));
  excludeIds.add(event.creatorId);
  const blockedIds = await getBlockedUserIds(event.creatorId);
  blockedIds.forEach((id) => excludeIds.add(id));

  const [candidateId] = await pickWildCandidates(event.latitude, event.longitude, excludeIds, 1);
  if (!candidateId) return;

  try {
    await eventRef.collection("attendees").doc(candidateId).create({
      userId: candidateId,
      status: "invited",
      joinedAt: FieldValue.serverTimestamp(),
      eventTitle: event.title,
      eventStartsAt: event.startsAt,
      eventCategory: event.category,
      eventCreatorId: event.creatorId,
    });
  } catch {
    // Lost a race to another concurrent decline/leave picking the same
    // candidate. Harmless, the event may just stay one slot short.
  }
}

export async function joinEvent(eventId: string, userId: string) {
  const eventRef = db.doc(`events/${eventId}`);
  const attendeeRef = eventRef.collection("attendees").doc(userId);

  const eventForPreChecks = await eventRef.get();
  if (eventForPreChecks.exists) {
    const preCheckData = eventForPreChecks.data()!;
    if (preCheckData.cancelledAt) throw new Error("This event has been cancelled.");

    const blockStatus = await getBlockStatus(userId, preCheckData.creatorId as string);
    if (blockStatus !== "none") {
      throw new Error("You can't join this event.");
    }
  }

  await db.runTransaction(async (tx) => {
    const eventSnap = await tx.get(eventRef);
    if (!eventSnap.exists) throw new Error("Event not found");

    const attendeeSnap = await tx.get(attendeeRef);
    if (attendeeSnap.exists) return; // already joined, idempotent no-op

    const event = eventSnap.data()!;
    tx.set(attendeeRef, {
      userId,
      status: "joined",
      joinedAt: FieldValue.serverTimestamp(),
      eventTitle: event.title,
      eventStartsAt: event.startsAt,
      eventCategory: event.category,
      eventCreatorId: event.creatorId,
    });
    tx.update(eventRef, { attendeeCount: FieldValue.increment(1) });
  });
}

export async function leaveEvent(eventId: string, userId: string) {
  const eventRef = db.doc(`events/${eventId}`);
  const attendeeRef = eventRef.collection("attendees").doc(userId);

  const didLeave = await db.runTransaction(async (tx) => {
    const attendeeSnap = await tx.get(attendeeRef);
    if (!attendeeSnap.exists || attendeeSnap.data()!.status !== "joined") return false; // idempotent no-op

    tx.delete(attendeeRef);
    tx.update(eventRef, { attendeeCount: FieldValue.increment(-1) });
    return true;
  });

  if (didLeave) {
    await inviteReplacementIfNeeded(eventRef);
  }
}

/**
 * Checks a joined attendee in, but only if their submitted coordinates are
 * within CHECK_IN_RADIUS_KM of the event's venue — verified server-side so
 * the "I'm here" status other attendees see actually means something. The
 * one-time location point is stored on the attendee doc only (never exposed
 * to other users) as a "last known location" — not continuously tracked.
 */
export async function checkIntoEvent(
  eventId: string,
  userId: string,
  lat: number,
  lng: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const eventRef = db.doc(`events/${eventId}`);
  const attendeeRef = eventRef.collection("attendees").doc(userId);

  const [eventSnap, attendeeSnap] = await Promise.all([eventRef.get(), attendeeRef.get()]);
  if (!eventSnap.exists) return { ok: false, error: "Event not found." };
  if (!attendeeSnap.exists || attendeeSnap.data()!.status !== "joined") {
    return { ok: false, error: "Join this event before checking in." };
  }

  const event = eventSnap.data()!;
  if (event.latitude == null || event.longitude == null) {
    return { ok: false, error: "This event doesn't have a venue location set, so check-in isn't available." };
  }

  const distance = distanceKm({ lat, lng }, { lat: event.latitude, lng: event.longitude });
  if (distance > CHECK_IN_RADIUS_KM) {
    return { ok: false, error: "You need to be at the venue to check in." };
  }

  await attendeeRef.update({
    checkInStatus: "checked-in",
    checkedInAt: FieldValue.serverTimestamp(),
    checkedOutAt: null,
    lastKnownLocation: { lat, lng, capturedAt: FieldValue.serverTimestamp() },
  });

  return { ok: true };
}

export async function checkOutOfEvent(eventId: string, userId: string): Promise<void> {
  const attendeeRef = db.doc(`events/${eventId}/attendees/${userId}`);
  await attendeeRef.update({
    checkInStatus: "left",
    checkedOutAt: FieldValue.serverTimestamp(),
  });
}

export async function acceptWildInvite(eventId: string, userId: string) {
  const eventRef = db.doc(`events/${eventId}`);
  const attendeeRef = eventRef.collection("attendees").doc(userId);

  await db.runTransaction(async (tx) => {
    const attendeeSnap = await tx.get(attendeeRef);
    if (!attendeeSnap.exists || attendeeSnap.data()!.status !== "invited") return; // idempotent no-op

    tx.update(attendeeRef, { status: "joined" });
    tx.update(eventRef, { attendeeCount: FieldValue.increment(1) });
  });
}

export async function declineWildInvite(eventId: string, userId: string) {
  const eventRef = db.doc(`events/${eventId}`);
  const attendeeRef = eventRef.collection("attendees").doc(userId);

  const didDecline = await db.runTransaction(async (tx) => {
    const attendeeSnap = await tx.get(attendeeRef);
    if (!attendeeSnap.exists || attendeeSnap.data()!.status !== "invited") return false; // idempotent no-op

    tx.update(attendeeRef, { status: "declined" });
    return true;
  });

  if (didDecline) {
    await inviteReplacementIfNeeded(eventRef);
  }
}

export async function rateEvent(
  eventId: string,
  raterId: string,
  score: number,
  comment: string | null,
) {
  const eventRef = db.doc(`events/${eventId}`);
  const attendeeRef = eventRef.collection("attendees").doc(raterId);
  const ratingRef = eventRef.collection("ratings").doc(raterId);

  await db.runTransaction(async (tx) => {
    const eventSnap = await tx.get(eventRef);
    if (!eventSnap.exists) throw new Error("Event not found");
    const event = eventSnap.data()!;

    const attendeeSnap = await tx.get(attendeeRef);
    if (!attendeeSnap.exists || attendeeSnap.data()!.status !== "joined") {
      throw new Error("Only attendees can rate this event");
    }

    if (event.startsAt.toDate() > new Date()) {
      throw new Error("You can rate an event after it happens");
    }

    const ratingSnap = await tx.get(ratingRef);
    const prevScore: number | null = ratingSnap.exists ? ratingSnap.data()!.score : null;

    const hostRef = db.doc(`users/${event.creatorId}`);
    const hostSnap = await tx.get(hostRef);
    const host = hostSnap.data() ?? {};

    // all reads done, safe to write now
    const newRatingSum = (event.ratingSum ?? 0) - (prevScore ?? 0) + score;
    const newRatingCount = (event.ratingCount ?? 0) + (prevScore === null ? 1 : 0);

    tx.set(ratingRef, {
      raterId,
      score,
      comment,
      createdAt: ratingSnap.exists ? ratingSnap.data()!.createdAt : FieldValue.serverTimestamp(),
      creatorId: event.creatorId,
    });
    tx.update(eventRef, {
      ratingSum: newRatingSum,
      ratingCount: newRatingCount,
    });

    const newHostSum = (host.hostRatingSum ?? 0) - (prevScore ?? 0) + score;
    const newHostCount = (host.hostRatingCount ?? 0) + (prevScore === null ? 1 : 0);
    tx.update(hostRef, {
      hostRatingSum: newHostSum,
      hostRatingCount: newHostCount,
    });
  });
}

export function filterEventsByDistance(
  events: EventDTO[],
  userLat: number | null,
  userLng: number | null,
  maxDistanceKm: number | null,
): EventDTO[] {
  if (!userLat || !userLng || !maxDistanceKm) {
    return events;
  }

  return events.filter((event) => {
    if (!event.latitude || !event.longitude) return true;
    const distance = distanceKm(
      { lat: userLat, lng: userLng },
      { lat: event.latitude, lng: event.longitude },
    );
    return distance <= maxDistanceKm;
  });
}
