"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateActivities } from "@/app/profile-actions";
import { ChipSelector } from "@/components/ChipSelector";
import { Button } from "@/components/Button";

interface ActivitiesFormProps {
  activities: string[];
  defaultActivities: string[];
}

export function ActivitiesForm({ activities, defaultActivities }: ActivitiesFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string[]>(defaultActivities);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("activities", selected.join(","));
        await updateActivities(formData);
        router.push("/profile");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save activities");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <p className="text-sm text-muted mb-4">Select activities that match what you'd actually want to do</p>
        <ChipSelector items={activities} selected={selected} onChange={setSelected} />
        {selected.length === 0 && <p className="text-xs text-muted mt-3 italic">No activities selected yet</p>}
        {selected.length > 0 && <p className="text-xs text-muted mt-3">{selected.length} activities selected</p>}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-4 border-t-2 border-foreground">
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? "Saving..." : "Save activities"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
