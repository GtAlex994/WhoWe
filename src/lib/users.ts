import type { Transaction } from "firebase-admin/firestore";
import { db } from "@/lib/firebase-admin";

export type UserDTO = {
  id: string;
  name: string;
  username: string | null;
  email: string | null;
  bio: string | null;
  interests: string | null;
  dislikes: string | null;
  locationLat: number | null;
  locationLng: number | null;
  locationLabel: string | null;
  locationVerifiedAt: Date | null;
  onboardingCompletedAt: Date | null;
  notifyEmail: boolean;
  createdAt: Date;
  hostRatingSum: number;
  hostRatingCount: number;
  hostRatingAvg: number | null;
  randomKey: number;
};

export function toUserDTO(id: string, data: FirebaseFirestore.DocumentData): UserDTO {
  return {
    id,
    name: data.name,
    username: data.username ?? null,
    email: data.email ?? null,
    bio: data.bio ?? null,
    interests: data.interests ?? null,
    dislikes: data.dislikes ?? null,
    locationLat: data.locationLat ?? null,
    locationLng: data.locationLng ?? null,
    locationLabel: data.locationLabel ?? null,
    locationVerifiedAt: data.locationVerifiedAt?.toDate() ?? null,
    onboardingCompletedAt: data.onboardingCompletedAt?.toDate() ?? null,
    notifyEmail: data.notifyEmail ?? true,
    createdAt: data.createdAt?.toDate() ?? new Date(0),
    hostRatingSum: data.hostRatingSum ?? 0,
    hostRatingCount: data.hostRatingCount ?? 0,
    hostRatingAvg: data.hostRatingCount ? data.hostRatingSum / data.hostRatingCount : null,
    randomKey: data.randomKey ?? 0,
  };
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
