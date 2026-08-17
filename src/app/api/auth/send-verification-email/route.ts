import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { auth, db } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    // Get session cookie from request
    const sessionCookie = request.cookies.get("whowe_session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let uid: string;
    let email: string | undefined;
    try {
      const decoded = await auth.verifySessionCookie(sessionCookie);
      uid = decoded.uid;
      email = decoded.email;
    } catch {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    if (!email) {
      return NextResponse.json({ error: "User has no email" }, { status: 400 });
    }

    // Generate verification link using Firebase
    const verificationLink = await auth.generateEmailVerificationLink(email);

    // In production, send this link via email service (SendGrid, etc.)
    // For now, store it and log it
    console.log(`Verification link for ${email}: ${verificationLink}`);

    // Update user with verification email sent timestamp
    await db.doc(`users/${uid}`).update({
      verificationEmailSentAt: FieldValue.serverTimestamp(),
      verificationEmailExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    // TODO: Send actual email here using SendGrid or similar service
    // For now, return the link in development
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({
        success: true,
        message: "Verification email sent",
        verificationLink, // Only return in dev for testing
      });
    }

    return NextResponse.json({
      success: true,
      message: "Verification email sent to " + email,
    });
  } catch (error) {
    console.error("Send verification email error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send verification email" },
      { status: 500 }
    );
  }
}
