// Turns raw Firebase Auth SDK errors and network failures into calm,
// customer-facing copy. Never let a bare FirebaseError or fetch TypeError
// reach setError() directly — route it through friendlyAuthError first.

// Thrown for errors we already curated calm copy for (our own API routes'
// `data.error` strings) — friendlyAuthError passes these through unchanged
// instead of trying to re-map them.
export class ApiError extends Error {}

function isFirebaseAuthError(err: unknown): err is { code: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code: unknown }).code === "string" &&
    (err as { code: string }).code.startsWith("auth/")
  );
}

const FIREBASE_ERROR_COPY: Record<string, string> = {
  "auth/network-request-failed":
    "We couldn't verify the code because of a connection problem. Please try again.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/invalid-action-code": "That link can no longer be used. Request a new one to continue.",
  "auth/expired-action-code": "That link can no longer be used. Request a new one to continue.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/user-disabled": "This account is unavailable. Contact support if you think that's a mistake.",
};

export function friendlyAuthError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  if (isFirebaseAuthError(err)) {
    return FIREBASE_ERROR_COPY[err.code] ?? fallback;
  }
  if (err instanceof TypeError) {
    // fetch() rejects with a plain TypeError for offline/DNS/connection-reset
    // failures — there's no server response to read a message from.
    return "We couldn't reach the server because of a connection problem. Please try again.";
  }
  return fallback;
}

export async function parseJsonResponse(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Something went wrong. Please try again.");
  }
}
