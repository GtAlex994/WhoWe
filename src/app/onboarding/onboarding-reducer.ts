import { randomAvataaarsFeatures, type AvatarGender, type AvataaarsFeatures } from "@/lib/avatars";
import type { UserLanguage } from "@/lib/languages";

export type UsernameStatus = "idle" | "checking" | "available" | "taken" | "error";

export type OnboardingState = {
  displayName: string;
  username: string;
  usernameStatus: UsernameStatus;
  avatar: AvataaarsFeatures;
  gender: AvatarGender | null;
  bio: string;

  locationLabel: string;
  locationLat: number | null;
  locationLng: number | null;
  locationPrecision: "city" | "suburb-and-city";

  interests: string[];
  activities: string[];
  dislikes: string[];

  languages: UserLanguage[];

  socialStyle: {
    groupSize: string | null;
    planning: string | null;
    pace: string[];
    personality: string | null;
  };
  lookingFor: string[];

  consent: {
    termsAccepted: boolean;
    safetyAcknowledged: boolean;
  };
};

export const initialOnboardingState: OnboardingState = {
  displayName: "",
  username: "",
  usernameStatus: "idle",
  avatar: randomAvataaarsFeatures("male"),
  gender: null,
  bio: "",

  locationLabel: "",
  locationLat: null,
  locationLng: null,
  locationPrecision: "city",

  interests: [],
  activities: [],
  dislikes: [],

  languages: [],

  socialStyle: {
    groupSize: null,
    planning: null,
    pace: [],
    personality: null,
  },
  lookingFor: [],

  consent: {
    termsAccepted: false,
    safetyAcknowledged: false,
  },
};

export type OnboardingAction = { type: "PATCH"; patch: Partial<OnboardingState> };

export function onboardingReducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
  switch (action.type) {
    case "PATCH":
      return { ...state, ...action.patch };
    default:
      return state;
  }
}
