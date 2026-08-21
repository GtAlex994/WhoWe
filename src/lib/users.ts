import type { UserLanguage } from "@/lib/languages";
import type { AvatarGender } from "@/lib/avatars";

export type UserDTO = {
  id: string;
  name: string;
  email: string | null;
  emailVerifiedAt: Date | null;
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
  eventsAttended: number;
  eventsHosted: number;

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
    eventsAttended: data.eventsAttended ?? 0,
    eventsHosted: data.eventsHosted ?? 0,
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

/**
 * The single source of truth for profile completion — used both for a saved
 * UserDTO and for in-progress onboarding wizard state (which shares these
 * field names/shapes), so the live progress bar and the saved-profile
 * percentage never disagree.
 *
 * Weighting: basic+avatar 20%, location 15%, interests 15%, activities 15%,
 * languages 10%, social preferences 10% (5% required group size + up to 5%
 * prorated across the 3 optional fields), goals 10%, bio 5%. A run that fills
 * every *required* onboarding field (skipping all optional ones) scores 90%,
 * comfortably above the 60% floor.
 */
export function calculateProfileCompletion(user: ProfileCompletionInput): number {
  let score = 0;

  if (user.name?.length > 0 && user.username && user.avatar) score += 20;
  if (user.locationLabel) score += 15;
  if (user.interests.length >= 3) score += 15;
  if (user.activities.length >= 3) score += 15;
  if (user.languages.length > 0 && user.languages.every((l) => !!l.proficiency)) score += 10;

  if (user.socialStyle.groupSize) {
    score += 5;
    const optionalFilled = [user.socialStyle.personality, user.socialStyle.planning, user.socialStyle.pace.length > 0].filter(
      Boolean,
    ).length;
    score += (optionalFilled / 3) * 5;
  }

  if (user.lookingFor.length >= 1) score += 10;
  if (user.bio) score += 5;

  return Math.round(score);
}

/**
 * The specific sections still missing from a profile, in the same order/logic
 * as calculateProfileCompletion — used to keep "complete your profile" copy
 * accurate instead of pointing at a fixed, possibly-already-done set of fields.
 */
export function getMissingCompletionItems(user: ProfileCompletionInput): string[] {
  const missing: string[] = [];
  if (!(user.name?.length > 0 && user.username && user.avatar)) missing.push("your basic profile");
  if (!user.locationLabel) missing.push("your area");
  if (user.interests.length < 3) missing.push("interests");
  if (user.activities.length < 3) missing.push("activities");
  if (!(user.languages.length > 0 && user.languages.every((l) => !!l.proficiency))) missing.push("languages");
  if (!user.socialStyle.groupSize) missing.push("social preferences");
  if (user.lookingFor.length < 1) missing.push("goals");
  if (!user.bio) missing.push("a bio");
  return missing;
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
  gender: UserDTO["gender"];
  bio: string | null;
  locationLabel: string | null;
  interests: string[];
  activities: string[];
  languages: UserLanguage[];
  createdAt: Date;
  hostRatingSum: number;
  hostRatingCount: number;
  hostRatingAvg: number | null;
  eventsAttended: number;
  eventsHosted: number;
};

/**
 * Projects a UserDTO down to what another member is allowed to see.
 * Deliberately excludes: `name` (private — others see the username only,
 * per the rest of the app's convention), exact `locationLat`/`locationLng`,
 * `dislikes`, `socialStyle`, `lookingFor`, `matchingPreferences`,
 * `dateOfBirth`, `email`, and every other account/matching-only field.
 * `locationLabel` is passed through `applyLocationPrecision` so the public
 * view always respects the owner's chosen precision — never the raw stored
 * (most-precise) label.
 */
export function toPublicProfile(user: UserDTO): PublicProfileDTO {
  return {
    username: user.username,
    userId: user.userId,
    avatar: user.avatar,
    gender: user.gender,
    bio: user.bio,
    locationLabel: applyLocationPrecision(user.locationLabel, user.locationPrecision),
    interests: user.interests,
    activities: user.activities,
    languages: user.languages,
    createdAt: user.createdAt,
    hostRatingSum: user.hostRatingSum,
    hostRatingCount: user.hostRatingCount,
    hostRatingAvg: user.hostRatingAvg,
    eventsAttended: user.eventsAttended,
    eventsHosted: user.eventsHosted,
  };
}

export function sanitizeUsername(raw: string) {
  return raw.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
}

export function generateUserId(): string {
  return String(Math.floor(1000000 + Math.random() * 9000000));
}
