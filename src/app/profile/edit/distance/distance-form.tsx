"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateMaxDistance } from "@/app/profile-actions";
import { Button } from "@/components/Button";
import { MIN_MAX_DISTANCE_KM, MAX_MAX_DISTANCE_KM } from "@/lib/users";

export function DistanceForm({ defaultMaxDistance }: { defaultMaxDistance: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [maxDistance, setMaxDistance] = useState(defaultMaxDistance);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("maxDistance", String(maxDistance));
        await updateMaxDistance(formData);
        router.push("/profile");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save search radius");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-md text-sm text-red-700">{error}</div>
      )}

      <div>
        <label htmlFor="maxDistance" className="text-sm font-medium block mb-2">
          Maximum distance
        </label>
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-semibold">{maxDistance} km</span>
        </div>
        <input
          id="maxDistance"
          type="range"
          min={MIN_MAX_DISTANCE_KM}
          max={MAX_MAX_DISTANCE_KM}
          step={5}
          value={maxDistance}
          onChange={(e) => setMaxDistance(Number(e.target.value))}
          aria-valuetext={`${maxDistance} kilometers`}
          className="w-full h-2 bg-surface border-2 border-foreground rounded-lg appearance-none cursor-pointer"
        />
        <div className="grid grid-cols-4 gap-2 text-xs text-muted text-center mt-2">
          <div>{MIN_MAX_DISTANCE_KM} km</div>
          <div>70 km</div>
          <div>135 km</div>
          <div>{MAX_MAX_DISTANCE_KM} km</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-4 border-t-2 border-foreground">
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? "Saving..." : "Save search radius"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
