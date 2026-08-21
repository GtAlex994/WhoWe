"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AvatarPersonalizePanel } from "@/components/AvatarPersonalizePanel";
import { SingleChoice } from "@/components/SingleChoice";
import { AVATAR_GENDERS, AVATAAARS_TOP, buildAvataaarsUrl, randomAvataaarsFeatures, type AvatarGender } from "@/lib/avatars";
import type { OnboardingState, OnboardingAction } from "../onboarding-reducer";
import type { StepErrors } from "../validation";

const GENDER_LABELS = AVATAR_GENDERS.map((g) => g.label);

type ProfileStepProps = {
  state: OnboardingState;
  dispatch: React.Dispatch<OnboardingAction>;
  errors: StepErrors;
};

export function ProfileStep({ state, dispatch, errors }: ProfileStepProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [personalizeOpen, setPersonalizeOpen] = useState(false);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const username = state.username.trim();
    if (username.length < 3) {
      dispatch({ type: "PATCH", patch: { usernameStatus: "idle" } });
      return;
    }

    dispatch({ type: "PATCH", patch: { usernameStatus: "checking" } });
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/auth/check-username", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });
        const data = await res.json();
        dispatch({ type: "PATCH", patch: { usernameStatus: data.available ? "available" : "taken" } });
      } catch {
        dispatch({ type: "PATCH", patch: { usernameStatus: "error" } });
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-check when the username text changes
  }, [state.username]);

  return (
    <div className="space-y-6">
      <div>
        <SingleChoice
          label="Gender"
          hint="Determines which avatar options you'll see below."
          options={GENDER_LABELS}
          value={state.gender ? (AVATAR_GENDERS.find((g) => g.id === state.gender)?.label ?? null) : null}
          onChange={(label) => {
            const newGender = (AVATAR_GENDERS.find((g) => g.label === label)?.id ?? "male") as AvatarGender;
            const top = AVATAAARS_TOP[newGender].includes(state.avatar.top) ? state.avatar.top : AVATAAARS_TOP[newGender][0];
            dispatch({ type: "PATCH", patch: { gender: newGender, avatar: { ...state.avatar, top } } });
          }}
          required
        />
        {errors.gender && <p className="text-sm text-[#8c2f2f] mt-1">{errors.gender}</p>}
      </div>

      <div>
        <label htmlFor="displayName" className="text-sm font-medium block mb-2">
          Full name
        </label>
        <input
          id="displayName"
          type="text"
          value={state.displayName}
          onChange={(e) => dispatch({ type: "PATCH", patch: { displayName: e.target.value } })}
          maxLength={40}
          autoFocus
          aria-describedby={errors.displayName ? "displayName-error" : undefined}
          className="w-full border-2 border-foreground bg-background rounded-md px-4 py-2.5 outline-none text-base"
        />
        <p className="text-xs text-muted mt-1">
          Private — only you will see this. Other members will know you by your username.
        </p>
        {errors.displayName && (
          <p id="displayName-error" className="text-sm text-[#8c2f2f] mt-1">
            {errors.displayName}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="username" className="text-sm font-medium block mb-2">
          Username
        </label>
        <input
          id="username"
          type="text"
          value={state.username}
          onChange={(e) =>
            dispatch({ type: "PATCH", patch: { username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") } })
          }
          maxLength={20}
          aria-describedby={errors.username ? "username-error" : "username-hint"}
          className="w-full border-2 border-foreground bg-background rounded-md px-4 py-2.5 outline-none text-base"
        />
        <p id="username-hint" className="text-xs text-muted mt-1">
          {state.username.length}/20 · lowercase letters, numbers, underscores. Can&apos;t be changed later.
        </p>
        {state.usernameStatus === "checking" && <p className="text-xs text-muted mt-1">Checking availability…</p>}
        {state.usernameStatus === "available" && <p className="text-xs text-accent mt-1">✓ Username available</p>}
        {errors.username && (
          <p id="username-error" className="text-sm text-[#8c2f2f] mt-1">
            {errors.username}
          </p>
        )}
      </div>

      <div>
        <p className="text-sm font-medium block mb-2">
          Avatar <span className="font-normal text-muted">(optional)</span>
        </p>
        {state.gender ? (
          <>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-surface border-2 border-foreground shrink-0">
                <Image src={buildAvataaarsUrl(state.avatar)} alt="Avatar preview" width={64} height={64} unoptimized />
              </div>
              <div className="flex flex-col gap-1 items-start">
                <button
                  type="button"
                  onClick={() => dispatch({ type: "PATCH", patch: { avatar: randomAvataaarsFeatures(state.gender as AvatarGender) } })}
                  className="text-sm text-muted hover:text-foreground underline"
                >
                  Shuffle look
                </button>
                <button
                  type="button"
                  onClick={() => setPersonalizeOpen(true)}
                  className="text-sm text-primary hover:text-primary/80 underline"
                >
                  Personalize avatar
                </button>
              </div>
            </div>
            <AvatarPersonalizePanel
              open={personalizeOpen}
              onClose={() => setPersonalizeOpen(false)}
              gender={state.gender}
              value={state.avatar}
              onChange={(avatar) => dispatch({ type: "PATCH", patch: { avatar } })}
            />
          </>
        ) : (
          <p className="text-sm text-muted">Select your gender above to see avatar options.</p>
        )}
      </div>

      <div>
        <label htmlFor="bio" className="text-sm font-medium block mb-2">
          A little about me… <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="bio"
          value={state.bio}
          onChange={(e) => dispatch({ type: "PATCH", patch: { bio: e.target.value.slice(0, 160) } })}
          maxLength={160}
          rows={3}
          placeholder="New to Adelaide and always up for coffee or a walk."
          className="w-full border-2 border-foreground bg-background rounded-md px-4 py-2.5 outline-none text-base resize-none"
        />
        <p className="text-xs text-muted mt-1">{state.bio.length}/160 characters</p>
      </div>
    </div>
  );
}
