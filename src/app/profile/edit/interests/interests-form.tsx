"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updateInterests } from "@/app/profile-actions";
import { ChipSelector } from "@/components/ChipSelector";
import { Button } from "@/components/Button";

interface InterestsFormProps {
  categories: string[];
  defaultInterests: string[];
  defaultDislikes: string[];
}

export function InterestsForm({ categories, defaultInterests, defaultDislikes }: InterestsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [interests, setInterests] = useState<string[]>(defaultInterests);
  const [dislikes, setDislikes] = useState<string[]>(defaultDislikes);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("interests", interests.join(","));
        formData.append("dislikes", dislikes.join(","));
        await updateInterests(formData);
        router.push("/profile");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save interests");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Things I enjoy */}
      <div>
        <h2 className="text-lg font-semibold mb-2">❤️ Things I enjoy</h2>
        <p className="text-sm text-muted mb-4">Select categories that describe your interests</p>
        <ChipSelector items={categories} selected={interests} onChange={setInterests} />
        {interests.length === 0 && <p className="text-xs text-muted mt-3 italic">No interests selected yet</p>}
      </div>

      {/* Things I'd rather avoid */}
      <div className="border-t-2 border-foreground pt-6">
        <h2 className="text-lg font-semibold mb-2">👎 Things I&apos;d rather avoid</h2>
        <p className="text-sm text-muted mb-4">Optional: Let us know what you&apos;re not into</p>
        <ChipSelector items={categories} selected={dislikes} onChange={setDislikes} />
        {dislikes.length === 0 && <p className="text-xs text-muted mt-3 italic">No dislikes selected yet</p>}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-4 border-t-2 border-foreground">
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? "Saving..." : "Save interests"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
