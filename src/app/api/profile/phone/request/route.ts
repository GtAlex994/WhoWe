import { createHash, randomInt } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { getCurrentUser } from "@/lib/session";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 30 * 1000;
const MAX_SENDS_PER_WINDOW = 5;
const SEND_WINDOW_MS = 60 * 60 * 1000;
// E.164: leading '+', country code, 8-15 digits total.
const PHONE_RE = /^\+[1-9]\d{7,14}$/;

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

    const ipRateLimit = await checkRateLimit(`phone-otp-request:${getClientIp(request)}`, 10, 60 * 60 * 1000);
    if (!ipRateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many code requests from this network. Try again in a bit." },
        { status: 429 },
      );
    }

    const { phone: rawPhone } = await request.json();
    const phone = typeof rawPhone === "string" ? rawPhone.trim().replace(/[\s()-]/g, "") : "";
    if (!PHONE_RE.test(phone)) {
      return NextResponse.json(
        { error: "Enter a valid phone number with country code, e.g. +61412345678." },
        { status: 400 },
      );
    }

    const ref = db.doc(`phoneOtpCodes/${user.id}`);
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

    const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
    const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
    const fromNumber = process.env.TWILIO_FROM_NUMBER?.trim();
    if (!accountSid || !authToken || !fromNumber) {
      console.error("Twilio env vars are not set");
      throw new Error("SMS service not configured");
    }

    const twilioRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: fromNumber,
          To: phone,
          Body: `Your WhoWe verification code is ${code}. It expires in 10 minutes.`,
        }),
      },
    );

    if (!twilioRes.ok) {
      const detail = await twilioRes.text();
      console.error("Twilio API error:", detail);
      return NextResponse.json(
        { error: "We couldn't send the verification code. Please check the phone number and try again." },
        { status: 400 },
      );
    }

    await ref.set({
      phone,
      codeHash: hashCode(code),
      expiresAt: now + CODE_TTL_MS,
      attempts: 0,
      lastSentAt: now,
      windowStart,
      sendCount,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed in phone OTP request:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
