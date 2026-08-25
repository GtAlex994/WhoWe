import type { UserLanguage } from "@/lib/languages";
import type { AvatarGender } from "@/lib/avatars";

export type UserDTO = {
  id: string;
  name: string;
  email: string | null;
  emailVerifiedAt: Date | null;
  phone: string | null;
  phoneVerifiedAt: Date | null;
  bio: string | null;
  avatar: {
    style: string;
    seed: string;
    // Present for accounts created after the avatar feature-picker shipped;
    // absent for older accounts still on the legacy random-seed avatar.
    top?: string;
    hairColor?: string;
    skinColor?: string;
    facialHair?: string;
    accessories?: string;
    clothes?: string;
    clothesColor?: string;
  } | null;
  gender: AvatarGender | null;
  createdAt: Date;
  onboardingCompletedAt: Date | null;
  notifyEmail: boolean;
  randomKey: number;

  // Profile fields (public-facing)
  interests: string[];
  activities: string[];
  languages: UserLanguage[];
  username: string | null;
  userId: string | null;

  // Social & lifestyle
  socialStyle: {
    personality: string | null;
    groupSize: string | null;
    pace: string[]; // "activity vibe" — multi-select
    planning: string | null;
  };
  availability: string[];
  lookingFor: string[];

  // Matching preferences (future)
  matchingPreferences: {
    ageRange: [number, number] | null;
    maxDistance: number | null;
    groupSize: string | null;
    preferredLanguages: string[];
    eventTypes: string[];
  };

  // Personal situation (future, optional)
  personalSituation: string[];

  // Private/sensitive fields (never public)
  dateOfBirth: string | null;
  locationLabel: string | null;
  locationLat: number | null;
  locationLng: number | null;
  locationVerifiedAt: Date | null;
  // Public display precision for locationLabel — defaults to the more
  // private "city" option; see applyLocationPrecision().
  locationPrecision: "city" | "suburb-and-city" | null;

  // Reputation/trust
  hostRatingSum: number;
  hostRatingCount: number;
  hostRatingAvg: number | null;

  // Things the user would rather avoid — mutually exclusive with `interests`.
  dislikes: string[];

  onboardingConsent: {
    termsAcceptedAt: Date | null;
    safetyAcknowledgedAt: Date | null;
  };
};

export function toUserDTO(id: string, data: FirebaseFirestore.DocumentData): UserDTO {
  return {
    id,
    name: data.name ?? "",
    email: data.email ?? null,
    emailVerifiedAt: data.emailVerifiedAt?.toDate() ?? null,
    phone: data.phone ?? null,
    phoneVerifiedAt: data.phoneVerifiedAt?.toDate() ?? null,
    bio: data.bio ?? null,
    avatar: data.avatar ?? null,
    gender: data.gender ?? null,
    createdAt: data.createdAt?.toDate() ?? new Date(0),
    onboardingCompletedAt: data.onboardingCompletedAt?.toDate() ?? null,
    notifyEmail: data.notifyEmail ?? true,
    randomKey: data.randomKey ?? 0,
    interests: data.interests ?? [],
    activities: data.activities ?? [],
    languages: data.languages ?? [],
    username: data.username ?? null,
    userId: data.userId ?? null,
    socialStyle: {
      personality: data.socialStyle?.personality ?? null,
      groupSize: data.socialStyle?.groupSize ?? null,
      // Older docs stored `pace` as a single string; coerce to the new array shape.
      pace: Array.isArray(data.socialStyle?.pace)
        ? data.socialStyle.pace
        : data.socialStyle?.pace
          ? [data.socialStyle.pace]
          : [],
      planning: data.socialStyle?.planning ?? null,
    },
    availability: data.availability ?? [],
    lookingFor: data.lookingFor ?? [],
    matchingPreferences: data.matchingPreferences ?? {
      ageRange: null,
      maxDistance: null,
      groupSize: null,
      preferredLanguages: [],
      eventTypes: [],
    },
    personalSituation: data.personalSituation ?? [],
    dateOfBirth: data.dateOfBirth ?? null,
    locationLabel: data.locationLabel ?? null,
    locationLat: data.locationLat ?? null,
    locationLng: data.locationLng ?? null,
    locationVerifiedAt: data.locationVerifiedAt?.toDate() ?? null,
    locationPrecision: data.locationPrecision ?? null,
    hostRatingSum: data.hostRatingSum ?? 0,
    hostRatingCount: data.hostRatingCount ?? 0,
    hostRatingAvg: data.hostRatingCount ? data.hostRatingSum / data.hostRatingCount : null,
    // Older docs stored `dislikes` as a comma-joined string; coerce to an array.
    dislikes: Array.isArray(data.dislikes) ? data.dislikes : [],
    onboardingConsent: {
      termsAcceptedAt: data.onboardingConsent?.termsAcceptedAt?.toDate() ?? null,
      safetyAcknowledgedAt: data.onboardingConsent?.safetyAcknowledgedAt?.toDate() ?? null,
    },
  };
}

/**
 * Applies the user's chosen public-display precision to a location label.
 * `locationLabel` is stored at full geocoder precision (e.g.
 * "Adelaide, South Australia, Australia" or "Fitzroy, City of Yarra, Victoria,
 * Australia") — most-specific segment first, per Nominatim's display_name
 * order. "City only" keeps just that first (most specific) segment;
 * "suburb and city" keeps the first two.
 */
export function applyLocationPrecision(
  locationLabel: string | null,
  precision: "city" | "suburb-and-city" | null,
): string | null {
  if (!locationLabel) return null;
  const parts = locationLabel.split(",").map((p) => p.trim());
  if (precision !== "suburb-and-city") return parts[0] || locationLabel;
  return parts.slice(0, 2).join(", ") || locationLabel;
}

