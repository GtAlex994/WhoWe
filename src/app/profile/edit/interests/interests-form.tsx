"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updateInterests } from "@/app/profile-actions";
import { ChipSelector } from "@/components/ChipSelector";
import { Button } from "@/components/Button";
import type { InterestCategory } from "@/lib/interests";

interface InterestsFormProps {
  categories: InterestCategory[];
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
      <div className="space-y-4">
        <div>
          <h2 className="font-display text-lg font-semibold mb-2">❤️ Things I enjoy</h2>
          <p className="text-sm text-muted mb-4">Select what describes your interests</p>
        </div>
        {categories.map((category) => (
          <div key={category.name} className="border-2 border-foreground rounded-lg p-3 shadow-[2px_2px_0_0_var(--foreground)]">
            <p className="text-sm font-medium mb-2">
              {category.emoji} {category.name}
            </p>
            <ChipSelector
              items={category.items}
              selected={interests}
              onChange={setInterests}
              disabledItems={dislikes}
              ariaLabel={category.name}
            />
          </div>
        ))}
        {interests.length === 0 && <p className="text-xs text-muted italic">No interests selected yet</p>}
      </div>

      {/* Things I'd rather avoid */}
      <div className="border-t-2 border-foreground pt-6 space-y-4">
        <div>
          <h2 className="font-display text-lg font-semibold mb-2">👎 Things I&apos;d rather avoid</h2>
          <p className="text-sm text-muted mb-4">Optional: Let us know what you&apos;re not into</p>
        </div>
        {categories.map((category) => (
          <div key={category.name} className="border-2 border-foreground rounded-lg p-3 shadow-[2px_2px_0_0_var(--foreground)]">
            <p className="text-sm font-medium mb-2">
              {category.emoji} {category.name}
            </p>
            <ChipSelector
              items={category.items}
              selected={dislikes}
              onChange={setDislikes}
              disabledItems={interests}
              ariaLabel={`${category.name} — avoid`}
            />
          </div>
        ))}
        {dislikes.length === 0 && <p className="text-xs text-muted italic">No dislikes selected yet</p>}
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
