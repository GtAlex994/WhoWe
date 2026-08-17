"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSocialStyle } from "@/app/profile-actions";
import { Button } from "@/components/Button";
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
  const [pace, setPace] = useState(user.socialStyle?.pace || "");
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
        if (pace) formData.append("pace", pace);
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
      <div>
        <label htmlFor="groupSize" className="text-sm font-medium block mb-2">
          Group Size
        </label>
        <p className="text-xs text-muted mb-3">How many people do you prefer at events?</p>
        <select
          id="groupSize"
          value={groupSize}
          onChange={(e) => setGroupSize(e.target.value)}
          className="w-full border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none"
        >
          <option value="">Select...</option>
          {groupSizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      {/* Planning Style */}
      <div>
        <label htmlFor="planning" className="text-sm font-medium block mb-2">
          Planning Style
        </label>
        <p className="text-xs text-muted mb-3">How much notice do you prefer for events?</p>
        <select
          id="planning"
          value={planning}
          onChange={(e) => setPlanning(e.target.value)}
          className="w-full border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none"
        >
          <option value="">Select...</option>
          {planningStyles.map((style) => (
            <option key={style} value={style}>
              {style}
            </option>
          ))}
        </select>
      </div>

      {/* Activity Vibe */}
      <div>
        <label htmlFor="pace" className="text-sm font-medium block mb-2">
          Activity Vibe
        </label>
        <p className="text-xs text-muted mb-3">What kind of energy are you looking for?</p>
        <select
          id="pace"
          value={pace}
          onChange={(e) => setPace(e.target.value)}
          className="w-full border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none"
        >
          <option value="">Select...</option>
          {activityVibes.map((vibe) => (
            <option key={vibe} value={vibe}>
              {vibe}
            </option>
          ))}
        </select>
      </div>

      {/* Personality */}
      <div>
        <label htmlFor="personality" className="text-sm font-medium block mb-2">
          Personality
        </label>
        <p className="text-xs text-muted mb-3">How would you describe yourself socially?</p>
        <select
          id="personality"
          value={personality}
          onChange={(e) => setPersonality(e.target.value)}
          className="w-full border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none"
        >
          <option value="">Select...</option>
          {personalities.map((pers) => (
            <option key={pers} value={pers}>
              {pers}
            </option>
          ))}
        </select>
      </div>

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