export type ProfileCompletionInput = Pick<
  UserDTO,
  "name" | "avatar" | "username" | "locationLabel" | "interests" | "activities" | "languages" | "socialStyle" | "lookingFor" | "bio"
>;

export type CompletionSection = {
  id: string;
  /** Checklist heading, e.g. on /profile/complete. */
  title: string;
  /** Lowercase noun phrase for "Add X, Y to get better matches" copy. */
  missingLabel: string;
  weight: number;
  completed: boolean;
  editLink: string;
};

/**
 * The single source of truth for profile completion — every consumer (the
 * numeric percentage, the "add X to get better matches" prompt, and the
 * /profile/complete checklist) derives from this same list of sections, so
 * they can't disagree about which sections are actually done. Also doubles
 * as the source for in-progress onboarding wizard state, which shares these
 * field names/shapes, so the live progress bar matches the saved percentage.
 *
 * Weights sum to 100: basic+avatar 20%, location 15%, interests 15%,
 * activities 15%, languages 10%, social preferences 10%, goals 10%, bio 5%.
 * A run that fills every *required* onboarding field (skipping bio, the only
 * fully optional one) scores 95%, comfortably above the 60% floor.
 */
export function getCompletionSections(user: ProfileCompletionInput): CompletionSection[] {
  return [
    {
      id: "basic",
      title: "Basic details",
      missingLabel: "your basic profile",
      weight: 20,
      completed: !!(user.name?.length > 0 && user.username && user.avatar),
      editLink: "/profile/edit/basic",
    },
    {
      id: "location",
      title: "Your area",
      missingLabel: "your area",
      weight: 15,
      completed: !!user.locationLabel,
      editLink: "/profile/edit/basic",
    },
    {
      id: "interests",
      title: "Interests",
      missingLabel: "interests",
      weight: 15,
      completed: user.interests.length >= 3,
      editLink: "/profile/edit/interests",
    },
    {
      id: "activities",
      title: "Activities",
      missingLabel: "activities",
      weight: 15,
      completed: user.activities.length >= 3,
      editLink: "/profile/edit/activities",
    },
    {
      id: "languages",
      title: "Languages",
      missingLabel: "languages",
      weight: 10,
      completed: user.languages.length > 0 && user.languages.every((l) => !!l.proficiency),
      editLink: "/profile/edit/languages",
    },
    {
      id: "social",
      title: "Social style",
      missingLabel: "social preferences",
      weight: 10,
      completed: !!user.socialStyle.groupSize,
      editLink: "/profile/edit/social-style",
    },
    {
      id: "goals",
      title: "Goals",
      missingLabel: "goals",
      weight: 10,
      completed: user.lookingFor.length >= 1,
      editLink: "/profile/edit/goals",
    },
    {
      id: "bio",
      title: "Bio",
      missingLabel: "a bio",
      weight: 5,
      completed: !!user.bio,
      editLink: "/profile/edit/basic",
    },
  ];
}

export function calculateProfileCompletion(user: ProfileCompletionInput): number {
  return getCompletionSections(user).reduce((sum, s) => sum + (s.completed ? s.weight : 0), 0);
}

/**
 * The specific sections still missing from a profile — used to keep
 * "complete your profile" copy accurate instead of pointing at a fixed,
 * possibly-already-done set of fields.
 */
export function getMissingCompletionItems(user: ProfileCompletionInput): string[] {
  return getCompletionSections(user)
    .filter((s) => !s.completed)
    .map((s) => s.missingLabel);
}

export const MIN_MAX_DISTANCE_KM = 5;
export const MAX_MAX_DISTANCE_KM = 200;

/** Matches the range offered by the distance slider (5–200km, step 5). */
export function isValidMaxDistance(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= MIN_MAX_DISTANCE_KM &&
    value <= MAX_MAX_DISTANCE_KM
  );
}

export type PublicProfileDTO = {
  username: string | null;
  userId: string | null;
  avatar: UserDTO["avatar"];
  bio: string | null;
  locationLabel: string | null;
  interests: string[];
  activities: string[];
  languages: UserLanguage[];
  createdAt: Date;
  hostRatingSum: number;
  hostRatingCount: number;
  hostRatingAvg: number | null;
};

/**
 * Projects a UserDTO down to what another member is allowed to see.
 * Deliberately excludes: `name` (private — others see the username only,
 * per the rest of the app's convention), `gender` (self-declared and used
 * for matching/eligibility only — never shown on a profile, only ever
 * surfaced as an aggregate group-composition summary above a privacy
 * threshold), exact `locationLat`/`locationLng`, `dislikes`, `socialStyle`,
 * `lookingFor`, `matchingPreferences`, `dateOfBirth`, `email`, and every
 * other account/matching-only field. `locationLabel` is passed through
 * `applyLocationPrecision` so the public view always respects the owner's
 * chosen precision — never the raw stored (most-precise) label.
 */
export function toPublicProfile(user: UserDTO): PublicProfileDTO {
  return {
    username: user.username,
    userId: user.userId,
    avatar: user.avatar,
    bio: user.bio,
    locationLabel: applyLocationPrecision(user.locationLabel, user.locationPrecision),
    interests: user.interests,
    activities: user.activities,
    languages: user.languages,
    createdAt: user.createdAt,
    hostRatingSum: user.hostRatingSum,
    hostRatingCount: user.hostRatingCount,
    hostRatingAvg: user.hostRatingAvg,
  };
}

export function sanitizeUsername(raw: string) {
  return raw.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
}

export function generateUserId(): string {
  return String(Math.floor(1000000 + Math.random() * 9000000));
}
