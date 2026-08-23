"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { db, auth } from "@/lib/firebase-admin";
import { getCurrentUser, clearCurrentUser } from "@/lib/session";
import { sanitizeUsername } from "@/lib/users";
import { reserveUsername } from "@/lib/users-server";
import {
  createEvent as createEventDoc,
  createWildEventDoc,
  updateEvent as updateEventDb,
  cancelEvent as cancelEventDb,
  removeAttendee as removeAttendeeDb,
  joinEvent as joinEventDb,
  leaveEvent as leaveEventDb,
  rateEvent as rateEventDb,
  acceptWildInvite as acceptWildInviteDb,
  declineWildInvite as declineWildInviteDb,
  checkIntoEvent as checkIntoEventDb,
  checkOutOfEvent as checkOutOfEventDb,
  markChatRead as markChatReadDb,
  getEvent,
  getEventAttendees,
} from "@/lib/events";
import { getUsersByIds } from "@/lib/users-server";
import { CATEGORIES } from "@/lib/categories";
import { isEventAttendee } from "@/lib/chat";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";


export async function setUserLocation(lat: number, lng: number, label: string | null) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("Invalid coordinates");
  }

  await db.doc(`users/${user.id}`).update({
    locationLat: lat,
    locationLng: lng,
    locationLabel: label,
    locationVerifiedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath("/profile");
  revalidatePath("/settings");
  revalidatePath("/");
}

export async function signOut() {
  await clearCurrentUser();
  redirect("/sign-in");
}

export async function createEvent(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const rateLimit = await checkRateLimit(`create-event:${user.id}`, 10, 60 * 60 * 1000);
  if (!rateLimit.allowed) throw new Error("You're creating events too quickly. Please try again later.");

  const mode = String(formData.get("mode") ?? "standard");
  const location = String(formData.get("location") ?? "").trim();
  const startsAtRaw = String(formData.get("startsAt") ?? "");
  if (!location || !startsAtRaw) throw new Error("All fields are required");

  const startsAt = new Date(startsAtRaw);
  if (Number.isNaN(startsAt.getTime())) throw new Error("Invalid date");

  const latRaw = formData.get("latitude");
  const lngRaw = formData.get("longitude");
  const latitude = latRaw ? Number(latRaw) : null;
  const longitude = lngRaw ? Number(lngRaw) : null;

  if (mode === "wild") {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new Error("Pick a location from the suggestions so we know where to invite people to");
    }

    const targetHeadcount = Number(formData.get("targetHeadcount"));
    if (!Number.isInteger(targetHeadcount) || targetHeadcount < 2 || targetHeadcount > 12) {
      throw new Error("Number of people must be between 2 and 12");
    }

    const eventId = await createWildEventDoc({
      location,
      latitude: latitude as number,
      longitude: longitude as number,
      startsAt,
      targetHeadcount,
      creatorId: user.id,
    });

    revalidatePath("/");
    redirect(`/events/${eventId}`);
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "");

  if (!title || !description) throw new Error("All fields are required");
  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    throw new Error("Invalid category");
  }

  const eventId = await createEventDoc({
    title,
    description,
    location,
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    startsAt,
    category,
    creatorId: user.id,
  });

  revalidatePath("/");
  redirect(`/events/${eventId}`);
}

export async function updateEvent(eventId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const startsAtRaw = String(formData.get("startsAt") ?? "");
  const category = String(formData.get("category") ?? "");
  if (!title || !description || !location || !startsAtRaw) throw new Error("All fields are required");
  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    throw new Error("Invalid category");
  }

  const startsAt = new Date(startsAtRaw);
  if (Number.isNaN(startsAt.getTime())) throw new Error("Invalid date");

  const latRaw = formData.get("latitude");
  const lngRaw = formData.get("longitude");
  const latitude = latRaw ? Number(latRaw) : null;
  const longitude = lngRaw ? Number(lngRaw) : null;

  await updateEventDb(eventId, user.id, {
    title,
    description,
    location,
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    startsAt,
    category,
  });

  revalidatePath(`/events/${eventId}`);
  redirect(`/events/${eventId}`);
}

