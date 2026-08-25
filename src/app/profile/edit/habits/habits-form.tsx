"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateHabits } from "@/app/profile-actions";
import { Button } from "@/components/Button";
import { SingleChoice } from "@/components/SingleChoice";
import {
  SMOKING_STATUS,
  SMOKING_TOLERANCE,
  ALCOHOL_FREQUENCY,
  ALCOHOL_EVENT_PREFERENCE,
  DIETARY_PATTERNS,
} from "@/lib/habits";
import type { UserDTO } from "@/lib/users";

export function HabitsForm({ user }: { user: UserDTO }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [smokingStatus, setSmokingStatus] = useState(user.habits.smoking.status ?? "");
  const [smokingTolerance, setSmokingTolerance] = useState(user.habits.smoking.tolerance ?? "");
  const [vapingStatus, setVapingStatus] = useState(user.habits.vaping.status ?? "");
  const [vapingTolerance, setVapingTolerance] = useState(user.habits.vaping.tolerance ?? "");
  const [alcoholFrequency, setAlcoholFrequency] = useState(user.habits.alcohol.frequency ?? "");
  const [alcoholEventPreference, setAlcoholEventPreference] = useState(user.habits.alcohol.eventPreference ?? "");
  const [dietaryPattern, setDietaryPattern] = useState(user.dietary.pattern ?? "");
  const [allergies, setAllergies] = useState(user.dietary.allergies ?? "");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const formData = new FormData();
        if (smokingStatus) formData.append("smokingStatus", smokingStatus);
        if (smokingTolerance) formData.append("smokingTolerance", smokingTolerance);
        if (vapingStatus) formData.append("vapingStatus", vapingStatus);
        if (vapingTolerance) formData.append("vapingTolerance", vapingTolerance);
        if (alcoholFrequency) formData.append("alcoholFrequency", alcoholFrequency);
        if (alcoholEventPreference) formData.append("alcoholEventPreference", alcoholEventPreference);
        if (dietaryPattern) formData.append("dietaryPattern", dietaryPattern);
        if (allergies.trim()) formData.append("allergies", allergies.trim());
        await updateHabits(formData);
        router.push("/profile");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-md text-sm text-red-700">{error}</div>
      )}

      <div>
        <h3 className="font-display font-semibold mb-3">Smoking</h3>
        <div className="flex flex-col gap-4">
          <SingleChoice
            label="Your habits"
            hint="Private — used for matching only."
            options={SMOKING_STATUS}
            value={smokingStatus}
            onChange={setSmokingStatus}
          />
          <SingleChoice
            label="Comfort around it at events"
            hint="Helps us avoid recommending mismatched events."
            options={SMOKING_TOLERANCE}
            value={smokingTolerance}
            onChange={setSmokingTolerance}
          />
        </div>
      </div>

      <div>
        <h3 className="font-display font-semibold mb-3">Vaping</h3>
        <div className="flex flex-col gap-4">
          <SingleChoice
            label="Your habits"
            hint="Private — used for matching only."
            options={SMOKING_STATUS}
            value={vapingStatus}
            onChange={setVapingStatus}
          />
          <SingleChoice
            label="Comfort around it at events"
            hint="Helps us avoid recommending mismatched events."
            options={SMOKING_TOLERANCE}
            value={vapingTolerance}
            onChange={setVapingTolerance}
          />
        </div>
      </div>

      <div>
        <h3 className="font-display font-semibold mb-3">Alcohol</h3>
        <div className="flex flex-col gap-4">
          <SingleChoice
            label="How often you drink"
            hint="Private — used for matching only."
            options={ALCOHOL_FREQUENCY}
            value={alcoholFrequency}
            onChange={setAlcoholFrequency}
          />
          <SingleChoice
            label="Preference for events"
            hint="Hard deal-breakers exclude incompatible events; soft preferences just affect ranking."
            options={ALCOHOL_EVENT_PREFERENCE}
            value={alcoholEventPreference}
            onChange={setAlcoholEventPreference}
          />
        </div>
      </div>

      <div>
        <h3 className="font-display font-semibold mb-3">Dietary</h3>
        <div className="flex flex-col gap-4">
          <SingleChoice
            label="Dietary pattern"
            hint="Private — used for matching and event dietary info."
            options={DIETARY_PATTERNS}
            value={dietaryPattern}
            onChange={setDietaryPattern}
          />
          <div>
            <label htmlFor="allergies" className="text-sm font-medium block mb-2">
              Allergies or requirements <span className="font-normal text-muted">(optional)</span>
            </label>
            <textarea
              id="allergies"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value.slice(0, 300))}
              maxLength={300}
              rows={2}
              placeholder="e.g. severe peanut allergy"
              className="w-full border-2 border-foreground bg-background rounded-md px-4 py-2.5 outline-none text-base resize-none"
            />
            <p className="text-xs text-muted mt-1">
              Only shared with an event host when you explicitly authorize it for that event. WhoWe can&apos;t
              guarantee allergen-free preparation at any venue.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-4 border-t-2 border-foreground">
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? "Saving..." : "Save"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
