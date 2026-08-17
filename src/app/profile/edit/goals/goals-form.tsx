"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateGoals } from "@/app/profile-actions";
import { ChipSelector } from "@/components/ChipSelector";
import { Button } from "@/components/Button";

interface GoalsFormProps {
  goals: string[];
  defaultGoals: string[];
}

export function GoalsForm({ goals, defaultGoals }: GoalsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string[]>(defaultGoals);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("lookingFor", selected.join(","));
        await updateGoals(formData);
        router.push("/profile");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save goals");
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
        <p className="text-sm text-muted mb-4">Select one or more goals that apply to you</p>
        <ChipSelector items={goals} selected={selected} onChange={setSelected} />
        {selected.length === 0 && <p className="text-xs text-muted mt-3 italic">No goals selected yet</p>}
        {selected.length > 0 && <p className="text-xs text-muted mt-3">{selected.length} goals selected</p>}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-4 border-t-2 border-foreground">
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? "Saving..." : "Save goals"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