export async function cancelEvent(eventId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const [event, attendees] = await Promise.all([getEvent(eventId), getEventAttendees(eventId)]);

  await cancelEventDb(eventId, user.id);

  if (event) {
    const others = attendees.filter((a) => a.userId !== user.id);
    const people = await getUsersByIds(others.map((a) => a.userId));
    await Promise.all(
      others.map((a) => {
        const person = people[a.userId];
        if (!person?.email || !person.notifyEmail) return;
        return sendEmail({
          to: person.email,
          subject: `${event.title} was cancelled`,
          html: `<p>The host cancelled "${event.title}", which you were going to attend.</p>`,
        });
      }),
    );
  }

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/");
  revalidatePath("/my-events");
}

export async function removeAttendee(eventId: string, attendeeId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  await removeAttendeeDb(eventId, user.id, attendeeId);

  revalidatePath(`/events/${eventId}`);
}

export async function joinEvent(eventId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  await joinEventDb(eventId, user.id);

  const event = await getEvent(eventId);
  if (event && event.creatorId !== user.id) {
    const hosts = await getUsersByIds([event.creatorId]);
    const host = hosts[event.creatorId];
    if (host?.email && host.notifyEmail) {
      await sendEmail({
        to: host.email,
        subject: `@${user.username} joined ${event.title}`,
        html: `<p><strong>@${user.username}</strong> just joined your event "${event.title}".</p><p><a href="https://whowe.live/events/${eventId}">View the event</a></p>`,
      });
    }
  }

  revalidatePath(`/events/${eventId}`);
}

export async function leaveEvent(eventId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  await leaveEventDb(eventId, user.id);

  revalidatePath(`/events/${eventId}`);
}

export async function checkIntoEvent(eventId: string, lat: number, lng: number) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("Invalid coordinates");
  }

  const result = await checkIntoEventDb(eventId, user.id, lat, lng);
  if (!result.ok) throw new Error(result.error);

  revalidatePath(`/events/${eventId}`);
}

export async function checkOutOfEvent(eventId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  await checkOutOfEventDb(eventId, user.id);

  revalidatePath(`/events/${eventId}`);
}

export async function acceptWildInvite(eventId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  await acceptWildInviteDb(eventId, user.id);

  revalidatePath("/");
  revalidatePath(`/events/${eventId}`);
}

export async function declineWildInvite(eventId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  await declineWildInviteDb(eventId, user.id);

  revalidatePath("/");
  revalidatePath(`/events/${eventId}`);
}

export async function updateProfile(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required");
  const bio = String(formData.get("bio") ?? "").trim();

  const usernameRaw = formData.get("username");
  let username: string | undefined;
  if (usernameRaw != null) {
    username = sanitizeUsername(String(usernameRaw));
    if (!username) throw new Error("Username is required");
  }

  const interestsRaw = formData.get("interests");
  const dislikesRaw = formData.get("dislikes");

  const userRef = db.doc(`users/${user.id}`);
  await db.runTransaction(async (tx) => {
    if (username !== undefined) {
      await reserveUsername(tx, user.id, username, user.username);
    }
    tx.update(userRef, {
      name,
      bio: bio || null,
      ...(username !== undefined ? { username } : {}),
      ...(interestsRaw != null ? { interests: String(interestsRaw).trim() || null } : {}),
      ...(dislikesRaw != null ? { dislikes: String(dislikesRaw).trim() || null } : {}),
    });
  });

  revalidatePath("/profile");
  revalidatePath("/settings");
  redirect("/profile");
}

export async function updateNotificationPreference(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const notifyEmail = formData.get("notifyEmail") === "on";

  await db.doc(`users/${user.id}`).update({ notifyEmail });

  revalidatePath("/settings");
}

export async function rateEvent(eventId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const score = Number(formData.get("score"));
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    throw new Error("Score must be between 1 and 5");
  }
  const comment = String(formData.get("comment") ?? "").trim();

  await rateEventDb(eventId, user.id, score, comment || null);

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/");
  revalidatePath("/profile");
}

export async function sendChatMessage(eventId: string, content: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const trimmed = content.trim();
  if (!trimmed) return;

  const allowed = await isEventAttendee(eventId, user.id);
  if (!allowed) throw new Error("Only attendees can chat on this event");

  const rateLimit = await checkRateLimit(`chat-message:${user.id}`, 30, 60 * 1000);
  if (!rateLimit.allowed) throw new Error("You're sending messages too quickly. Please slow down.");

  await db.collection(`events/${eventId}/messages`).add({
    senderId: user.id,
    content: trimmed,
    createdAt: FieldValue.serverTimestamp(),
  });
  await markChatReadDb(eventId, user.id);

  revalidatePath(`/chats/${eventId}`);
  revalidatePath("/chats");
}

