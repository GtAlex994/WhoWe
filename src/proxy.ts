import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth, db } from "@/lib/firebase-admin";

const SESSION_COOKIE = "whowe_session";

// Fully public informational pages — no session-aware redirect logic needed,
// reachable regardless of sign-in or onboarding state.
const PUBLIC_PREFIXES = ["/community-guidelines", "/privacy", "/terms"];

function isUnder(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PREFIXES.some((prefix) => isUnder(pathname, prefix))) {
    return NextResponse.next();
  }

  const isOnboarding = isUnder(pathname, "/onboarding");
  const isSignIn = isUnder(pathname, "/sign-in");

  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionCookie) {
    // Signed out: onboarding/sign-in render their own signed-out state; every
    // other page's own getCurrentUser() check redirects to /sign-in as needed.
    return NextResponse.next();
  }

  try {
    const decoded = await auth.verifySessionCookie(sessionCookie);
    const userSnap = await db.doc(`users/${decoded.uid}`).get();

    if (!userSnap.exists) {
      // Valid session signature but no backing user doc — an orphaned
      // cookie (e.g. the account was deleted). Clear it so future requests
      // are treated as signed-out, same as getCurrentUser() already does,
      // instead of pushing this into an onboarding flow whose own submit
      // would fail with "no document to update".
      const response = NextResponse.next();
      response.cookies.delete(SESSION_COOKIE);
      return response;
    }

    const onboardingCompletedAt = userSnap.data()?.onboardingCompletedAt;

    if (isSignIn) {
      // Already signed in — don't show the sign-in/verification screens
      // again. Covers browser Back or a refresh landing back on /sign-in
      // after the hard navigation away from it on successful verification.
      return NextResponse.redirect(new URL(onboardingCompletedAt ? "/" : "/onboarding", request.url));
    }

    if (onboardingCompletedAt && isOnboarding) {
      // Completed profile — don't show a blank 0% onboarding form by
      // accident (e.g. an old bookmark or a stray link back to /onboarding).
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (!onboardingCompletedAt && !isOnboarding) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  } catch {
    // Invalid/expired session cookie — let the request through; each page's
    // own getCurrentUser() check already redirects to /sign-in as needed.
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)"],
};
