import { cookies } from "next/headers";
import { auth, db } from "@/lib/firebase-admin";
import { toUserDTO } from "@/lib/users";

const SESSION_COOKIE = "whowe_session";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionCookie) return null;

  let uid: string;
  try {
    // No checkRevoked: it costs an extra round trip on every request, and a
    // deleted user's Firestore doc being gone already fails this safely below.
    const decoded = await auth.verifySessionCookie(sessionCookie);
    uid = decoded.uid;
  } catch {
    return null;
  }

  const snap = await db.doc(`users/${uid}`).get();
  if (!snap.exists) return null;

  return toUserDTO(uid, snap.data()!);
}

export async function setSessionCookie(sessionCookie: string, maxAgeMs: number) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(maxAgeMs / 1000),
  });
}

export async function clearCurrentUser() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
