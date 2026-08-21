import { db } from "@/lib/firebase-admin";
import { getUsersByIds } from "@/lib/users-server";
import { REACTION_EMOJI, type ReactionSummary } from "@/lib/reactions";
import { getUserAttendances } from "@/lib/events";

export type ChatMessageDTO = {
  id: string;
  content: string | null;
  createdAt: string;
  sender: { id: string; name: string };
  poll: {
    id: string;
    question: string;
    options: { id: string; label: string; voteCount: number }[];
    totalVotes: number;
    myVoteOptionId: string | null;
  } | null;
  reactions: ReactionSummary[];
};

export type MessagePreviewDTO = {
  content: string | null;
  senderName: string;
  createdAt: Date;
  isPoll: boolean;
};

export async function getLastMessagePreview(eventId: string): Promise<MessagePreviewDTO | null> {
  const snap = await db
    .collection(`events/${eventId}/messages`)
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  if (snap.empty) return null;

  const data = snap.docs[0].data();
  const senders = await getUsersByIds([data.senderId]);
  const sender = senders[data.senderId];
  return {
    content: data.content ?? null,
    senderName: sender?.username ? `@${sender.username}` : "someone",
    createdAt: data.createdAt.toDate(),
    isPoll: !!data.poll,
  };
}

/** Event IDs (among the user's joined events) with a message newer than they've read. */
export async function getUnreadEventIds(userId: string): Promise<Set<string>> {
  const attendances = (await getUserAttendances(userId)).filter((a) => a.status === "joined");

  const previews = await Promise.all(attendances.map((a) => getLastMessagePreview(a.eventId)));

  const unread = new Set<string>();
  attendances.forEach((a, i) => {
    const preview = previews[i];
    if (preview && (!a.lastReadAt || preview.createdAt > a.lastReadAt)) {
      unread.add(a.eventId);
    }
  });
  return unread;
}

export async function isEventAttendee(eventId: string, userId: string) {
  const snap = await db.doc(`events/${eventId}/attendees/${userId}`).get();
  return snap.exists && snap.data()?.status === "joined";
}

export async function getChatMessages(eventId: string, currentUserId: string): Promise<ChatMessageDTO[]> {
  const snap = await db
    .collection(`events/${eventId}/messages`)
    .orderBy("createdAt", "asc")
    .get();

  const senderIds = snap.docs.map((d) => d.data().senderId as string);
  const senders = await getUsersByIds(senderIds);

  return snap.docs.map((d) => {
    const data = d.data();
    const poll = data.poll as
      | { question: string; options: { id: string; label: string }[]; votes: Record<string, string> }
      | undefined;

    const reactions = data.reactions as Record<string, Record<string, true>> | undefined;

    return {
      id: d.id,
      content: data.content ?? null,
      createdAt: data.createdAt.toDate().toISOString(),
      sender: { id: data.senderId, name: senders[data.senderId]?.username ? `@${senders[data.senderId].username}` : "someone" },
      poll: poll
        ? {
            id: d.id,
            question: poll.question,
            options: poll.options.map((o) => ({
              id: o.id,
              label: o.label,
              voteCount: Object.values(poll.votes ?? {}).filter((optionId) => optionId === o.id).length,
            })),
            totalVotes: Object.keys(poll.votes ?? {}).length,
            myVoteOptionId: poll.votes?.[currentUserId] ?? null,
          }
        : null,
      reactions: REACTION_EMOJI.map((emoji) => {
        const voters = reactions?.[emoji] ?? {};
        return {
          emoji,
          count: Object.keys(voters).length,
          mine: !!voters[currentUserId],
        };
      }),
    };
  });
}
