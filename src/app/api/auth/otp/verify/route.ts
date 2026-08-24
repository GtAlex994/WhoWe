import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebase-admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const MAX_ATTEMPTS = 5;
// How long a just-verified code stays valid for a repeat request. Firebase
// custom tokens are cheap to mint again, so if the response to a correct
// verify never reaches the client (dropped connection, tab closed mid-flight),
// the same code can be resubmitted within this window instead of forcing a
// resend for an error that was ours, not the user's.
const CONSUMED_GRACE_MS = 2 * 60 * 1000;

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

async function issueTokenFor(email: string) {
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
  return auth.createCustomToken(uid);
}

export async function POST(request: NextRequest) {
  try {
    const ipRateLimit = await checkRateLimit(`otp-verify:${getClientIp(request)}`, 30, 60 * 60 * 1000);
    if (!ipRateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many attempts from this network. Try again in a bit." },
        { status: 429 },
      );
    }

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

    // Already used once. Within the grace window a retry with the SAME code
    // is treated as "my last request never made it back to me" and quietly
    // re-issued, instead of the user being told their still-valid code is
    // dead. Past the window (or with a different code) it's genuinely used up.
    if (data.consumedAt) {
      if (Date.now() - data.consumedAt > CONSUMED_GRACE_MS) {
        return NextResponse.json(
          { error: "That code can no longer be used. Request a new one to continue." },
          { status: 400 },
        );
      }
      if (hashCode(code) !== data.codeHash) {
        return NextResponse.json({ error: "That code doesn't match." }, { status: 401 });
      }
      const customToken = await issueTokenFor(email);
      return NextResponse.json({ customToken });
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

    // Mint the token before marking the code consumed: if this throws (a
    // transient failure talking to Firebase Auth), the code is untouched and
    // the user's next attempt with the same code just works.
    const customToken = await issueTokenFor(email);
    await ref.update({ consumedAt: Date.now() });
    return NextResponse.json({ customToken });
  } catch (error) {
    console.error("Failed in OTP verify:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
