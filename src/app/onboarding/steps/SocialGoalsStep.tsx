"use client";

import { ChipSelector } from "@/components/ChipSelector";
import { REQUIRED_GROUP_SIZES, PLANNING_STYLES, ACTIVITY_VIBES, PERSONALITIES, GOALS } from "@/lib/social";
import type { OnboardingState, OnboardingAction } from "../onboarding-reducer";
import type { StepErrors } from "../validation";

type SocialGoalsStepProps = {
  state: OnboardingState;
  dispatch: React.Dispatch<OnboardingAction>;
  errors: StepErrors;
};

function SingleChoice({
  label,
  hint,
  options,
  value,
  onChange,
  required,
}: {
  label: string;
  hint: string;
  options: string[];
  value: string | null;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <p className="text-sm font-medium mb-1">
        {label} {!required && <span className="font-normal text-muted">(optional)</span>}
      </p>
      <p className="text-xs text-muted mb-2">{hint}</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={value === option}
            onClick={() => onChange(option)}
            className={`text-sm font-medium px-3 py-1.5 rounded-md border-2 border-foreground transition-all ${
              value === option
                ? "bg-primary text-primary-foreground shadow-[1px_1px_0_0_var(--foreground)] translate-x-[1px] translate-y-[1px]"
                : "bg-surface shadow-[2px_2px_0_0_var(--foreground)] hover:shadow-[3px_3px_0_0_var(--foreground)] hover:-translate-x-px hover:-translate-y-px"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

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
        <ChipSelector items={ACTIVITY_VIBES} selected={state.socialStyle.pace} onChange={(pace) => patchSocialStyle({ pace })} />
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
