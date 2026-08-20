import type { Transaction } from "firebase-admin/firestore";
import { db } from "@/lib/firebase-admin";
import { sanitizeUsername, toUserDTO, type UserDTO } from "@/lib/users";

/**
 * Reserves `newUsername` for `uid`, releasing `oldUsername` if it's different.
 * Must run inside a transaction that has not yet performed any writes.
 * Throws if `newUsername` is already reserved by someone else.
 */
export async function reserveUsername(tx: Transaction, uid: string, newUsername: string, oldUsername: string | null) {
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

export async function isUserIdAvailable(userId: string): Promise<boolean> {
  const snap = await db.doc(`userIds/${userId}`).get();
  return !snap.exists;
}

/**
 * Resolves a public profile route param to a user, via the same
 * `usernames/{name}` reservation doc used for uniqueness checks elsewhere.
 * Returns null if the username isn't sanitized-equal to any reservation, or
 * the reservation is dangling (uid has no user doc).
 */
export async function getUserByUsername(username: string): Promise<UserDTO | null> {
  const sanitized = sanitizeUsername(username);
  if (!sanitized) return null;

  const usernameSnap = await db.doc(`usernames/${sanitized}`).get();
  const uid = usernameSnap.data()?.uid;
  if (!uid) return null;

  const userSnap = await db.doc(`users/${uid}`).get();
  if (!userSnap.exists) return null;

  return toUserDTO(uid, userSnap.data()!);
}
