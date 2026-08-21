"use client";

import { ChipSelector } from "@/components/ChipSelector";
import { SingleChoice } from "@/components/SingleChoice";
import { REQUIRED_GROUP_SIZES, PLANNING_STYLES, ACTIVITY_VIBES, PERSONALITIES, GOALS } from "@/lib/social";
import type { OnboardingState, OnboardingAction } from "../onboarding-reducer";
import type { StepErrors } from "../validation";

type SocialGoalsStepProps = {
  state: OnboardingState;
  dispatch: React.Dispatch<OnboardingAction>;
  errors: StepErrors;
};

export function SocialGoalsStep({ state, dispatch, errors }: SocialGoalsStepProps) {
  const patchSocialStyle = (patch: Partial<OnboardingState["socialStyle"]>) =>
    dispatch({ type: "PATCH", patch: { socialStyle: { ...state.socialStyle, ...patch } } });

  return (
    <div className="space-y-6">
      <SingleChoice
        label="Preferred group size"
        hint="How many people do you prefer at events?"
        options={REQUIRED_GROUP_SIZES}
        value={state.socialStyle.groupSize}
        onChange={(groupSize) => patchSocialStyle({ groupSize })}
        required
      />
      {errors.groupSize && <p className="text-sm text-[#8c2f2f] -mt-4">{errors.groupSize}</p>}

      <SingleChoice
        label="Planning style"
        hint="How much notice do you prefer for events?"
        options={PLANNING_STYLES}
        value={state.socialStyle.planning}
        onChange={(planning) => patchSocialStyle({ planning })}
      />

      <div>
        <p className="text-sm font-medium mb-1">
          Activity vibe <span className="font-normal text-muted">(optional)</span>
        </p>
        <p className="text-xs text-muted mb-2">What kind of energy are you looking for? Pick as many as apply.</p>
        <ChipSelector
          items={ACTIVITY_VIBES}
          selected={state.socialStyle.pace}
          onChange={(pace) => patchSocialStyle({ pace })}
          exclusiveItem="No preference"
        />
      </div>

      <SingleChoice
        label="Social style"
        hint="How would you describe yourself socially?"
        options={PERSONALITIES}
        value={state.socialStyle.personality}
        onChange={(personality) => patchSocialStyle({ personality })}
      />

      <div className="border-t-2 border-foreground pt-6">
        <p className="text-sm font-medium mb-1">What are you hoping to find?</p>
        <p className="text-xs text-muted mb-2">
          This helps us recommend relevant people and plans. You can update it whenever you like.
        </p>
        <ChipSelector items={GOALS} selected={state.lookingFor} onChange={(lookingFor) => dispatch({ type: "PATCH", patch: { lookingFor } })} />
        {errors.lookingFor && <p className="text-sm text-[#8c2f2f] mt-2">{errors.lookingFor}</p>}
      </div>
    </div>
  );
}
