"use client";

import { useState } from "react";
import { Button } from "@/components/Button";

type Status = "idle" | "explaining" | "requesting" | "denied" | "error";

type LocationConsentButtonProps = {
  onLocated: (label: string, lat: number, lng: number) => void;
};

/**
 * "Use my current location" — shows the privacy explanation BEFORE the
 * browser permission prompt fires, and only requests geolocation after an
 * explicit second click. Never surfaces raw lat/lng to the user.
 */
export function LocationConsentButton({ onLocated }: LocationConsentButtonProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  function requestLocation() {
    if (!("geolocation" in navigator)) {
      setStatus("error");
      setError("Your browser doesn't support location. Enter your area manually instead.");
      return;
    }

    setStatus("requesting");
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`/api/geocode/reverse?lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (data.label) {
            onLocated(data.label, latitude, longitude);
            setStatus("idle");
          } else {
            setStatus("error");
            setError("We couldn't detect your location. Enter your area manually instead.");
          }
        } catch {
          setStatus("error");
          setError("We couldn't detect your location. Enter your area manually instead.");
        }
      },
      () => {
        setStatus("denied");
      },
    );
  }

  if (status === "idle" || status === "requesting") {
    return (
      <div className="rounded-md border-2 border-foreground/20 bg-surface p-3 space-y-2">
        <p className="text-xs text-muted">
          We&apos;ll only use this once, right now, to suggest your suburb — you can always type it manually instead.
          We show your suburb/city to others, never your exact coordinates, and you can change or remove it any time.
        </p>
        <Button type="button" variant="secondary" onClick={requestLocation} disabled={status === "requesting"}>
          {status === "requesting" ? "Requesting…" : "Share my location"}
        </Button>
      </div>
    );
  }

  if (status === "denied") {
    return <p className="text-sm text-muted">Location access wasn&apos;t granted. You can enter your suburb or city instead.</p>;
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-[#8c2f2f]">{error}</p>}
      <Button type="button" variant="secondary" onClick={requestLocation}>
        Try again
      </Button>
    </div>
  );
}
