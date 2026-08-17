"use client";

import { useState } from "react";
import { setUserLocation } from "@/app/actions";
import { Button } from "@/components/Button";

type Status = "idle" | "requesting" | "done" | "error";

export function LocationPermission({
  initialLabel,
}: {
  initialLabel?: string | null;
}) {
  const [status, setStatus] = useState<Status>(initialLabel ? "done" : "idle");
  const [label, setLabel] = useState(initialLabel ?? null);
  const [error, setError] = useState<string | null>(null);

  function enable() {
    if (!("geolocation" in navigator)) {
      setStatus("error");
      setError("Your browser doesn't support location.");
      return;
    }

    setStatus("requesting");
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let resolvedLabel: string | null = null;
        try {
          const res = await fetch(`/api/geocode/reverse?lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          resolvedLabel = data.label ?? null;
        } catch {
          resolvedLabel = null;
        }

        await setUserLocation(latitude, longitude, resolvedLabel);
        setLabel(resolvedLabel);
        setStatus("done");
      },
      () => {
        setStatus("error");
        setError("Location permission was denied.");
      },
    );
  }

  if (status === "done") {
    return (
      <>
        <input type="hidden" name="locationEnabled" value="true" required />
        <div className="flex items-center gap-2 text-sm">
          <span className="text-accent">✓ 📍</span>
          <span className="text-accent font-medium">
            Location enabled{label ? ` near ${label}` : ""}
          </span>
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="secondary"
        onClick={enable}
        disabled={status === "requesting"}
        className="self-start disabled:opacity-50"
      >
        {status === "requesting" ? "Requesting…" : "Enable location"}
      </Button>
      {error && <p className="text-sm text-[#8c2f2f]">{error}</p>}
    </div>
  );
}
