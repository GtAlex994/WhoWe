import type { OnboardingState } from "./onboarding-reducer";

export type StepErrors = Record<string, string>;

export function validateStep(stepId: string, state: OnboardingState): { valid: boolean; errors: StepErrors } {
  const errors: StepErrors = {};

  switch (stepId) {
    case "welcome":
      break;

    case "profile":
      if (!state.gender) errors.gender = "Select your gender.";
      if (!state.displayName.trim()) errors.displayName = "Enter your full name.";
      if (state.username.trim().length < 3) {
        errors.username = "Username must be at least 3 characters.";
      } else if (state.usernameStatus === "taken") {
        errors.username = "That username is already taken. Try another.";
      } else if (state.usernameStatus === "checking") {
        errors.username = "Still checking that username…";
      } else if (state.usernameStatus === "error") {
        errors.username = "We couldn't check that username. Try again.";
      } else if (state.usernameStatus !== "available") {
        errors.username = "Enter a username.";
      }
      break;

    case "area":
      if (!state.locationLabel || state.locationLat == null || state.locationLng == null) {
        errors.location = "Choose your area to continue.";
      }
      break;

    case "interests-activities":
      if (state.interests.length < 3) errors.interests = "Choose at least 3 interests to continue.";
      if (state.activities.length < 3) errors.activities = "Choose at least 3 activities to continue.";
      break;

    case "languages":
      if (state.languages.length < 1) {
        errors.languages = "Add at least one language and proficiency level.";
      }
      break;

    case "social-goals":
      if (!state.socialStyle.groupSize) errors.groupSize = "Choose a preferred group size.";
      if (state.lookingFor.length < 1) errors.lookingFor = "Choose at least one goal to continue.";
      break;

    case "safety-preview":
      if (!state.consent.termsAccepted) errors.termsAccepted = "You must agree to the community guidelines and terms.";
      if (!state.consent.safetyAcknowledged) errors.safetyAcknowledged = "Please confirm you've read the safety guidance.";
      break;

    default:
      break;
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
