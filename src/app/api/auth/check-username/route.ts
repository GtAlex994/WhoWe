import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { sanitizeUsername } from "@/lib/users";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const rateLimit = await checkRateLimit(`check-username:${getClientIp(request)}`, 30, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
    }

    const { username } = await request.json();

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const sanitized = sanitizeUsername(username);
    if (!sanitized || sanitized.length < 3) {
      return NextResponse.json({ available: false, reason: "Invalid username" }, { status: 200 });
    }

    const snap = await db.doc(`usernames/${sanitized}`).get();
    const available = !snap.exists;

    return NextResponse.json({ available });
  } catch (error) {
    console.error("Check username error:", error);
    return NextResponse.json({ error: "We couldn't check that username right now. Please try again." }, { status: 500 });
  }
}
