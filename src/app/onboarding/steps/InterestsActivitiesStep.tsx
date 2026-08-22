"use client";

import { useState } from "react";
import { ChipSelector } from "@/components/ChipSelector";
import { INTEREST_CATEGORIES, getAllInterests } from "@/lib/interests";
import type { OnboardingState, OnboardingAction } from "../onboarding-reducer";
import type { StepErrors } from "../validation";

type InterestsActivitiesStepProps = {
  state: OnboardingState;
  dispatch: React.Dispatch<OnboardingAction>;
  errors: StepErrors;
};

export function InterestsActivitiesStep({ state, dispatch, errors }: InterestsActivitiesStepProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(INTEREST_CATEGORIES[0].name);
  const [dislikesOpen, setDislikesOpen] = useState(false);

  return (
    <div className="space-y-8">
      {/* Interests */}
      <div>
        <h2 className="font-display font-semibold text-lg mb-1">What are you into?</h2>
        <p className="text-sm text-muted mb-4">
          Pick at least 3. You can change these at any time. {state.interests.length} selected.
        </p>
        <div className="space-y-3">
          {INTEREST_CATEGORIES.map((category) => (
            <div
              key={category.name}
              className="border-2 border-foreground rounded-lg overflow-hidden shadow-[2px_2px_0_0_var(--foreground)]"
            >
              <button
                type="button"
                onClick={() => setExpandedCategory(expandedCategory === category.name ? null : category.name)}
                aria-expanded={expandedCategory === category.name}
                className="w-full flex items-center gap-3 p-3 hover:bg-surface-muted transition-colors"
              >
                <span className="text-xl" aria-hidden="true">
                  {category.emoji}
                </span>
                <span className="font-display font-medium flex-1 text-left">{category.name}</span>
                <span className={`transition-transform ${expandedCategory === category.name ? "rotate-180" : ""}`} aria-hidden="true">
                  ▼
                </span>
              </button>
              {expandedCategory === category.name && (
                <div className="p-3 border-t-2 border-foreground bg-surface-muted">
                  <ChipSelector
                    items={category.items}
                    selected={state.interests}
                    onChange={(interests) => dispatch({ type: "PATCH", patch: { interests } })}
                    disabledItems={state.dislikes}
                    ariaLabel={category.name}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        {errors.interests && <p className="text-sm text-[#8c2f2f] mt-2">{errors.interests}</p>}
      </div>

      {/* Dislikes (collapsed, optional) */}
      <div className="border-t-2 border-foreground pt-6">
        <button
          type="button"
          onClick={() => setDislikesOpen((v) => !v)}
          aria-expanded={dislikesOpen}
          className="flex items-center gap-2 font-display font-semibold text-left"
        >
          <span aria-hidden="true">{dislikesOpen ? "▾" : "▸"}</span>
          Anything you&apos;d rather avoid?
        </button>
        <p className="text-sm text-muted mt-1 mb-3">
          Optional. This helps us avoid recommending plans that aren&apos;t for you.
        </p>
        {dislikesOpen && (
          <ChipSelector
            items={getAllInterests()}
            selected={state.dislikes}
            onChange={(dislikes) => dispatch({ type: "PATCH", patch: { dislikes } })}
            disabledItems={state.interests}
            ariaLabel="Things to avoid"
          />
        )}
      </div>
    </div>
  );
}
