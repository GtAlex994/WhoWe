import { createHash, randomInt } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { Resend } from "resend";
import { db } from "@/lib/firebase-admin";

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 30 * 1000;
const MAX_SENDS_PER_WINDOW = 5;
const SEND_WINDOW_MS = 60 * 60 * 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export async function POST(request: NextRequest) {
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

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: "WhoWe <onboarding@resend.dev>",
      to: email,
      subject: "Your WhoWe verification code",
      html: `<p>Your verification code is <strong>${code}</strong>.</p><p>It expires in 10 minutes.</p>`,
    });
  } catch (error) {
    console.error("Failed to send email via Resend:", error);
    return NextResponse.json(
      { error: "Failed to send verification code" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
