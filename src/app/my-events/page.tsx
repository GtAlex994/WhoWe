import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserAttendances, getEventsByIds, type EventDTO } from "@/lib/events";
import { getCurrentUser } from "@/lib/session";
import { CategoryTag } from "@/components/CategoryTag";
import { FadeIn } from "@/components/FadeIn";
import { StaggerList, StaggerItem } from "@/components/StaggerList";
import { StarRating } from "@/components/StarRating";

function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function EventCard({ event }: { event: EventDTO }) {
  return (
    <Link
      href={`/events/${event.id}`}
      className="block bg-surface border-2 border-foreground rounded-lg px-4 py-3 shadow-[3px_3px_0_0_var(--foreground)] hover:shadow-[4px_4px_0_0_var(--foreground)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
    >
      <div className="font-medium">{event.title}</div>
      <div className="text-sm text-muted mt-0.5">{formatWhen(event.startsAt)}</div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <CategoryTag category={event.category} />
        {event.ratingCount > 0 && <StarRating avg={event.ratingAvg!} count={event.ratingCount} hideCount />}
      </div>
    </Link>
  );
}

export default async function MyEventsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const attendances = (await getUserAttendances(user.id)).filter((a) => a.status === "joined");
  const events = await getEventsByIds(attendances.map((a) => a.eventId));
  const orderedEvents = attendances.map((a) => events[a.eventId]).filter((e): e is EventDTO => e != null);

  const hosting = orderedEvents.filter((e) => e.creatorId === user.id);
  const attending = orderedEvents.filter((e) => e.creatorId !== user.id);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-10 flex flex-col gap-10">
      <FadeIn>
        <h1 className="text-4xl font-semibold tracking-tight">My events</h1>
        <p className="text-muted mt-1.5">Everything you&apos;re hosting or attending.</p>
      </FadeIn>

      <FadeIn delay={0.06}>
        <h2 className="text-sm font-medium text-muted mb-3 uppercase tracking-wide">
          Hosting ({hosting.length})
        </h2>
        {hosting.length === 0 ? (
          <p className="text-sm text-muted">
            You&apos;re not hosting anything yet.{" "}
            <Link href="/events/new" className="text-primary hover:underline">
              Start an event
            </Link>
            .
          </p>
        ) : (
          <StaggerList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {hosting.map((event) => (
              <StaggerItem key={event.id}>
                <EventCard event={event} />
              </StaggerItem>
            ))}
          </StaggerList>
        )}
      </FadeIn>

      <FadeIn delay={0.12}>
        <h2 className="text-sm font-medium text-muted mb-3 uppercase tracking-wide">
          Attending ({attending.length})
        </h2>
        {attending.length === 0 ? (
          <p className="text-sm text-muted">
            You haven&apos;t joined anything yet.{" "}
            <Link href="/" className="text-primary hover:underline">
              Browse events
            </Link>
            .
          </p>
        ) : (
          <StaggerList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {attending.map((event) => (
              <StaggerItem key={event.id}>
                <EventCard event={event} />
              </StaggerItem>
            ))}
          </StaggerList>
        )}
      </FadeIn>
    </div>
  );
}
