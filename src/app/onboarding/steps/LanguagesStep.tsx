"use client";

import { LanguageSelector } from "@/components/LanguageSelector";
import type { OnboardingState, OnboardingAction } from "../onboarding-reducer";
import type { StepErrors } from "../validation";

type LanguagesStepProps = {
  state: OnboardingState;
  dispatch: React.Dispatch<OnboardingAction>;
  errors: StepErrors;
};

export function LanguagesStep({ state, dispatch, errors }: LanguagesStepProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Add at least one language and tell us how comfortable you are using it.</p>
      <LanguageSelector defaultLanguages={state.languages} onSelect={(languages) => dispatch({ type: "PATCH", patch: { languages } })} />
      <p className="text-xs text-muted">Your languages and proficiency are shown on your public profile.</p>
      {errors.languages && <p className="text-sm text-[#8c2f2f]">{errors.languages}</p>}
    </div>
  );
}
