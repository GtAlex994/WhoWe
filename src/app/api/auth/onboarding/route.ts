import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { auth, db } from "@/lib/firebase-admin";
import { sanitizeUsername, generateUserId } from "@/lib/users";
import { PROFICIENCY_LEVELS, type UserLanguage } from "@/lib/languages";

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
    const sessionCookie = request.cookies.get("whowe_session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let uid: string;
    try {
      const decoded = await auth.verifySessionCookie(sessionCookie);
      uid = decoded.uid;
    } catch {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
    }

    const data = await request.json();
    const {
      displayName,
      username,
      avatar,
      gender,
      bio,
      locationLabel,
      locationLat,
      locationLng,
      locationPrecision,
      interests,
      activities,
      dislikes,
      languages,
      socialStyle,
      lookingFor,
      consent,
    } = data;

    if (
      !displayName?.trim() ||
      !username ||
      !avatar?.seed ||
      !avatar?.top ||
      !avatar?.hairColor ||
      !avatar?.skinColor ||
      !avatar?.clothes ||
      !avatar?.clothesColor ||
      (gender !== "male" && gender !== "female")
    ) {
      return NextResponse.json({ error: "Missing required profile fields." }, { status: 400 });
    }
    if (!locationLabel || typeof locationLat !== "number" || typeof locationLng !== "number") {
      return NextResponse.json({ error: "Choose your area to continue." }, { status: 400 });
    }
    if (!Array.isArray(interests) || interests.length < 3) {
      return NextResponse.json({ error: "Choose at least 3 interests." }, { status: 400 });
    }
    const cleanActivities: string[] = Array.isArray(activities) ? activities : [];
    const cleanDislikes: string[] = Array.isArray(dislikes) ? dislikes : [];
    if (interests.some((i: string) => cleanDislikes.includes(i))) {
      return NextResponse.json(
        { error: "Something can't be both an interest and something you'd rather avoid." },
        { status: 400 },
      );
    }
    if (!Array.isArray(languages) || languages.length < 1 || !languages.every((l: UserLanguage) => PROFICIENCY_LEVELS.includes(l.proficiency))) {
      return NextResponse.json({ error: "Add at least one language and proficiency level." }, { status: 400 });
    }
    if (!socialStyle?.groupSize) {
      return NextResponse.json({ error: "Choose a preferred group size." }, { status: 400 });
    }
    if (!Array.isArray(lookingFor) || lookingFor.length < 1) {
      return NextResponse.json({ error: "Choose at least one goal." }, { status: 400 });
    }
    if (!consent?.termsAccepted || !consent?.safetyAcknowledged) {
      return NextResponse.json({ error: "Please confirm both checkboxes to continue." }, { status: 400 });
    }

    const sanitized = sanitizeUsername(username);
    if (!sanitized || sanitized.length < 3) {
      return NextResponse.json({ error: "Invalid username." }, { status: 400 });
    }

    const userId = await generateUniqueUserId();

    await db.runTransaction(async (tx) => {
      const usernameRef = db.doc(`usernames/${sanitized}`);
      const usernameSnap = await tx.get(usernameRef);
      if (usernameSnap.exists) {
        throw new Error("USERNAME_TAKEN");
      }

      tx.set(usernameRef, { uid });
      tx.set(db.doc(`userIds/${userId}`), { uid });
      tx.update(db.doc(`users/${uid}`), {
        name: displayName.trim(),
        username: sanitized,
        userId,
        avatar: {
          style: "avataaars",
          seed: avatar.seed,
          top: avatar.top,
          hairColor: avatar.hairColor,
          skinColor: avatar.skinColor,
          facialHair: avatar.facialHair || "none",
          accessories: avatar.accessories || "none",
          clothes: avatar.clothes,
          clothesColor: avatar.clothesColor,
        },
        gender,
        bio: bio?.trim() || "",
        locationLabel,
        locationLat,
        locationLng,
        locationPrecision: locationPrecision === "suburb-and-city" ? "suburb-and-city" : "city",
        locationVerifiedAt: FieldValue.serverTimestamp(),
        interests,
        activities: cleanActivities,
        dislikes: cleanDislikes,
        languages,
        socialStyle: {
          groupSize: socialStyle.groupSize,
          planning: socialStyle.planning ?? null,
          pace: Array.isArray(socialStyle.pace) ? socialStyle.pace : [],
          personality: socialStyle.personality ?? null,
        },
        lookingFor,
        matchingPreferences: {
          ageRange: null,
          maxDistance: 50,
          groupSize: null,
          preferredLanguages: languages.map((l: UserLanguage) => l.language),
          eventTypes: [],
        },
        onboardingConsent: {
          termsAcceptedAt: FieldValue.serverTimestamp(),
          safetyAcknowledgedAt: FieldValue.serverTimestamp(),
        },
        onboardingCompletedAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({ success: true, userId });
  } catch (error) {
    if (error instanceof Error && error.message === "USERNAME_TAKEN") {
      return NextResponse.json({ error: "That username is already taken. Try another." }, { status: 409 });
    }
    console.error("Failed in onboarding submit:", error);
    return NextResponse.json({ error: "Something went wrong saving your profile. Please try again." }, { status: 500 });
  }
}
