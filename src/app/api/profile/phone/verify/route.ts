import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase-admin";
import { getCurrentUser } from "@/lib/session";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const MAX_ATTEMPTS = 5;

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

    const ipRateLimit = await checkRateLimit(`phone-otp-verify:${getClientIp(request)}`, 30, 60 * 60 * 1000);
    if (!ipRateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many attempts from this network. Try again in a bit." },
        { status: 429 },
      );
    }

    const { code: rawCode } = await request.json();
    const code = typeof rawCode === "string" ? rawCode.trim() : "";
    if (!code) {
      return NextResponse.json({ error: "Enter the code." }, { status: 400 });
    }

    const ref = db.doc(`phoneOtpCodes/${user.id}`);
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
    await db.doc(`users/${user.id}`).update({
      phone: data.phone,
      phoneVerifiedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed in phone OTP verify:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
