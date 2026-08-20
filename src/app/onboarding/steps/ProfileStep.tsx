"use client";

import { useEffect, useRef } from "react";
import { AvatarSelector } from "@/components/AvatarSelector";
import type { OnboardingState, OnboardingAction } from "../onboarding-reducer";
import type { StepErrors } from "../validation";

type ProfileStepProps = {
  state: OnboardingState;
  dispatch: React.Dispatch<OnboardingAction>;
  errors: StepErrors;
};

export function ProfileStep({ state, dispatch, errors }: ProfileStepProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        <label htmlFor="displayName" className="text-sm font-medium block mb-2">
          Display name
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
        <p className="text-sm font-medium block mb-2">Avatar</p>
        <AvatarSelector
          seed={state.avatarSeed}
          defaultStyle={state.avatarStyle}
          initials={state.displayName.charAt(0).toUpperCase() || "?"}
          onSelect={(avatarStyle, avatarSeed) => dispatch({ type: "PATCH", patch: { avatarStyle, avatarSeed } })}
        />
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
