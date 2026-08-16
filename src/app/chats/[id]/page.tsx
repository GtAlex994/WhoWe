import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getEvent } from "@/lib/events";
import { getChatMessages, isEventAttendee } from "@/lib/chat";
import { getCurrentUser } from "@/lib/session";
import { EventChat } from "@/components/EventChat";

export default async function EventChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const event = await getEvent(id);
  if (!event) notFound();

  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/sign-in");

  const isCreator = currentUser.id === event.creatorId;
  const allowed = isCreator || (await isEventAttendee(id, currentUser.id));
  if (!allowed) redirect(`/events/${id}`);

  const initialMessages = await getChatMessages(id, currentUser.id);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3 border-b-2 border-foreground shrink-0">
        <Link href={`/events/${id}`} aria-label="Back to event" className="text-muted hover:text-foreground">
          <ArrowLeft size={22} />
        </Link>
        <div className="font-display font-semibold truncate">{event.title}</div>
      </div>
      <EventChat eventId={id} currentUserId={currentUser.id} initialMessages={initialMessages} />
    </div>
  );
}
