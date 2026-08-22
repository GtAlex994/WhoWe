import Link from "next/link";
import { redirect } from "next/navigation";
import { listUpcomingEvents, getUserAttendances, getEventsByIds, type EventDTO, filterEventsByDistance } from "@/lib/events";
import { getUsersByIds } from "@/lib/users-server";
import { FadeIn } from "@/components/FadeIn";
import { StaggerList, StaggerItem } from "@/components/StaggerList";
import { Button } from "@/components/Button";
import { CategoryTag } from "@/components/CategoryTag";
import { StarRating } from "@/components/StarRating";
import { WildInviteBanner } from "@/components/WildInviteBanner";
import { SearchForm } from "@/components/SearchForm";
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
  searchParams: Promise<{ q?: string; category?: string; near?: string; showAll?: string }>;
}) {
  const { q, category, near, showAll } = await searchParams;
  const currentUser = await getCurrentUser();

  // Redirect to onboarding if user is logged in but hasn't completed setup
  if (currentUser && !currentUser.onboardingCompletedAt) {
    redirect("/onboarding");
  }

  const allEvents = await listUpcomingEvents({ category, q });
  let events = allEvents;

  // Filter events by user's max distance preference
  let distanceFilterActive = false;
  if (showAll !== "1" && currentUser?.locationLat != null && currentUser?.locationLng != null) {
    const maxDistance = currentUser.matchingPreferences?.maxDistance || 50;
    events = filterEventsByDistance(events, currentUser.locationLat, currentUser.locationLng, maxDistance);
    distanceFilterActive = events.length < allEvents.length;
  }

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
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-10 flex flex-col gap-8">
      {pendingInvites.length > 0 && (
        <FadeIn delay={0.04}>
          <WildInviteBanner invites={pendingInvites} />
        </FadeIn>
      )}

      <FadeIn delay={0.04} className="hidden sm:block">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
          Upcoming events
        </h1>
        <p className="text-muted mt-4 text-lg max-w-xl">
          Small, casual plans. See what&apos;s happening nearby and join in.
        </p>
      </FadeIn>

      <FadeIn delay={0.08}>
        <SearchForm q={q} category={category} sortNear={sortNear} hasUserLocation={hasUserLocation} />
      </FadeIn>

      {eventsWithDistance.length === 0 ? (
        <FadeIn delay={0.16} className="py-16 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">We&apos;re still finding plans near you</h2>
          <p className="text-muted mt-3 max-w-md mx-auto">
            {currentUser && (currentUser.interests.length > 0 || currentUser.activities.length > 0) ? (
              <>
                Nothing matching{" "}
                {[...currentUser.interests, ...currentUser.activities].slice(0, 2).map((tag, i, arr) => (
                  <span key={tag}>
                    <strong>{tag}</strong>
                    {i < arr.length - 1 ? " or " : ""}
                  </span>
                ))}{" "}
                nearby right now. Try expanding your area, explore all events, or start something simple.
              </>
            ) : (
              "Try expanding your area, explore all events, or start something simple."
            )}
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <Link href="/events/new">
              <Button variant="primary">Start an event</Button>
            </Link>
            {distanceFilterActive && (
              <Link href="?showAll=1">
                <Button variant="secondary">Browse all events</Button>
              </Link>
            )}
            {currentUser && (
              <Link href="/profile/edit/basic">
                <Button variant="secondary">Adjust my area</Button>
              </Link>
            )}
          </div>
        </FadeIn>
      ) : (
        <StaggerList className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
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
                  <span>Hosted by @{creators[event.creatorId]?.username ?? "someone"}</span>
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
