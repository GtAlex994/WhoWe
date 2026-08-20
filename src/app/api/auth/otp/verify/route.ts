import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebase-admin";

const MAX_ATTEMPTS = 5;

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const { email: rawEmail, code: rawCode } = await request.json();
    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
    const code = typeof rawCode === "string" ? rawCode.trim() : "";
    if (!email || !code) {
      return NextResponse.json({ error: "Missing email or code." }, { status: 400 });
    }

    const ref = db.doc(`otpCodes/${email}`);
    const snap = await ref.get();
    const data = snap.data();
    if (!data) {
      return NextResponse.json({ error: "Request a new code." }, { status: 400 });
    }

    if (Date.now() > data.expiresAt) {
      await ref.delete();
      return NextResponse.json({ error: "That code expired. Request a new one." }, { status: 400 });
    }

    if (data.attempts >= MAX_ATTEMPTS) {
      await ref.delete();
      return NextResponse.json(
        { error: "Too many incorrect attempts. Request a new code." },
        { status: 400 },
      );
    }

    if (hashCode(code) !== data.codeHash) {
      await ref.update({ attempts: data.attempts + 1 });
      return NextResponse.json({ error: "That code doesn't match." }, { status: 401 });
    }

    await ref.delete();

    let uid: string;
    try {
      const userRecord = await auth.getUserByEmail(email);
      uid = userRecord.uid;
      if (!userRecord.emailVerified) {
        await auth.updateUser(uid, { emailVerified: true });
      }
    } catch {
      const userRecord = await auth.createUser({ email, emailVerified: true });
      uid = userRecord.uid;
    }

    const customToken = await auth.createCustomToken(uid);
    return NextResponse.json({ customToken });
  } catch (error) {
    console.error("Failed in OTP verify:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
