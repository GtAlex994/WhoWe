"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSocialStyle } from "@/app/profile-actions";
import { Button } from "@/components/Button";
import { ChipSelector } from "@/components/ChipSelector";
import { SingleChoice } from "@/components/SingleChoice";
import type { UserDTO } from "@/lib/users";

interface SocialStyleFormProps {
  user: UserDTO;
  groupSizes: string[];
  planningStyles: string[];
  activityVibes: string[];
  personalities: string[];
}

export function SocialStyleForm({
  user,
  groupSizes,
  planningStyles,
  activityVibes,
  personalities,
}: SocialStyleFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [groupSize, setGroupSize] = useState(user.socialStyle?.groupSize || "");
  const [planning, setPlanning] = useState(user.socialStyle?.planning || "");
  const [pace, setPace] = useState<string[]>(user.socialStyle?.pace ?? []);
  const [personality, setPersonality] = useState(user.socialStyle?.personality || "");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const formData = new FormData();
        if (groupSize) formData.append("groupSize", groupSize);
        if (planning) formData.append("planning", planning);
        if (pace.length > 0) formData.append("pace", pace.join(","));
        if (personality) formData.append("personality", personality);
        await updateSocialStyle(formData);
        router.push("/profile");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save social style");
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

      {/* Group Size */}
      <SingleChoice
        label="Group Size"
        hint="How many people do you prefer at events?"
        options={groupSizes}
        value={groupSize}
        onChange={setGroupSize}
      />

      {/* Planning Style */}
      <SingleChoice
        label="Planning Style"
        hint="How much notice do you prefer for events?"
        options={planningStyles}
        value={planning}
        onChange={setPlanning}
      />

      {/* Activity Vibe */}
      <div>
        <p className="text-sm font-medium block mb-2">Activity vibe</p>
        <p className="text-xs text-muted mb-3">What kind of energy are you looking for? Pick as many as apply.</p>
        <ChipSelector
          items={activityVibes}
          selected={pace}
          onChange={setPace}
          exclusiveItem="No preference"
          ariaLabel="Activity vibe"
        />
      </div>

      {/* Personality */}
      <SingleChoice
        label="Personality"
        hint="How would you describe yourself socially?"
        options={personalities}
        value={personality}
        onChange={setPersonality}
      />

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-4 border-t-2 border-foreground">
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? "Saving..." : "Save social style"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
