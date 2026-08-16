import Link from "next/link";
import { notFound } from "next/navigation";
import { getEvent, getEventAttendees, getEventRatings, getAttendeeStatus } from "@/lib/events";
import { getUsersByIds } from "@/lib/users";
import { getCurrentUser } from "@/lib/session";
import { joinEvent, leaveEvent, rateEvent } from "@/app/actions";
import { getHostRatings } from "@/lib/ratings";
import { CategoryTag } from "@/components/CategoryTag";
import { FadeIn } from "@/components/FadeIn";
import { StaggerList, StaggerItem } from "@/components/StaggerList";
import { Button } from "@/components/Button";
import { StarRating } from "@/components/StarRating";
import { EventRatingForm } from "@/components/EventRatingForm";
import { distanceKm, formatDistance } from "@/lib/geo";
import { getChatMessages } from "@/lib/chat";
import { EventChat } from "@/components/EventChat";

function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const event = await getEvent(id);
  if (!event) notFound();

  const [attendees, ratings] = await Promise.all([getEventAttendees(id), getEventRatings(id)]);
  const peopleIds = [event.creatorId, ...attendees.map((a) => a.userId), ...ratings.map((r) => r.raterId)];
  const people = await getUsersByIds(peopleIds);

  const currentUser = await getCurrentUser();
  const isAttending = currentUser ? attendees.some((a) => a.userId === currentUser.id) : false;
  const isCreator = currentUser?.id === event.creatorId;
  const hasHappened = event.startsAt <= new Date();

  const myInviteStatus =
    event.isWild && currentUser && !isCreator && !isAttending
      ? await getAttendeeStatus(event.id, currentUser.id)
      : null;
  const isPendingInvite = myInviteStatus === "invited";

  const eventRatingSummary = event.ratingCount > 0 ? { avg: event.ratingAvg!, count: event.ratingCount } : null;
  const hostRatings = await getHostRatings([event.creatorId]);
  const hostRating = hostRatings[event.creatorId];
  const myRating = currentUser ? ratings.find((r) => r.raterId === currentUser.id) : undefined;

  const distance =
    currentUser?.locationLat != null &&
    currentUser?.locationLng != null &&
    event.latitude != null &&
    event.longitude != null
      ? distanceKm(
          { lat: currentUser.locationLat, lng: currentUser.locationLng },
          { lat: event.latitude, lng: event.longitude },
        )
      : null;

  const canChat = currentUser != null && (isAttending || isCreator);
  const initialMessages = canChat ? await getChatMessages(event.id, currentUser!.id) : [];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-10 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
      <div className="flex flex-col gap-6">
        <FadeIn>
          <div className="flex items-center gap-3 flex-wrap">
            <CategoryTag category={event.category} />
            {eventRatingSummary && <StarRating avg={eventRatingSummary.avg} count={eventRatingSummary.count} />}
          </div>
          <h1 className="text-4xl font-semibold tracking-tight mt-3">{event.title}</h1>
          <p className="text-muted mt-2 text-lg">{formatWhen(event.startsAt)}</p>
          <p className="text-muted">{event.location}</p>
          {distance != null && (
            <p className="text-accent text-sm font-medium mt-1">{formatDistance(distance)}</p>
          )}
        </FadeIn>

        <FadeIn delay={0.06}>
          <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed">{event.description}</p>
        </FadeIn>

        <FadeIn delay={0.1} className="text-sm text-muted flex items-center gap-2 flex-wrap">
          <span>Hosted by {people[event.creatorId]?.name ?? "someone"}</span>
          {hostRating && <StarRating avg={hostRating.avg} count={hostRating.count} />}
        </FadeIn>

        <FadeIn delay={0.14}>
          {!currentUser ? (
            <a href="/sign-in">
              <Button variant="primary">Sign in to join</Button>
            </a>
          ) : isCreator ? (
            <span className="inline-block text-sm text-muted">
              You&apos;re hosting this event.
            </span>
          ) : isAttending ? (
            <form action={leaveEvent.bind(null, event.id)}>
              <Button type="submit" variant="secondary">
                Leave event
              </Button>
            </form>
          ) : isPendingInvite ? (
            <span className="inline-block text-sm text-muted">
              You&apos;ve been invited to this Wild meetup. Respond from the invite banner
              on the <Link href="/" className="text-primary hover:underline">home page</Link>.
            </span>
          ) : event.isWild ? (
            <span className="inline-block text-sm text-muted">
              Spots on Wild meetups are filled by invite only.
            </span>
          ) : (
            <form action={joinEvent.bind(null, event.id)}>
              <Button type="submit" variant="primary">
                Join event
              </Button>
            </form>
          )}
        </FadeIn>

        {canChat && (
          <FadeIn delay={0.16}>
            <h2 className="text-sm font-medium mb-3 uppercase tracking-wide text-muted">
              Discussion
            </h2>
            <EventChat eventId={event.id} currentUserId={currentUser!.id} initialMessages={initialMessages} />
          </FadeIn>
        )}

        {hasHappened && (isAttending || isCreator) && (
          <FadeIn delay={0.18} className="border-t-2 border-border pt-6">
            <h2 className="text-sm font-medium mb-3 uppercase tracking-wide text-muted">
              {myRating ? "Your rating" : "Rate this event"}
            </h2>
            <EventRatingForm
              action={rateEvent.bind(null, event.id)}
              defaultScore={myRating?.score ?? 0}
              defaultComment={myRating?.comment ?? ""}
            />
          </FadeIn>
        )}

        {ratings.length > 0 && (
          <FadeIn delay={0.22}>
            <h2 className="text-sm font-medium mb-3 uppercase tracking-wide text-muted">
              What people said
            </h2>
            <StaggerList className="flex flex-col gap-2">
              {ratings.map((r) => (
                <StaggerItem key={r.raterId} className="border border-border rounded-md px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{people[r.raterId]?.name ?? "someone"}</span>
                    <StarRating avg={r.score} count={1} hideCount />
                  </div>
                  {r.comment && <p className="text-sm text-muted mt-1">{r.comment}</p>}
                </StaggerItem>
              ))}
            </StaggerList>
          </FadeIn>
        )}
      </div>

      <FadeIn delay={0.1}>
        <div className="bg-surface border-2 border-foreground rounded-lg p-5 shadow-[3px_3px_0_0_var(--foreground)] lg:sticky lg:top-24">
          <h2 className="text-sm font-medium mb-3 text-muted uppercase tracking-wide">
            {event.isWild
              ? `${event.attendeeCount} of ${event.targetHeadcount} going`
              : `${event.attendeeCount} ${event.attendeeCount === 1 ? "person" : "people"} going`}
          </h2>
          <StaggerList className="flex flex-col gap-2">
            {attendees.map((a) => (
              <StaggerItem
                key={a.userId}
                className="border border-border rounded-md px-3 py-2.5"
              >
                <div className="font-medium">{people[a.userId]?.name ?? "someone"}</div>
                {people[a.userId]?.bio && <div className="text-sm text-muted">{people[a.userId]?.bio}</div>}
              </StaggerItem>
            ))}
          </StaggerList>
        </div>
      </FadeIn>
    </div>
  );
}
