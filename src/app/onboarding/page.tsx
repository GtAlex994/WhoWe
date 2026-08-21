"use client";

import { useReducer, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/FadeIn";
import { OnboardingShell } from "@/components/OnboardingShell";
import { calculateProfileCompletion } from "@/lib/users";
import { STEPS } from "./constants";
import { onboardingReducer, initialOnboardingState } from "./onboarding-reducer";
import { validateStep } from "./validation";
import { WelcomeStep } from "./steps/WelcomeStep";
import { ProfileStep } from "./steps/ProfileStep";
import { AreaStep } from "./steps/AreaStep";
import { InterestsActivitiesStep } from "./steps/InterestsActivitiesStep";
import { LanguagesStep } from "./steps/LanguagesStep";
import { SocialGoalsStep } from "./steps/SocialGoalsStep";
import { SafetyPreviewStep } from "./steps/SafetyPreviewStep";

export default function OnboardingPage() {
  const [stepIndex, setStepIndex] = useState(0);
  const [state, dispatch] = useReducer(onboardingReducer, initialOnboardingState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completedProfile, setCompletedProfile] = useState<{ percent: number } | null>(null);

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;
  const stepValidity = validateStep(step.id, state);

  const progressPercent = calculateProfileCompletion({
    name: state.displayName,
    username: state.username,
    avatar: { style: state.avatarStyle, seed: state.avatarSeed },
    locationLabel: state.locationLabel || null,
    interests: state.interests,
    activities: state.activities,
    languages: state.languages,
    socialStyle: state.socialStyle,
    lookingFor: state.lookingFor,
    bio: state.bio || null,
  });

  function focusFirstError(fieldErrors: Record<string, string>) {
    const firstField = Object.keys(fieldErrors)[0];
    if (!firstField) return;
    // Field ids don't always match error keys 1:1 (e.g. "location" covers a whole section) —
    // best-effort focus, falls back silently if no matching element exists.
    document.getElementById(firstField)?.focus();
  }

  function handleBack() {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });
      const text = await res.text();
      const body = text ? JSON.parse(text) : {};
      if (!res.ok) {
        setSubmitError(body.error ?? "Something went wrong. Please try again.");
        setIsSubmitting(false);
        return;
      }
      setCompletedProfile({ percent: progressPercent });
    } catch {
      setSubmitError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  function handleContinue() {
    const { valid, errors: fieldErrors } = validateStep(step.id, state);
    if (!valid) {
      setErrors(fieldErrors);
      focusFirstError(fieldErrors);
      return;
    }
    setErrors({});

    if (isLastStep) {
      handleSubmit();
    } else {
      setStepIndex(stepIndex + 1);
    }
  }

  if (completedProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <FadeIn>
          <div className="w-full max-w-md text-center space-y-6">
            <h1 className="text-4xl font-semibold tracking-tight">You&apos;re all set!</h1>
            <p className="text-muted">Your profile is {completedProfile.percent}% complete.</p>
            <div className="flex flex-col gap-3">
              <Link href="/">
                <Button variant="primary" className="w-full">
                  Find my first event
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="secondary" className="w-full">
                  View my profile
                </Button>
              </Link>
            </div>
          </div>
        </FadeIn>
      </div>
    );
  }

  return (
    <OnboardingShell
      currentStepIndex={stepIndex}
      stepTitle={step.title}
      whyWeAsk={step.whyWeAsk}
      required={step.required}
      progressPercent={progressPercent}
      onBack={handleBack}
      onContinue={handleContinue}
      canContinue={stepValidity.valid && !isSubmitting}
      isSubmitting={isSubmitting}
      continueLabel={isLastStep ? "Create my profile" : step.id === "welcome" ? "Get started" : "Continue"}
    >
      {submitError && (
        <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-md text-sm text-red-700">{submitError}</div>
      )}
      {step.id === "welcome" && <WelcomeStep />}
      {step.id === "profile" && <ProfileStep state={state} dispatch={dispatch} errors={errors} />}
      {step.id === "area" && <AreaStep state={state} dispatch={dispatch} errors={errors} />}
      {step.id === "interests-activities" && <InterestsActivitiesStep state={state} dispatch={dispatch} errors={errors} />}
      {step.id === "languages" && <LanguagesStep state={state} dispatch={dispatch} errors={errors} />}
      {step.id === "social-goals" && <SocialGoalsStep state={state} dispatch={dispatch} errors={errors} />}
      {step.id === "safety-preview" && <SafetyPreviewStep state={state} dispatch={dispatch} errors={errors} />}
    </OnboardingShell>
  );
}
