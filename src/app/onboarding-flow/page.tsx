"use client";

import { useState, useMemo } from "react";
import { FadeIn } from "@/components/FadeIn";
import { Button } from "@/components/Button";
import { AvatarSelector } from "@/components/AvatarSelector";
import { LanguageSelector } from "@/components/LanguageSelector";
import { InterestsSelector } from "@/components/InterestsSelector";
import { ChipSelect } from "@/components/ChipSelect";
import { ACTIVITIES } from "@/lib/interests";
import { type AvatarStyle } from "@/lib/avatars";
import { type UserLanguage } from "@/lib/languages";

type OnboardingData = {
  displayName: string;
  avatarStyle: AvatarStyle;
  avatarSeed: string;
  languages: UserLanguage[];
  interests: string[];
  activities: string[];
  timezone: string;
  location: string;
  bio: string;
};

const STEPS = [
  {
    id: "name",
    title: "What's your name?",
    description: "This helps others recognize you",
    required: true,
    dataWeight: 15,
  },
  {
    id: "avatar",
    title: "Choose Your Avatar",
    description: "Pick a style you like. You can always change it later.",
    required: true,
    dataWeight: 10,
  },
  {
    id: "languages",
    title: "What Languages Do You Speak?",
    description: "Select your languages and proficiency levels.",
    required: true,
    dataWeight: 15,
  },
  {
    id: "interests",
    title: "What Are Your Interests?",
    description: "Pick at least 5 to help us find better matches for you.",
    required: true,
    dataWeight: 25,
  },
  {
    id: "activities",
    title: "What Would You Actually Join?",
    description: "Select activities you'd genuinely do with other people.",
    required: true,
    dataWeight: 20,
  },
  {
    id: "timezone",
    title: "When Are You Usually Available?",
    description: "Helps us find groups at times that work for you.",
    required: false,
    dataWeight: 5,
  },
  {
    id: "location",
    title: "Where Are You Located?",
    description: "Optional, but helps us show nearby events.",
    required: false,
    dataWeight: 5,
  },
  {
    id: "bio",
    title: "Tell Us About Yourself",
    description: "Optional bio - what else should people know?",
    required: false,
    dataWeight: 5,
  },
];

function calculateProgress(data: Partial<OnboardingData>): number {
  let totalWeight = 0;
  let completedWeight = 0;

  STEPS.forEach((step) => {
    totalWeight += step.dataWeight;

    const isComplete = isStepComplete(step.id, data);
    if (isComplete) {
      completedWeight += step.dataWeight;
    }
  });

  return Math.round((completedWeight / totalWeight) * 100);
}

function isStepComplete(stepId: string, data: Partial<OnboardingData>): boolean {
  switch (stepId) {
    case "name":
      return !!data.displayName?.trim();
    case "avatar":
      return !!data.avatarStyle && !!data.avatarSeed;
    case "languages":
      return !!data.languages && data.languages.length > 0;
    case "interests":
      return !!data.interests && data.interests.length >= 5;
    case "activities":
      return !!data.activities && data.activities.length >= 3;
    case "timezone":
      return !!data.timezone;
    case "location":
      return !!data.location;
    case "bio":
      return !!data.bio;
    default:
      return false;
  }
}

function canProceedToNextStep(currentStepId: string, data: Partial<OnboardingData>): boolean {
  const currentStep = STEPS.find((s) => s.id === currentStepId);
  if (!currentStep) return false;

  if (currentStep.required) {
    return isStepComplete(currentStepId, data);
  }
  return true;
}

