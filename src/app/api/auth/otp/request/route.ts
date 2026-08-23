import { createHash, randomInt } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { Resend } from "resend";
import { db } from "@/lib/firebase-admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 30 * 1000;
const MAX_SENDS_PER_WINDOW = 5;
const SEND_WINDOW_MS = 60 * 60 * 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const ipRateLimit = await checkRateLimit(`otp-request:${getClientIp(request)}`, 10, 60 * 60 * 1000);
    if (!ipRateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many code requests from this network. Try again in a bit." },
        { status: 429 },
      );
    }

    const { email: rawEmail } = await request.json();
    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const ref = db.doc(`otpCodes/${email}`);
    const snap = await ref.get();
    const now = Date.now();
    const existing = snap.data();

    if (existing?.lastSentAt && now - existing.lastSentAt < RESEND_COOLDOWN_MS) {
      return NextResponse.json(
        { error: "Please wait a moment before requesting another code." },
        { status: 429 },
      );
    }

    const windowStart = existing?.windowStart && now - existing.windowStart < SEND_WINDOW_MS
      ? existing.windowStart
      : now;
    const sendCount = windowStart === existing?.windowStart ? (existing?.sendCount ?? 0) + 1 : 1;
    if (sendCount > MAX_SENDS_PER_WINDOW) {
      return NextResponse.json(
        { error: "Too many code requests. Try again in a bit." },
        { status: 429 },
      );
    }

    const code = randomInt(100000, 1000000).toString();

    await ref.set({
      email,
      codeHash: hashCode(code),
      expiresAt: now + CODE_TTL_MS,
      attempts: 0,
      lastSentAt: now,
      windowStart,
      sendCount,
    });

    const resendApiKey = process.env.RESEND_API_KEY?.trim();
    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not set");
      throw new Error("Email service not configured");
    }

    const resend = new Resend(resendApiKey);

    const result = await resend.emails.send({
      from: "WhoWe <noreply@whowe.live>",
      to: email,
      subject: "Your WhoWe verification code",
      html: `<p>Your verification code is <strong>${code}</strong>.</p><p>It expires in 10 minutes.</p>`,
    });

    if (result.error) {
      console.error("Resend API error:", result.error);
      return NextResponse.json(
        { error: "We couldn't send the verification code. Please check your email address and try again." },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed in OTP request:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
