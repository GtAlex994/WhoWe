import type { Transaction } from "firebase-admin/firestore";
import { db } from "@/lib/firebase-admin";
import type { UserLanguage, ProficiencyLevel } from "@/lib/languages";

export type UserDTO = {
  id: string;
  name: string;
  email: string | null;
  emailVerifiedAt: Date | null;
  bio: string | null;
  avatar: {
    style: string;
    seed: string;
  } | null;
  gender: string | null;
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

  // Social & lifestyle (future, not in Phase 1)
  socialStyle: {
    personality: "introvert" | "somewhere-in-between" | "extrovert" | null;
    groupSize: "small" | "medium" | "large" | null;
    pace: "relaxed" | "social" | "active" | "adventurous" | null;
    planning: "spontaneous" | "a-few-days" | "well-ahead" | null;
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

  // Reputation/trust
  hostRatingSum: number;
  hostRatingCount: number;
  hostRatingAvg: number | null;
  eventsAttended: number;
  eventsHosted: number;

  // Legacy fields (deprecated)
  dislikes: string | null;
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
    socialStyle: data.socialStyle ?? {
      personality: null,
      groupSize: null,
      pace: null,
      planning: null,
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
    hostRatingSum: data.hostRatingSum ?? 0,
    hostRatingCount: data.hostRatingCount ?? 0,
    hostRatingAvg: data.hostRatingCount ? data.hostRatingSum / data.hostRatingCount : null,
    eventsAttended: data.eventsAttended ?? 0,
    eventsHosted: data.eventsHosted ?? 0,
    dislikes: data.dislikes ?? null,
  };
}

/**
 * Calculate profile completion percentage based on Phase 1 fields.
 * Phase 1 is considered complete when: name, avatar, location, languages, interests (5+), activities (3+) are filled.
 */
export function calculateProfileCompletion(user: UserDTO): number {
  const checks = [
    user.name?.length > 0 ? 1 : 0,
    user.avatar ? 1 : 0,
    user.locationLabel ? 1 : 0,
    user.languages.length > 0 ? 1 : 0,
    user.interests.length >= 5 ? 1 : 0,
    user.activities.length >= 3 ? 1 : 0,
    // Future sections (worth less initially)
    user.socialStyle.personality ? 0.5 : 0,
    user.availability.length > 0 ? 0.5 : 0,
    user.matchingPreferences.maxDistance ? 0.5 : 0,
    user.bio ? 0.5 : 0,
  ];
  return Math.round((checks.reduce((a, b) => a + b, 0) / 10) * 100);
}

export function sanitizeUsername(raw: string) {
  return raw.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
}

/**
 * Reserves `newUsername` for `uid`, releasing `oldUsername` if it's different.
 * Must run inside a transaction that has not yet performed any writes.
 * Throws if `newUsername` is already reserved by someone else.
 */
export async function reserveUsername(
  tx: Transaction,
  uid: string,
  newUsername: string,
  oldUsername: string | null,
) {
  if (newUsername === oldUsername) return;

  const newRef = db.doc(`usernames/${newUsername}`);
  const newSnap = await tx.get(newRef);
  if (newSnap.exists && newSnap.data()?.uid !== uid) {
    throw new Error("That username is taken");
  }

  tx.set(newRef, { uid });
  if (oldUsername) {
    tx.delete(db.doc(`usernames/${oldUsername}`));
  }
}

export async function getUsersByIds(ids: string[]): Promise<Record<string, UserDTO>> {
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length === 0) return {};

  const snaps = await db.getAll(...uniqueIds.map((id) => db.doc(`users/${id}`)));
  const result: Record<string, UserDTO> = {};
  for (const snap of snaps) {
    if (snap.exists) {
      result[snap.id] = toUserDTO(snap.id, snap.data()!);
    }
  }
  return result;
}

export function generateUserId(): string {
  return String(Math.floor(1000000 + Math.random() * 9000000));
}

export async function isUserIdAvailable(userId: string): Promise<boolean> {
  const snap = await db.doc(`userIds/${userId}`).get();
  return !snap.exists;
}
