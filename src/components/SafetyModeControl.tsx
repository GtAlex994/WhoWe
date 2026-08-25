"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { startSafetyMode, stopSafetyMode, updateSafetyModeLocation, requestSafetyHelp, checkOutOfEvent } from "@/app/actions";

const UPDATE_INTERVAL_MS = 3 * 60 * 1000;

type SafetyModeControlProps = {
  eventId: string;
  initialActive: boolean;
  isCheckedIn: boolean;
};

function formatRelative(date: Date | null): string {
  if (!date) return "Not yet";
  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.round(minutes / 60)}h ago`;
}

export function SafetyModeControl({ eventId, initialActive, isCheckedIn }: SafetyModeControlProps) {
  const [active, setActive] = useState(initialActive);
  const [lastUpdateAt, setLastUpdateAt] = useState<Date | null>(null);
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [helpSent, setHelpSent] = useState(false);
  const [isPending, startTransition] = useTransition();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function pushLocationUpdate() {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        updateSafetyModeLocation(eventId, latitude, longitude, Number.isFinite(accuracy) ? accuracy : null)
          .then(() => {
            setLastUpdateAt(new Date());
            setAccuracyMeters(Number.isFinite(accuracy) ? accuracy : null);
          })
          .catch(() => {
            // A single missed update isn't surfaced as an error — the next
            // interval tick retries. Matches the "best-effort" framing: one
            // failure doesn't mean Safety Mode silently died.
          });
      },
      () => {},
    );
  }

  useEffect(() => {
    if (!active) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    pushLocationUpdate();
    intervalRef.current = setInterval(pushLocationUpdate, UPDATE_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pushLocationUpdate closes over eventId only, which doesn't change
  }, [active, eventId]);

  const handleTurnOn = () => {
    setError(null);
    startTransition(async () => {
      try {
        await startSafetyMode(eventId);
        setActive(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't turn on Safety Mode. Try again.");
      }
    });
  };

  const handleTurnOff = () => {
    setError(null);
    startTransition(async () => {
      try {
        await stopSafetyMode(eventId);
        setActive(false);
        setLastUpdateAt(null);
        setAccuracyMeters(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't turn off Safety Mode. Try again.");
      }
    });
  };

  const handleCheckOut = () => {
    setError(null);
    startTransition(async () => {
      try {
        await checkOutOfEvent(eventId);
        setActive(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't check out. Try again.");
      }
    });
  };

  const handleHelp = () => {
    if (!window.confirm('This flags your event to WhoWe for urgent review. It does not contact emergency services — call them directly if you\'re in danger. Continue?')) {
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await requestSafetyHelp(eventId);
        setHelpSent(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't send that. Try again, or contact emergency services directly if you're in danger.");
      }
    });
  };

  if (!active) {
    return (
      <div className="border-2 border-foreground rounded-md p-4">
        <p className="text-sm font-medium">Safety Mode</p>
        <p className="text-xs text-muted mt-1">
          Can privately record your latest available location during this event and remind you to check out. It
          does not guarantee monitoring or emergency assistance. Off by default — browser background tracking is
          best-effort and may stop if you close this tab or lock your device.
        </p>
        <button
          type="button"
          onClick={handleTurnOn}
          disabled={isPending}
          className="mt-3 rounded-md border-2 border-foreground bg-surface px-4 py-2 text-sm font-medium shadow-[2px_2px_0_0_var(--foreground)] hover:shadow-[3px_3px_0_0_var(--foreground)] hover:-translate-x-px hover:-translate-y-px transition-all disabled:opacity-60 cursor-pointer"
        >
          {isPending ? "Turning on…" : "Turn on Safety Mode"}
        </button>
        {error && <p className="text-sm text-[#8c2f2f] mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div className="border-2 border-accent rounded-md p-4 bg-accent-soft/20">
      <p className="text-sm font-medium text-accent">● Safety Mode active</p>
      <div className="text-xs text-muted mt-1 space-y-0.5">
        <p>Last update: {formatRelative(lastUpdateAt)}</p>
        {accuracyMeters != null && <p>Accuracy: ~{Math.round(accuracyMeters)}m</p>}
      </div>
      <p className="text-xs text-muted mt-2">
        Best-effort while this tab stays open. Not a guarantee of monitoring or emergency assistance.
      </p>
      <div className="flex flex-wrap gap-2 mt-3">
        <button
          type="button"
          onClick={handleTurnOff}
          disabled={isPending}
          className="rounded-md border-2 border-foreground bg-surface px-3 py-1.5 text-xs font-medium shadow-[2px_2px_0_0_var(--foreground)] disabled:opacity-60 cursor-pointer"
        >
          Turn off
        </button>
        {isCheckedIn && (
          <button
            type="button"
            onClick={handleCheckOut}
            disabled={isPending}
            className="rounded-md border-2 border-foreground bg-surface px-3 py-1.5 text-xs font-medium shadow-[2px_2px_0_0_var(--foreground)] disabled:opacity-60 cursor-pointer"
          >
            Check out
          </button>
        )}
        <button
          type="button"
          onClick={handleHelp}
          disabled={isPending || helpSent}
          className="rounded-md border-2 border-[#8c2f2f] bg-[#8c2f2f] text-white px-3 py-1.5 text-xs font-medium disabled:opacity-60 cursor-pointer"
        >
          {helpSent ? "Help request sent" : "I need help"}
        </button>
      </div>
      {error && <p className="text-sm text-[#8c2f2f] mt-2">{error}</p>}
    </div>
  );
}
