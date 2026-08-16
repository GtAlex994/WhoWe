import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { auth, db } from "@/lib/firebase-admin";
import { setSessionCookie } from "@/lib/session";

// Firebase caps session cookie duration at exactly 14 days; shave a minute
// off to stay safely under that boundary.
const SESSION_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000 - 60 * 1000;

export async function POST(request: NextRequest) {
  const { idToken } = await request.json();
  if (!idToken) {
    return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
  }

  let uid: string;
  let email: string | undefined;
  try {
    const decoded = await auth.verifyIdToken(idToken);
    uid = decoded.uid;
    email = decoded.email;
  } catch {
    return NextResponse.json({ error: "Invalid or expired sign-in link" }, { status: 401 });
  }

  const userRef = db.doc(`users/${uid}`);
  let userSnap = await userRef.get();
  if (!userSnap.exists) {
    await userRef.set({
      email: email ?? null,
      name: email ? email.split("@")[0] : "New user",
      notifyEmail: true,
      createdAt: FieldValue.serverTimestamp(),
      hostRatingSum: 0,
      hostRatingCount: 0,
      randomKey: Math.random(),
    });
    userSnap = await userRef.get();
  }

  let sessionCookie: string;
  try {
    sessionCookie = await auth.createSessionCookie(idToken, { expiresIn: SESSION_MAX_AGE_MS });
  } catch {
    return NextResponse.json({ error: "Could not start a session — try signing in again" }, { status: 401 });
  }

  await setSessionCookie(sessionCookie, SESSION_MAX_AGE_MS);

  const needsOnboarding = !userSnap.data()?.onboardingCompletedAt;
  return NextResponse.json({ needsOnboarding });
}
