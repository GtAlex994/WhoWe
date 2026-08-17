"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  username: string;
  avatarStyle: AvatarStyle;
  avatarSeed: string;
  languages: UserLanguage[];
  interests: string[];
  activities: string[];
  bio: string;
  maxDistance: number;
};

const STEPS = [
  {
    id: "name",
    title: "What's your name?",
    description: "Private — only you will see this. Others will know you by your username.",
    required: true,
    dataWeight: 15,
  },
  {
    id: "username",
    title: "Choose Your Username",
    description: "Your public identity. Other users will know you by this. Cannot be changed later.",
    required: true,
    dataWeight: 15,
  },
  {
    id: "avatar",
    title: "Choose Your Avatar",
    description: "Pick a style you like. You can always change it later.",
    required: true,
    dataWeight: 12,
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
    dataWeight: 20,
  },
  {
    id: "activities",
    title: "What Would You Actually Join?",
    description: "Select activities you'd genuinely do with other people.",
    required: true,
    dataWeight: 12,
  },
  {
    id: "maxDistance",
    title: "How Far Are You Willing To Go?",
    description: "Set the maximum distance for events you want to see",
    required: true,
    dataWeight: 11,
  },
  {
    id: "bio",
    title: "Tell Us About Yourself",
    description: "Optional bio - what else should people know?",
    required: false,
    dataWeight: 0,
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
    case "username":
      return !!data.username?.trim() && data.username.length >= 3;
    case "avatar":
      return !!data.avatarStyle && !!data.avatarSeed;
    case "languages":
      return !!data.languages && data.languages.length > 0;
    case "interests":
      return !!data.interests && data.interests.length >= 5;
    case "activities":
      return !!data.activities && data.activities.length >= 3;
    case "maxDistance":
      return data.maxDistance !== undefined && data.maxDistance > 0;
    case "bio":
      return true;
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
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [data, setData] = useState<Partial<OnboardingData>>({
    displayName: "",
    username: "",
    avatarStyle: "avataaars",
    avatarSeed: Math.random().toString(36).substring(7),
    languages: [],
    interests: [],
    activities: [],
    bio: "",
    maxDistance: 50,
  });

  const currentStep = STEPS[step];
  const progress = useMemo(() => calculateProgress(data), [data]);
  const canProceed = canProceedToNextStep(currentStep.id, data);
  const isLastStep = step === STEPS.length - 1;

  const handleNext = async () => {
    if (!canProceed && currentStep.required) return;

    if (isLastStep) {
      await handleComplete();
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 3) {
      setUsernameError("Username must be at least 3 characters");
      return false;
    }

    setCheckingUsername(true);
    setUsernameError(null);

    try {
      const res = await fetch("/api/auth/check-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const result = await res.json();

      if (!result.available) {
        setUsernameError("That username is taken. Try another one.");
        return false;
      }

      setUsernameError(null);
      return true;
    } catch (error) {
      console.error("Failed to check username:", error);
      setUsernameError("Error checking username availability");
      return false;
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameChange = (username: string) => {
    setData({ ...data, username });
    setUsernameError(null);
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      // Verify username one more time before submitting
      const isAvailable = await checkUsernameAvailability(data.username || "");
      if (!isAvailable) {
        setIsSubmitting(false);
        return;
      }

      // Save onboarding data
      const response = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to save onboarding data");
      }

      // Send verification email
      const emailRes = await fetch("/api/auth/send-verification-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!emailRes.ok) {
        throw new Error("Failed to send verification email");
      }

      // Redirect to email verification page
      router.push("/verify-email");
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      setIsSubmitting(false);
    }
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

            {currentStep.id === "username" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="username"
                    value={data.username || ""}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    autoFocus
                    disabled={checkingUsername}
                    className="w-full border-2 border-foreground bg-background rounded-md px-4 py-2.5 outline-none text-base disabled:opacity-50"
                  />
                  {usernameError && <p className="text-red-600 text-sm">{usernameError}</p>}
                  <p className="text-xs text-muted">
                    {data.username?.length || 0}/20 characters (letters, numbers, underscore)
                  </p>
                  <p className="text-xs text-accent font-medium bg-accent/10 p-2 rounded">
                    ⚠️ This cannot be changed once set. Choose carefully.
                  </p>
                </div>
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

            {currentStep.id === "maxDistance" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-semibold">{data.maxDistance} km</span>
                  <span className="text-sm text-muted">radius</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="200"
                  step="5"
                  value={data.maxDistance || 50}
                  onChange={(e) => setData({ ...data, maxDistance: parseInt(e.target.value) })}
                  className="w-full h-2 bg-surface border-2 border-foreground rounded-lg appearance-none cursor-pointer"
                />
                <div className="grid grid-cols-4 gap-2 text-xs text-muted text-center">
                  <div>5 km</div>
                  <div>70 km</div>
                  <div>135 km</div>
                  <div>200 km</div>
                </div>
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
            disabled={step === 0 || isSubmitting}
            className="disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Back
          </Button>
          <div className="flex gap-3">
            {!isLastStep && !currentStep.required && (
              <Button
                variant="secondary"
                onClick={handleNext}
                disabled={isSubmitting}
              >
                Skip
              </Button>
            )}
            <Button
              variant="primary"
              onClick={handleNext}
              disabled={(!canProceed && currentStep.required) || isSubmitting}
              className="disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Setting up..." : isLastStep ? "Complete Setup" : "Continue →"}
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
