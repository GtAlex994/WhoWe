import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase-admin";
import { getCurrentUser } from "@/lib/session";
import { reserveUsername } from "@/lib/users-server";

// "I'll do this later" — marks onboarding complete with a placeholder username
// (if the user doesn't already have one) so they aren't repeatedly bounced
// back into onboarding on every page load, per "Do not trap users in onboarding."
export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userRef = db.doc(`users/${user.id}`);

    if (!user.username) {
      let created = false;
      for (let attempt = 0; attempt < 5 && !created; attempt++) {
        const candidate = `user${Math.floor(1000 + Math.random() * 9000)}`;
        try {
          await db.runTransaction(async (tx) => {
            await reserveUsername(tx, user.id, candidate, null);
            tx.update(userRef, { username: candidate, onboardingCompletedAt: FieldValue.serverTimestamp() });
          });
          created = true;
        } catch {
          // username collision, try another candidate
        }
      }
      if (!created) {
        return NextResponse.json({ error: "Couldn't set up your profile. Please try again." }, { status: 500 });
      }
    } else {
      await userRef.update({ onboardingCompletedAt: FieldValue.serverTimestamp() });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed in onboarding skip:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
