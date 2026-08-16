import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserAttendances, getEventsByIds, type EventDTO } from "@/lib/events";
import { getLastMessagePreview } from "@/lib/chat";
import { getCurrentUser } from "@/lib/session";
import { FadeIn } from "@/components/FadeIn";
import { StaggerList, StaggerItem } from "@/components/StaggerList";

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
}

export default async function ChatsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const attendances = (await getUserAttendances(user.id)).filter((a) => a.status === "joined");
  const events = await getEventsByIds(attendances.map((a) => a.eventId));
  const myEvents = attendances.map((a) => events[a.eventId]).filter((e): e is EventDTO => e != null);

  const previews = await Promise.all(myEvents.map((event) => getLastMessagePreview(event.id)));
  const rows = myEvents
    .map((event, i) => ({ event, preview: previews[i] }))
    .sort((a, b) => {
      const at = (a.preview?.createdAt ?? a.event.startsAt).getTime();
      const bt = (b.preview?.createdAt ?? b.event.startsAt).getTime();
      return bt - at;
    });

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-10 py-10 flex flex-col gap-6">
      <FadeIn>
        <h1 className="text-4xl font-semibold tracking-tight">Chats</h1>
        <p className="text-muted mt-1.5">Conversations from every event you&apos;re part of.</p>
      </FadeIn>

      {rows.length === 0 ? (
        <FadeIn delay={0.06} className="py-16 text-center text-muted">
          No chats yet. Join an event to start talking with the group.
        </FadeIn>
      ) : (
        <StaggerList className="flex flex-col gap-2">
          {rows.map(({ event, preview }) => (
            <StaggerItem key={event.id}>
              <Link
                href={`/chats/${event.id}`}
                className="block bg-surface border-2 border-foreground rounded-lg px-4 py-3 shadow-[3px_3px_0_0_var(--foreground)] hover:shadow-[4px_4px_0_0_var(--foreground)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">{event.title}</div>
                  {preview && (
                    <span className="text-xs text-muted shrink-0">{formatTime(preview.createdAt)}</span>
                  )}
                </div>
                <p className="text-sm text-muted mt-1 truncate">
                  {preview
                    ? preview.isPoll
                      ? `${preview.senderName} started a poll`
                      : `${preview.senderName}: ${preview.content}`
                    : "No messages yet. Say hi to the group."}
                </p>
              </Link>
            </StaggerItem>
          ))}
        </StaggerList>
      )}
    </div>
  );
}