export async function markChatRead(eventId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  await markChatReadDb(eventId, user.id);

  revalidatePath("/chats");
}

export async function createPoll(eventId: string, question: string, options: string[]) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const allowed = await isEventAttendee(eventId, user.id);
  if (!allowed) throw new Error("Only attendees can create a poll on this event");

  const trimmedQuestion = question.trim();
  if (!trimmedQuestion) throw new Error("Poll question is required");

  const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
  if (cleanOptions.length < 2) throw new Error("Add at least two options");

  await db.collection(`events/${eventId}/messages`).add({
    senderId: user.id,
    content: null,
    createdAt: FieldValue.serverTimestamp(),
    poll: {
      question: trimmedQuestion,
      options: cleanOptions.map((label) => ({ id: randomUUID(), label })),
      votes: {},
    },
  });

  revalidatePath(`/chats/${eventId}`);
  revalidatePath("/chats");
}

export async function votePoll(eventId: string, pollId: string, optionId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const allowed = await isEventAttendee(eventId, user.id);
  if (!allowed) throw new Error("Only attendees can vote");

  const messageRef = db.doc(`events/${eventId}/messages/${pollId}`);
  const snap = await messageRef.get();
  const poll = snap.data()?.poll as { options: { id: string; label: string }[] } | undefined;
  if (!poll) throw new Error("Poll not found");
  if (!poll.options.some((o) => o.id === optionId)) throw new Error("Invalid option");

  await messageRef.update({ [`poll.votes.${user.id}`]: optionId });

  revalidatePath(`/chats/${eventId}`);
}

export async function toggleReaction(eventId: string, messageId: string, emoji: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const allowed = await isEventAttendee(eventId, user.id);
  if (!allowed) throw new Error("Only attendees can react");

  const messageRef = db.doc(`events/${eventId}/messages/${messageId}`);
  const snap = await messageRef.get();
  if (!snap.exists) throw new Error("Message not found");

  const alreadyReacted = !!snap.data()?.reactions?.[emoji]?.[user.id];

  await messageRef.update({
    [`reactions.${emoji}.${user.id}`]: alreadyReacted ? FieldValue.delete() : true,
  });

  revalidatePath(`/chats/${eventId}`);
}

export async function deleteAccount() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const uid = user.id;

  // 1. Events this user created. recursiveDelete wipes their attendees/ratings/messages too.
  const ownedEvents = await db.collection("events").where("creatorId", "==", uid).get();
  for (const eventDoc of ownedEvents.docs) {
    await db.recursiveDelete(eventDoc.ref);
  }

  // 2. This user's own attendee/rating/message docs sitting in OTHER people's events.
  const bulkWriter = db.bulkWriter();

  const attendeeDocs = await db.collectionGroup("attendees").where("userId", "==", uid).get();
  for (const doc of attendeeDocs.docs) {
    bulkWriter.delete(doc.ref);
  }

  const ratingDocs = await db.collectionGroup("ratings").where("raterId", "==", uid).get();
  for (const doc of ratingDocs.docs) {
    const data = doc.data();
    bulkWriter.delete(doc.ref);
    bulkWriter.update(db.doc(`users/${data.creatorId}`), {
      hostRatingSum: FieldValue.increment(-data.score),
      hostRatingCount: FieldValue.increment(-1),
    });
    bulkWriter.update(doc.ref.parent.parent!, {
      ratingSum: FieldValue.increment(-data.score),
      ratingCount: FieldValue.increment(-1),
    });
  }

  const messageDocs = await db.collectionGroup("messages").where("senderId", "==", uid).get();
  for (const doc of messageDocs.docs) {
    bulkWriter.delete(doc.ref);
  }

  await bulkWriter.close();

  // 3. Release the username reservation.
  const userRef = db.doc(`users/${uid}`);
  const userSnap = await userRef.get();
  const username = userSnap.data()?.username;
  if (username) {
    await db.doc(`usernames/${username}`).delete();
  }

  // 4-5. Delete the Firestore user doc and the Firebase Auth user.
  await userRef.delete();
  await auth.deleteUser(uid);

  await clearCurrentUser();
  redirect("/sign-in");
}
