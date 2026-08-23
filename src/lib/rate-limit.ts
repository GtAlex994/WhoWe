import { db } from "@/lib/firebase-admin";

type RateLimitResult = { allowed: true } | { allowed: false; retryAfterMs: number };

// Simple fixed-window counter backed by Firestore, matching the pattern
// already used for OTP send limits. Good enough for abuse-deterrence; not
// meant to be perfectly race-free under extreme concurrency.
export async function checkRateLimit(key: string, max: number, windowMs: number): Promise<RateLimitResult> {
  const ref = db.doc(`rateLimits/${key}`);
  const snap = await ref.get();
  const now = Date.now();
  const existing = snap.data();

  const windowStart = existing?.windowStart && now - existing.windowStart < windowMs ? existing.windowStart : now;
  const count = windowStart === existing?.windowStart ? (existing?.count ?? 0) + 1 : 1;

  if (count > max) {
    return { allowed: false, retryAfterMs: windowStart + windowMs - now };
  }

  await ref.set({ windowStart, count });
  return { allowed: true };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
