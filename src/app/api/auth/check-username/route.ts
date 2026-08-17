import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { sanitizeUsername } from "@/lib/users";

export async function POST(request: NextRequest) {
  try {
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Check failed" },
      { status: 500 }
    );
  }
}
