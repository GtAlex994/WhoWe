"use client";

import Link from "next/link";
import Image from "next/image";
import { buildAvataaarsUrl } from "@/lib/avatars";
import { applyLocationPrecision, calculateProfileCompletion } from "@/lib/users";
import type { OnboardingState, OnboardingAction } from "../onboarding-reducer";
import type { StepErrors } from "../validation";

const PRINCIPLES = [
  {
    title: "Always meet in public places",
    body: "Every event on WhoWe should be held somewhere public and populated: a restaurant, cafe, park, or venue. Never a private home on a first meetup.",
  },
  {
    title: "Trust your instincts",
    body: "If something about an event or a person feels off, don't go. You can back out of an event you've joined at any time.",
  },
  {
    title: "Tell someone your plans",
    body: "Before heading to a meetup with people you haven't met before, let a friend or family member know where you're going and with whom.",
  },
  {
    title: "Protect personal information",
    body: "Take your time sharing personal details until you've built some trust with someone.",
  },
];

type SafetyPreviewStepProps = {
  state: OnboardingState;
  dispatch: React.Dispatch<OnboardingAction>;
  errors: StepErrors;
};

export function SafetyPreviewStep({ state, dispatch, errors }: SafetyPreviewStepProps) {
  const publicLocation = applyLocationPrecision(state.locationLabel || null, state.locationPrecision);
  const completion = calculateProfileCompletion({
    name: state.displayName,
    username: state.username,
    avatar: { style: "avataaars", ...state.avatar },
    locationLabel: state.locationLabel || null,
    interests: state.interests,
    activities: state.activities,
    languages: state.languages,
    socialStyle: state.socialStyle,
    lookingFor: state.lookingFor,
    bio: state.bio || null,
  });

  return (
    <div className="space-y-8">
      {/* Safety */}
      <div>
        <h2 className="font-display font-semibold text-lg mb-3">A few things to keep in mind</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PRINCIPLES.map((p) => (
            <div
              key={p.title}
              className="bg-background border-2 border-foreground rounded-lg px-4 py-3 shadow-[2px_2px_0_0_var(--foreground)]"
            >
              <p className="font-display font-medium text-sm">{p.title}</p>
              <p className="text-xs text-muted mt-1 leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted mt-3">
          WhoWe is an early prototype. Identity verification isn&apos;t live yet.{" "}
          <Link href="/community-guidelines" className="underline">
            Read our full community guidelines
          </Link>{" "}
          and <Link href="/privacy" className="underline">privacy summary</Link>.
        </p>
      </div>

      {/* Profile preview */}
      <div className="border-t-2 border-foreground pt-6">
        <h2 className="font-display font-semibold text-lg mb-3">Here&apos;s your profile</h2>
        <div className="border-2 border-foreground rounded-lg p-4 space-y-4 shadow-[3px_3px_0_0_var(--foreground)]">
          <div className="flex items-center gap-3">
            <Image
              src={buildAvataaarsUrl(state.avatar)}
              alt=""
              width={56}
              height={56}
              unoptimized
              className="h-14 w-14 rounded-full border-2 border-foreground"
            />
            <div>
              <p className="font-semibold">@{state.username || "username"}</p>
              {publicLocation && <p className="text-xs text-muted">📍 {publicLocation}</p>}
            </div>
          </div>
          {state.bio && <p className="text-sm">{state.bio}</p>}
          {state.interests.length > 0 && (
            <div>
              <p className="text-xs text-muted mb-1">Interests</p>
              <div className="flex flex-wrap gap-1.5">
                {state.interests.map((i) => (
                  <span key={i} className="text-xs rounded-md border-2 border-foreground px-2 py-0.5 shadow-[1px_1px_0_0_var(--foreground)]">
                    {i}
                  </span>
                ))}
              </div>
            </div>
          )}
          {state.activities.length > 0 && (
            <div>
              <p className="text-xs text-muted mb-1">Activities</p>
              <div className="flex flex-wrap gap-1.5">
                {state.activities.map((a) => (
                  <span key={a} className="text-xs rounded-md border-2 border-foreground px-2 py-0.5 shadow-[1px_1px_0_0_var(--foreground)]">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}
          {state.languages.length > 0 && (
            <div>
              <p className="text-xs text-muted mb-1">Languages</p>
              <p className="text-sm">{state.languages.map((l) => `${l.language} (${l.proficiency})`).join(", ")}</p>
            </div>
          )}
        </div>

        <div className="mt-3 rounded-lg border-2 border-dashed border-foreground p-4">
          <p className="text-xs font-medium text-muted mb-2">Used for recommendations — only visible to you</p>
          <div className="text-sm space-y-1 text-muted">
            {state.dislikes.length > 0 && <p>Avoiding: {state.dislikes.join(", ")}</p>}
            {state.socialStyle.groupSize && <p>Preferred group size: {state.socialStyle.groupSize}</p>}
            {state.lookingFor.length > 0 && <p>Looking for: {state.lookingFor.join(", ")}</p>}
          </div>
        </div>
      </div>

      {/* Consent */}
      <div className="border-t-2 border-foreground pt-6 space-y-3">
        <label className="flex items-start gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={state.consent.safetyAcknowledged}
            onChange={(e) =>
              dispatch({ type: "PATCH", patch: { consent: { ...state.consent, safetyAcknowledged: e.target.checked } } })
            }
            className="mt-0.5"
          />
          <span>I&apos;ve read the event safety guidance above.</span>
        </label>
        {errors.safetyAcknowledged && <p className="text-sm text-[#8c2f2f]">{errors.safetyAcknowledged}</p>}

        <label className="flex items-start gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={state.consent.termsAccepted}
            onChange={(e) => dispatch({ type: "PATCH", patch: { consent: { ...state.consent, termsAccepted: e.target.checked } } })}
            className="mt-0.5"
          />
          <span>
            I agree to the{" "}
            <Link href="/community-guidelines" className="underline">
              community guidelines
            </Link>{" "}
            and confirm I meet WhoWe&apos;s minimum age requirement.
          </span>
        </label>
        {errors.termsAccepted && <p className="text-sm text-[#8c2f2f]">{errors.termsAccepted}</p>}

        <p className="text-xs text-muted pt-2">Your profile will be {completion}% complete.</p>
      </div>
    </div>
  );
}
