import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    // Get session cookie from request
    const sessionCookie = request.cookies.get("whowe_session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let uid: string;
    try {
      const decoded = await auth.verifySessionCookie(sessionCookie);
      uid = decoded.uid;
    } catch {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Get user from Firebase Auth
    const user = await auth.getUser(uid);

    // Check if email is verified
    const verified = user.emailVerified || false;

    return NextResponse.json({
      verified,
      email: user.email,
    });
  } catch (error) {
    console.error("Check email verified error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check email verification" },
      { status: 500 }
    );
  }
}
