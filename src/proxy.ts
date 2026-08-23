import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth, db } from "@/lib/firebase-admin";

const SESSION_COOKIE = "whowe_session";

// Paths a signed-in-but-not-yet-onboarded user must still be able to reach —
// the onboarding flow itself, plus sign-in/sign-out so a stuck session can
// always be escaped, plus fully public informational pages.
const ALLOWED_PREFIXES = ["/onboarding", "/sign-in", "/community-guidelines", "/privacy", "/terms"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (ALLOWED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionCookie) return NextResponse.next();

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
    if (!onboardingCompletedAt) {
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
