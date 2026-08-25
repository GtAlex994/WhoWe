import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle, Users, DollarSign } from "lucide-react";
import {
  getEvent,
  getEventAttendees,
  getEventRatings,
  getAttendeeStatus,
  GENDER_POLICY_LABELS,
  GENDER_POLICY_REQUIRED_GENDER,
} from "@/lib/events";
import { getUsersByIds } from "@/lib/users-server";
import { getCurrentUser } from "@/lib/session";
import { joinEvent, leaveEvent, rateEvent, cancelEvent, removeAttendee } from "@/app/actions";
import { getHostRatings } from "@/lib/ratings";
import { CategoryTag } from "@/components/CategoryTag";
import { FadeIn } from "@/components/FadeIn";
import { StaggerList, StaggerItem } from "@/components/StaggerList";
import { Button } from "@/components/Button";
import { StarRating } from "@/components/StarRating";
import { EventRatingForm } from "@/components/EventRatingForm";
import { EventCheckIn } from "@/components/EventCheckIn";
import { distanceKm, formatDistance } from "@/lib/geo";

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

  const currentUser = await getCurrentUser();

  const [attendees, ratings] = await Promise.all([
    getEventAttendees(id, currentUser?.id),
    getEventRatings(id),
  ]);
  const peopleIds = [event.creatorId, ...attendees.map((a) => a.userId), ...ratings.map((r) => r.raterId)];
  const people = await getUsersByIds(peopleIds);
  const myAttendance = currentUser ? attendees.find((a) => a.userId === currentUser.id) : undefined;
  const isAttending = myAttendance != null;
  const isCreator = currentUser?.id === event.creatorId;
  const hasHappened = event.startsAt <= new Date();

  const myInviteStatus =
    event.isWild && currentUser && !isCreator && !isAttending
      ? await getAttendeeStatus(event.id, currentUser.id)
      : null;
  const isPendingInvite = myInviteStatus === "invited";

  const isGenderEligible =
    event.genderPolicy === "open" ||
    !currentUser ||
    currentUser.gender === GENDER_POLICY_REQUIRED_GENDER[event.genderPolicy];

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

  const capacityLabel =
    event.minAttendees != null && event.maxAttendees != null
      ? `${event.minAttendees}–${event.maxAttendees} people`
      : event.maxAttendees != null
        ? `Up to ${event.maxAttendees} people`
        : event.minAttendees != null
          ? `At least ${event.minAttendees} people`
          : null;

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
          <div className="flex items-center gap-3 flex-wrap mt-3">
            {capacityLabel && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted border-2 border-foreground rounded-full px-2.5 py-1">
                <Users size={12} />
                {capacityLabel}
              </span>
            )}
            {event.isFree ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent border-2 border-accent rounded-full px-2.5 py-1">
                Free
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground border-2 border-foreground rounded-full px-2.5 py-1">
                <DollarSign size={12} />
                {event.price} per person
              </span>
            )}
            {event.genderPolicy !== "open" && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground border-2 border-foreground rounded-full px-2.5 py-1">
                {GENDER_POLICY_LABELS[event.genderPolicy]}
              </span>
            )}
          </div>
          {event.genderPolicy !== "open" && (
            <p className="text-xs text-muted mt-2">
              Gender is self-declared by each member, not independently verified.
            </p>
          )}
        </FadeIn>

        {event.cancelledAt && (
          <FadeIn>
            <div className="bg-surface border-2 border-[#8c2f2f] rounded-lg px-4 py-3 text-sm text-[#8c2f2f] font-medium">
              This event was cancelled by the host.
            </div>
          </FadeIn>
        )}

        <FadeIn delay={0.06}>
          <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed">{event.description}</p>
        </FadeIn>

        <FadeIn delay={0.1} className="text-sm text-muted flex items-center gap-2 flex-wrap">
          <span>
            Hosted by{" "}
            {people[event.creatorId]?.username ? (
              <Link href={`/profile/${people[event.creatorId].username}`} className="text-primary underline hover:text-primary/80">
                @{people[event.creatorId].username}
              </Link>
            ) : (
              "someone"
            )}
          </span>
          {hostRating && <StarRating avg={hostRating.avg} count={hostRating.count} />}
        </FadeIn>

        <FadeIn delay={0.14}>
          {!currentUser ? (
            <a href="/sign-in">
              <Button variant="primary">Sign in to join</Button>
            </a>
          ) : isCreator ? (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-muted">You&apos;re hosting this event.</span>
              {!event.cancelledAt && (
                <>
                  {!event.isWild && (
                    <Link href={`/events/${event.id}/edit`}>
                      <Button variant="secondary" className="px-3 py-1.5 text-sm">
                        Edit
                      </Button>
                    </Link>
                  )}
                  <form action={cancelEvent.bind(null, event.id)}>
                    <Button type="submit" variant="danger" className="px-3 py-1.5 text-sm">
                      Cancel event
                    </Button>
                  </form>
                </>
              )}
            </div>
          ) : event.cancelledAt ? null : isAttending ? (
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
          ) : !isGenderEligible ? (
            <span className="inline-block text-sm text-muted">
              This event is {GENDER_POLICY_LABELS[event.genderPolicy].toLowerCase()}.
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
            <Link href={`/chats/${event.id}`}>
              <Button variant="secondary" className="w-full sm:w-auto">
                <MessageCircle size={16} />
                Join the event chat
              </Button>
            </Link>
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
                    <span className="font-medium">
                      {people[r.raterId]?.username ? (
                        <Link href={`/profile/${people[r.raterId].username}`} className="text-primary underline hover:text-primary/80">
                          @{people[r.raterId].username}
                        </Link>
                      ) : (
                        "someone"
                      )}
                    </span>
                    <StarRating avg={r.score} count={1} hideCount />
                  </div>
                  {r.comment && <p className="text-sm text-muted mt-1">{r.comment}</p>}
                </StaggerItem>
              ))}
            </StaggerList>
          </FadeIn>
        )}
      </div>

      <div className="flex flex-col gap-4 lg:sticky lg:top-24">
        {isAttending && (
          <FadeIn delay={0.08}>
            <EventCheckIn
              eventId={event.id}
              checkInStatus={myAttendance?.checkInStatus ?? null}
              venueLat={event.latitude}
              venueLng={event.longitude}
            />
          </FadeIn>
        )}

        <FadeIn delay={0.1}>
        <div className="bg-surface border-2 border-foreground rounded-lg p-5 shadow-[3px_3px_0_0_var(--foreground)]">
          <h2 className="text-sm font-medium mb-3 text-muted uppercase tracking-wide">
            {event.isWild
              ? `${event.attendeeCount} of ${event.targetHeadcount} going`
              : event.maxAttendees != null
                ? `${event.attendeeCount} of ${event.maxAttendees} going`
                : `${event.attendeeCount} ${event.attendeeCount === 1 ? "person" : "people"} going`}
          </h2>
          {!event.isWild && event.minAttendees != null && event.attendeeCount < event.minAttendees && (
            <p className="text-xs text-muted -mt-2 mb-3">
              Needs at least {event.minAttendees} to happen
            </p>
          )}
          <StaggerList className="flex flex-col gap-2">
            {attendees.map((a) => (
              <StaggerItem
                key={a.userId}
                className="border border-border rounded-md px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">
                    {people[a.userId]?.username ? (
                      <Link href={`/profile/${people[a.userId].username}`} className="text-primary underline hover:text-primary/80">
                        @{people[a.userId].username}
                      </Link>
                    ) : (
                      "someone"
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {a.checkInStatus === "checked-in" && (
                      <span className="text-xs text-accent font-medium">✓ Checked in</span>
                    )}
                    {isCreator && a.userId !== currentUser?.id && (
                      <form action={removeAttendee.bind(null, event.id, a.userId)}>
                        <button type="submit" className="text-xs text-[#8c2f2f] underline hover:no-underline">
                          Remove
                        </button>
                      </form>
                    )}
                  </div>
                </div>
                {people[a.userId]?.bio && <div className="text-sm text-muted">{people[a.userId]?.bio}</div>}
              </StaggerItem>
            ))}
          </StaggerList>
        </div>
        </FadeIn>
      </div>
    </div>
  );
}
