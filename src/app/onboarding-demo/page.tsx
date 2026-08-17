"use client";

import { useState } from "react";
import { FadeIn } from "@/components/FadeIn";
import { Button } from "@/components/Button";
import { AvatarSelector } from "@/components/AvatarSelector";
import { LanguageSelector } from "@/components/LanguageSelector";
import { InterestsSelector } from "@/components/InterestsSelector";
import { ChipSelect } from "@/components/ChipSelect";

export default function OnboardingDemoPage() {
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState("Alex");

  const steps = [
    {
      title: "Choose Your Avatar",
      description: "Pick a style you like. You can always change it later.",
      component: <AvatarSelector seed={displayName} />,
    },
    {
      title: "What Languages Do You Speak?",
      description: "Select your languages and proficiency levels. You can add more anytime.",
      component: <LanguageSelector />,
    },
    {
      title: "What Are Your Interests?",
      description: "Pick at least 5 to help us find better matches for you.",
      component: <InterestsSelector minRequired={5} />,
    },
    {
      title: "What Would You Actually Join?",
      description: "Select activities you'd genuinely do with other people.",
      component: (
        <ChipSelect
          name="activities"
          options={[
            "Hiking",
            "Coffee",
            "Restaurants",
            "Gaming",
            "Sports",
            "Gym",
            "Movies",
            "Beach",
            "Road Trips",
            "Concerts",
          ]}
          minSelection={3}
        />
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <FadeIn>
          <div className="mb-8">
            <h1 className="text-4xl font-semibold tracking-tight">{steps[step].title}</h1>
            <p className="text-muted mt-2">{steps[step].description}</p>
            <div className="mt-4 bg-surface rounded-lg h-1.5 overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${((step + 1) / steps.length) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted mt-2">
              Step {step + 1} of {steps.length}
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <form className="bg-surface border-2 border-foreground rounded-lg p-6 mb-6">
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-2">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full border-2 border-foreground bg-background rounded-md px-4 py-2.5 outline-none"
                  />
                </div>
              </div>
            )}

            {steps[step].component}
          </form>
        </FadeIn>

        <div className="flex gap-3 justify-between">
          <Button
            variant="secondary"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Back
          </Button>
          <Button
            variant="primary"
            onClick={() => setStep(Math.min(steps.length - 1, step + 1))}
          >
            {step === steps.length - 1 ? "Complete" : "Continue →"}
          </Button>
        </div>

        <p className="text-xs text-muted text-center mt-6">
          This is a demo of key onboarding components. Provide feedback on UX/design!
        </p>
      </div>
    </div>
  );
}
