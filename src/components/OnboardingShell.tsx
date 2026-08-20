"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/FadeIn";
import { STEPS } from "@/app/onboarding/constants";

type OnboardingShellProps = {
  currentStepIndex: number;
  stepTitle: string;
  whyWeAsk: string;
  required: boolean;
  progressPercent: number;
  onBack: () => void;
  onContinue: () => void;
  canContinue: boolean;
  isSubmitting?: boolean;
  continueLabel?: string;
  showSkip?: boolean;
  onSkip?: () => void;
  children: ReactNode;
};

export function OnboardingShell({
  currentStepIndex,
  stepTitle,
  whyWeAsk,
  required,
  progressPercent,
  onBack,
  onContinue,
  canContinue,
  isSubmitting = false,
  continueLabel = "Continue",
  showSkip = false,
  onSkip,
  children,
}: OnboardingShellProps) {
  const totalSteps = STEPS.length;
  const stepNumber = currentStepIndex + 1;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <FadeIn>
          <div className="mb-8">
            {/* Desktop: step labels */}
            <div className="hidden sm:flex items-center justify-between mb-3 text-xs text-muted">
              {STEPS.map((step, i) => (
                <span key={step.id} className={i === currentStepIndex ? "font-semibold text-foreground" : ""}>
                  {step.title.length > 20 ? `${i + 1}` : step.title}
                </span>
              ))}
            </div>
            {/* Mobile: compact "Step X of N" */}
            <p className="sm:hidden text-xs text-muted mb-2" aria-hidden="true">
              Step {stepNumber} of {totalSteps}
            </p>

            <div
              className="bg-surface rounded-lg h-2 overflow-hidden"
              role="progressbar"
              aria-valuenow={stepNumber}
              aria-valuemin={1}
              aria-valuemax={totalSteps}
              aria-label={`Onboarding progress: step ${stepNumber} of ${totalSteps}`}
            >
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(stepNumber / totalSteps) * 100}%` }} />
            </div>

            <div className="flex items-center justify-between mt-3">
              <h1 className="text-3xl font-semibold tracking-tight">{stepTitle}</h1>
              <span className="text-xs font-medium text-muted whitespace-nowrap ml-3">{progressPercent}% profile</span>
            </div>
            {whyWeAsk && <p className="text-muted mt-2">{whyWeAsk}</p>}
            <p className="text-xs text-muted mt-1 italic">{required ? "Required" : "Optional"}</p>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="bg-surface border-2 border-foreground rounded-lg p-6 mb-6 shadow-[3px_3px_0_0_var(--foreground)]">{children}</div>
        </FadeIn>

        <div className="flex gap-3 justify-between">
          <Button
            variant="secondary"
            onClick={onBack}
            disabled={currentStepIndex === 0 || isSubmitting}
            className="disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Back
          </Button>
          <div className="flex gap-3">
            {showSkip && (
              <Button variant="secondary" onClick={onSkip} disabled={isSubmitting}>
                Skip
              </Button>
            )}
            <Button
              variant="primary"
              onClick={onContinue}
              disabled={!canContinue || isSubmitting}
              className="disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving…" : continueLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
