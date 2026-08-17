import Link from "next/link";
import { listUpcomingEvents, getUserAttendances, getEventsByIds, type EventDTO } from "@/lib/events";
import { getUsersByIds } from "@/lib/users";
import { CATEGORIES } from "@/lib/categories";
import { FadeIn } from "@/components/FadeIn";
import { StaggerList, StaggerItem } from "@/components/StaggerList";
import { Button } from "@/components/Button";
import { CategoryTag } from "@/components/CategoryTag";
import { StarRating } from "@/components/StarRating";
import { WildInviteBanner } from "@/components/WildInviteBanner";
import { getHostRatings } from "@/lib/ratings";
import { getCurrentUser } from "@/lib/session";
import { distanceKm, formatDistance } from "@/lib/geo";

function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; near?: string }>;
}) {
  const { q, category, near } = await searchParams;
  const currentUser = await getCurrentUser();

  const events = await listUpcomingEvents({ category, q });

  let pendingInvites: EventDTO[] = [];
  if (currentUser) {
    const invitedAttendances = (await getUserAttendances(currentUser.id)).filter(
      (a) => a.status === "invited",
    );
    const inviteEvents = await getEventsByIds(invitedAttendances.map((a) => a.eventId));
    pendingInvites = invitedAttendances
      .map((a) => inviteEvents[a.eventId])
      .filter((e): e is EventDTO => e != null);
  }

  const [hostRatings, creators] = await Promise.all([
    getHostRatings(events.map((e) => e.creatorId)),
    getUsersByIds(events.map((e) => e.creatorId)),
  ]);

  const hasUserLocation =
    currentUser?.locationLat != null && currentUser?.locationLng != null;

  const eventsWithDistance = events.map((event) => ({
    event,
    distance:
      hasUserLocation && event.latitude != null && event.longitude != null
        ? distanceKm(
            { lat: currentUser!.locationLat!, lng: currentUser!.locationLng! },
            { lat: event.latitude, lng: event.longitude },
          )
        : null,
  }));

  const sortNear = near === "1";
  if (sortNear) {
    eventsWithDistance.sort((a, b) => {
      if (a.distance == null) return 1;
      if (b.distance == null) return -1;
      return a.distance - b.distance;
    });
  }

  const otherParams = new URLSearchParams();
  if (q) otherParams.set("q", q);
  if (category) otherParams.set("category", category);
  const nearParams = new URLSearchParams(otherParams);
  nearParams.set("near", "1");

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10 flex flex-col gap-8">
      <FadeIn>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
          Upcoming events
        </h1>
        <p className="text-muted mt-4 text-lg max-w-xl">
          Small, casual plans. See what&apos;s happening nearby and join in.
        </p>
      </FadeIn>

      {pendingInvites.length > 0 && (
        <FadeIn delay={0.04}>
          <WildInviteBanner invites={pendingInvites} />
        </FadeIn>
      )}

      <FadeIn delay={0.08} className="flex flex-col gap-3">
        <form className="flex flex-col sm:flex-row gap-3" action="/">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search events, e.g. &quot;dinner&quot; or &quot;movie&quot;"
            className="flex-1 border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none"
          />
          <select
            name="category"
            defaultValue={category ?? ""}
            className="border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        {hasUserLocation && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted">Sort:</span>
            <Link
              href={`/?${otherParams.toString()}`}
              className={!sortNear ? "text-foreground font-medium" : "text-muted hover:text-foreground"}
            >
              Soonest
            </Link>
            <span className="text-border">·</span>
            <Link
              href={`/?${nearParams.toString()}`}
              className={sortNear ? "text-foreground font-medium" : "text-muted hover:text-foreground"}
            >
              Nearest
            </Link>
          </div>
        )}
      </FadeIn>

      {eventsWithDistance.length === 0 ? (
        <FadeIn delay={0.16} className="py-16 text-center text-muted">
          No events match yet.{" "}
          <Link href="/events/new" className="text-primary hover:underline">
            Start one
          </Link>
          .
        </FadeIn>
      ) : (
        <StaggerList className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {eventsWithDistance.map(({ event, distance }) => (
            <StaggerItem key={event.id}>
              <Link
                href={`/events/${event.id}`}
                className="h-full flex flex-col bg-surface border-2 border-foreground rounded-lg px-5 py-4 shadow-[3px_3px_0_0_var(--foreground)] hover:shadow-[5px_5px_0_0_var(--foreground)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="font-display text-lg font-semibold leading-snug">{event.title}</div>
                </div>
                <div className="text-sm text-muted mt-1.5">
                  {formatWhen(event.startsAt)} · {event.location}
                </div>
                {distance != null && (
                  <div className="text-xs text-accent mt-1 font-medium">{formatDistance(distance)}</div>
                )}
                <div className="mt-auto pt-4 flex items-center justify-between gap-2">
                  <CategoryTag category={event.category} />
                  <span className="text-xs text-muted shrink-0">
                    {event.attendeeCount} {event.attendeeCount === 1 ? "going" : "going"}
                  </span>
                </div>
                <div className="text-xs text-muted mt-1 flex items-center gap-2">
                  <span>Hosted by {creators[event.creatorId]?.name ?? "someone"}</span>
                  {hostRatings[event.creatorId] && (
                    <StarRating avg={hostRatings[event.creatorId].avg} count={hostRatings[event.creatorId].count} hideCount />
                  )}
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerList>
      )}
    </div>
  );
}
