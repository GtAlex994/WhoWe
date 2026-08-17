import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { auth, db } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    // Get session cookie from request
    const sessionCookie = request.cookies.get("whowe_session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let uid: string;
    try {
      const decoded = await auth.verifySessionCookie(sessionCookie);
      uid = decoded.uid;
    } catch {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const data = await request.json();
    const {
      displayName,
      avatarStyle,
      avatarSeed,
      languages,
      interests,
      activities,
      bio,
    } = data;

    // Validate required fields
    if (!displayName || !avatarStyle || !avatarSeed || !languages?.length || !interests?.length || !activities?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Update user document with onboarding data
    await db.doc(`users/${uid}`).update({
      displayName: displayName.trim(),
      avatarStyle,
      avatarSeed,
      languages,
      interests,
      activities,
      bio: bio?.trim() || "",
      onboardingCompletedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Onboarding failed" },
      { status: 500 }
    );
  }
}
