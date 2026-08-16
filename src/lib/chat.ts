import { db } from "@/lib/firebase-admin";
import { getUsersByIds } from "@/lib/users";

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
};

export async function isEventAttendee(eventId: string, userId: string) {
  const snap = await db.doc(`events/${eventId}/attendees/${userId}`).get();
  return snap.exists;
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

    return {
      id: d.id,
      content: data.content ?? null,
      createdAt: data.createdAt.toDate().toISOString(),
      sender: { id: data.senderId, name: senders[data.senderId]?.name ?? data.senderName },
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
    };
  });
}
