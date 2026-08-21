"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { checkIntoEvent, checkOutOfEvent } from "@/app/actions";
import { distanceKm, CHECK_IN_RADIUS_KM } from "@/lib/geo";
import type { CheckInStatus } from "@/lib/events";

type Proximity = "checking" | "near" | "far" | "unavailable";

type EventCheckInProps = {
  eventId: string;
  checkInStatus: CheckInStatus | null;
  venueLat: number | null;
  venueLng: number | null;
};

export function EventCheckIn({ eventId, checkInStatus, venueLat, venueLng }: EventCheckInProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const hasVenueCoords = venueLat != null && venueLng != null;
  const [proximity, setProximity] = useState<Proximity>(hasVenueCoords ? "checking" : "unavailable");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (checkInStatus === "checked-in" || venueLat == null || venueLng == null) return;
    // Every modern browser supports the Geolocation API; if it's somehow
    // missing there's no async callback to report that through, so the
    // button just stays in its "checking" state rather than forcing a
    // synchronous setState here.
    if (!("geolocation" in navigator)) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        const distance = distanceKm({ lat: latitude, lng: longitude }, { lat: venueLat, lng: venueLng });
        setProximity(distance <= CHECK_IN_RADIUS_KM ? "near" : "far");
      },
      () => setProximity("unavailable"),
    );
  }, [checkInStatus, venueLat, venueLng]);

  const handleCheckIn = () => {
    if (!coords) return;
    setError(null);
    startTransition(async () => {
      try {
        await checkIntoEvent(eventId, coords.lat, coords.lng);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't check in. Try again.");
      }
    });
  };

  const handleCheckOut = () => {
    setError(null);
    startTransition(async () => {
      try {
        await checkOutOfEvent(eventId);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't check out. Try again.");
      }
    });
  };

  if (checkInStatus === "checked-in") {
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-sm text-accent font-medium">✓ You&apos;re checked in</p>
        <button
          type="button"
          onClick={handleCheckOut}
          disabled={isPending}
          className="rounded-full border-2 border-foreground bg-surface px-6 py-3 text-sm font-medium shadow-[2px_2px_0_0_var(--foreground)] transition-all hover:shadow-[3px_3px_0_0_var(--foreground)] hover:-translate-x-px hover:-translate-y-px disabled:opacity-60"
        >
          {isPending ? "Checking out…" : "Check out"}
        </button>
        {error && <p className="text-sm text-[#8c2f2f]">{error}</p>}
      </div>
    );
  }

  if (proximity !== "near") return null;

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <button
        type="button"
        onClick={handleCheckIn}
        disabled={isPending}
        className="cursor-pointer rounded-full border-2 border-foreground bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-[2px_2px_0_0_var(--foreground)] transition-all hover:shadow-[3px_3px_0_0_var(--foreground)] hover:-translate-x-px hover:-translate-y-px disabled:cursor-not-allowed"
      >
        {isPending ? "Checking…" : "I'm here, check in"}
      </button>
      {error && <p className="text-sm text-[#8c2f2f]">{error}</p>}
      <p className="text-xs text-muted max-w-[220px]">
        We confirm you&apos;re near the venue using your location once, right now. We don&apos;t track you continuously.
      </p>
    </div>
  );
}
