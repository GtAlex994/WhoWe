"use client";

import { useState } from "react";
import { acceptWildInvite, declineWildInvite } from "@/app/actions";
import { Button } from "@/components/Button";
import type { EventDTO } from "@/lib/events";

function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function WildInviteBanner({ invites }: { invites: EventDTO[] }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = invites.filter((e) => !dismissed.has(e.id));
  if (visible.length === 0) return null;

  async function handle(eventId: string, action: (eventId: string) => Promise<void>) {
    setPendingId(eventId);
    try {
      await action(eventId);
      setDismissed((prev) => new Set(prev).add(eventId));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {visible.map((event) => (
        <div
          key={event.id}
          className="bg-accent-soft border-2 border-accent rounded-lg px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div>
            <div className="font-display text-lg font-semibold text-accent">
              You&apos;re invited to a Wild meetup
            </div>
            <div className="text-sm text-foreground/80 mt-1">
              {formatWhen(event.startsAt)} · {event.location}
            </div>
            <div className="text-xs text-muted mt-0.5">
              {event.attendeeCount} of {event.targetHeadcount} spots filled
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              type="button"
              variant="secondary"
              disabled={pendingId === event.id}
              onClick={() => handle(event.id, declineWildInvite)}
            >
              Decline
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={pendingId === event.id}
              onClick={() => handle(event.id, acceptWildInvite)}
            >
              Join
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
