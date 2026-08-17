"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FadeIn } from "@/components/FadeIn";
import { Button } from "@/components/Button";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"waiting" | "checking" | "verified" | "error">("waiting");
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    // Check if email is already verified
    checkEmailVerification();
    const interval = setInterval(checkEmailVerification, 3000); // Check every 3 seconds
    return () => clearInterval(interval);
  }, []);

  async function checkEmailVerification() {
    try {
      const res = await fetch("/api/auth/check-email-verified");
      const data = await res.json();

      if (data.verified) {
        setStatus("verified");
        setTimeout(() => {
          router.push("/profile");
        }, 1500);
      }
    } catch (err) {
      console.error("Error checking email verification:", err);
    }
  }

  async function resendVerificationEmail() {
    setResending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/send-verification-email", {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to resend verification email");
      // Don't change status - just let them know it was sent
      alert("Verification email resent! Check your inbox.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend email");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <FadeIn>
          {status === "waiting" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-semibold tracking-tight">Check your email</h1>
                <p className="text-muted mt-2">
                  We've sent a verification link to your email address. Click it to confirm your account and access WhoWe.
                </p>
              </div>

              <div className="bg-surface border-2 border-foreground rounded-lg p-6">
                <p className="text-sm text-muted mb-4">
                  Didn't receive the email? Check your spam folder or request a new one:
                </p>
                <Button
                  variant="secondary"
                  onClick={resendVerificationEmail}
                  disabled={resending}
                  className="w-full"
                >
                  {resending ? "Sending..." : "Resend verification email"}
                </Button>
              </div>

              <p className="text-xs text-muted text-center">
                This page will automatically update once you verify your email.
              </p>
            </div>
          )}

          {status === "verified" && (
            <div className="space-y-6 text-center">
              <div>
                <h1 className="text-4xl font-semibold tracking-tight">Email verified! ✓</h1>
                <p className="text-muted mt-2">
                  Your account is all set. Redirecting to your profile...
                </p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-semibold tracking-tight">Something went wrong</h1>
                <p className="text-muted mt-2">{error}</p>
              </div>
              <Link href="/">
                <Button variant="secondary" className="w-full">
                  Back to home
                </Button>
              </Link>
            </div>
          )}
        </FadeIn>
      </div>
    </div>
  );
}
