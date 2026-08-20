import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { auth, db } from "@/lib/firebase-admin";
import { sanitizeUsername, generateUserId } from "@/lib/users";
import type { UserLanguage } from "@/lib/languages";

async function generateUniqueUserId(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const userId = generateUserId();
    const snap = await db.doc(`userIds/${userId}`).get();
    if (!snap.exists) {
      return userId;
    }
  }
  throw new Error("Could not generate a unique user ID");
}

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
      username,
      avatarStyle,
      avatarSeed,
      languages,
      interests,
      activities,
      bio,
      maxDistance,
    } = data;

    // Validate required fields
    if (!displayName || !username || !avatarStyle || !avatarSeed || !languages?.length || !interests?.length || !activities?.length || !maxDistance) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const sanitized = sanitizeUsername(username);
    if (!sanitized || sanitized.length < 3) {
      return NextResponse.json({ error: "Invalid username" }, { status: 400 });
    }

    // Generate unique 7-digit ID
    const userId = await generateUniqueUserId();

    // Use transaction to ensure username uniqueness and create user ID mapping
    await db.runTransaction(async (tx) => {
      const usernameRef = db.doc(`usernames/${sanitized}`);
      const usernameSnap = await tx.get(usernameRef);

      if (usernameSnap.exists) {
        throw new Error("Username already taken");
      }

      // Reserve username
      tx.set(usernameRef, { uid });

      // Create user ID mapping
      tx.set(db.doc(`userIds/${userId}`), { uid });

      // Update user document with onboarding data
      tx.update(db.doc(`users/${uid}`), {
        name: displayName.trim(),
        username: sanitized,
        userId,
        avatar: {
          style: avatarStyle,
          seed: avatarSeed,
        },
        languages,
        interests,
        activities,
        bio: bio?.trim() || "",
        matchingPreferences: {
          ageRange: null,
          maxDistance: maxDistance,
          groupSize: null,
          preferredLanguages: languages.map((l: UserLanguage) => l.language),
          eventTypes: [],
        },
        onboardingCompletedAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({ success: true, userId });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Onboarding failed" },
      { status: 500 }
    );
  }
}