export default function OnboardingFlowPage() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Partial<OnboardingData>>({
    displayName: "",
    avatarStyle: "avataaars",
    avatarSeed: Math.random().toString(36).substring(7),
    languages: [],
    interests: [],
    activities: [],
    timezone: "",
    location: "",
    bio: "",
  });

  const currentStep = STEPS[step];
  const progress = useMemo(() => calculateProgress(data), [data]);
  const canProceed = canProceedToNextStep(currentStep.id, data);
  const isLastStep = step === STEPS.length - 1;

  const handleNext = () => {
    if (!canProceed && currentStep.required) return;
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <FadeIn>
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-4xl font-semibold tracking-tight">{currentStep.title}</h1>
              <span className="text-sm font-medium text-muted">
                {step + 1}/{STEPS.length}
              </span>
            </div>
            <p className="text-muted mb-4">{currentStep.description}</p>

            <div className="space-y-2">
              <div className="bg-surface rounded-lg h-2 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted">{progress}% complete</p>
                {!currentStep.required && (
                  <span className="text-xs text-muted italic">Optional</span>
                )}
              </div>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <form className="bg-surface border-2 border-foreground rounded-lg p-6 mb-6">
            {currentStep.id === "name" && (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Your display name"
                  value={data.displayName || ""}
                  onChange={(e) => setData({ ...data, displayName: e.target.value })}
                  autoFocus
                  className="w-full border-2 border-foreground bg-background rounded-md px-4 py-2.5 outline-none text-base"
                />
              </div>
            )}

            {currentStep.id === "avatar" && (
              <AvatarSelector
                seed={data.avatarSeed || "seed"}
                defaultStyle={data.avatarStyle || "avataaars"}
                onSelect={(style, seed) => setData({ ...data, avatarStyle: style, avatarSeed: seed })}
              />
            )}

            {currentStep.id === "languages" && (
              <LanguageSelector
                defaultLanguages={data.languages || []}
                onSelect={(languages) => setData({ ...data, languages })}
              />
            )}

            {currentStep.id === "interests" && (
              <InterestsSelector
                defaultInterests={data.interests || []}
                onSelect={(interests) => setData({ ...data, interests })}
                minRequired={5}
              />
            )}

            {currentStep.id === "activities" && (
              <ChipSelect
                name="activities"
                options={ACTIVITIES}
                defaultValue={data.activities || []}
                onChange={(activities) => setData({ ...data, activities })}
                minSelection={3}
              />
            )}

            {currentStep.id === "timezone" && (
              <div className="space-y-3">
                <select
                  value={data.timezone || ""}
                  onChange={(e) => setData({ ...data, timezone: e.target.value })}
                  className="w-full border-2 border-foreground bg-background rounded-md px-4 py-2.5 outline-none text-base"
                >
                  <option value="">Select a timezone (optional)</option>
                  <option value="UTC-12">UTC-12 (Baker Island)</option>
                  <option value="UTC-11">UTC-11 (Samoa)</option>
                  <option value="UTC-10">UTC-10 (Hawaii)</option>
                  <option value="UTC-9">UTC-9 (Alaska)</option>
                  <option value="UTC-8">UTC-8 (Pacific)</option>
                  <option value="UTC-7">UTC-7 (Mountain)</option>
                  <option value="UTC-6">UTC-6 (Central)</option>
                  <option value="UTC-5">UTC-5 (Eastern)</option>
                  <option value="UTC-4">UTC-4 (Atlantic)</option>
                  <option value="UTC-3">UTC-3 (Brazil)</option>
                  <option value="UTC-2">UTC-2 (Mid-Atlantic)</option>
                  <option value="UTC-1">UTC-1 (Azores)</option>
                  <option value="UTC">UTC (GMT)</option>
                  <option value="UTC+1">UTC+1 (Europe)</option>
                  <option value="UTC+2">UTC+2 (Cairo)</option>
                  <option value="UTC+3">UTC+3 (Moscow)</option>
                  <option value="UTC+4">UTC+4 (Dubai)</option>
                  <option value="UTC+5">UTC+5 (Pakistan)</option>
                  <option value="UTC+5:30">UTC+5:30 (India)</option>
                  <option value="UTC+6">UTC+6 (Bangladesh)</option>
                  <option value="UTC+7">UTC+7 (Bangkok)</option>
                  <option value="UTC+8">UTC+8 (Singapore)</option>
                  <option value="UTC+9">UTC+9 (Tokyo)</option>
                  <option value="UTC+10">UTC+10 (Sydney)</option>
                  <option value="UTC+11">UTC+11 (Solomon Islands)</option>
                  <option value="UTC+12">UTC+12 (Fiji)</option>
                </select>
                <p className="text-xs text-muted">
                  {data.timezone && `Selected: ${data.timezone}`}
                </p>
              </div>
            )}

            {currentStep.id === "location" && (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="City, Country (optional)"
                  value={data.location || ""}
                  onChange={(e) => setData({ ...data, location: e.target.value })}
                  className="w-full border-2 border-foreground bg-background rounded-md px-4 py-2.5 outline-none text-base"
                />
                <p className="text-xs text-muted">
                  We'll use this to show nearby events and local groups.
                </p>
              </div>
            )}

            {currentStep.id === "bio" && (
              <div className="space-y-2">
                <textarea
                  placeholder="Tell us a bit about yourself... (optional)"
                  value={data.bio || ""}
                  onChange={(e) => setData({ ...data, bio: e.target.value })}
                  maxLength={500}
                  rows={4}
                  className="w-full border-2 border-foreground bg-background rounded-md px-4 py-2.5 outline-none text-base resize-none"
                />
                <p className="text-xs text-muted">
                  {(data.bio || "").length}/500 characters
                </p>
              </div>
            )}
          </form>
        </FadeIn>

        <div className="flex gap-3 justify-between">
          <Button
            variant="secondary"
            onClick={handleBack}
            disabled={step === 0}
            className="disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Back
          </Button>
          <div className="flex gap-3">
            {!isLastStep && !currentStep.required && (
              <Button
                variant="secondary"
                onClick={handleNext}
              >
                Skip
              </Button>
            )}
            <Button
              variant="primary"
              onClick={handleNext}
              disabled={!canProceed && currentStep.required}
              className="disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLastStep ? "Complete Setup" : "Continue →"}
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted text-center mt-6">
          Progress is based on data completion, not steps. Some fields matter more than others.
        </p>
      </div>
    </div>
  );
}
