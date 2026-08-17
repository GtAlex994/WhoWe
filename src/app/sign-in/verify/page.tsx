"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { FadeIn } from "@/components/FadeIn";
import { Button } from "@/components/Button";

type Status = "working" | "needs-email" | "error";

export default function VerifyPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("working");
  const [error, setError] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");

  useEffect(() => {
    complete(window.localStorage.getItem("emailForSignIn"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function complete(email: string | null) {
    if (!isSignInWithEmailLink(auth, window.location.href)) {
      setStatus("error");
      setError("This isn't a valid sign-in link.");
      return;
    }
    if (!email) {
      setStatus("needs-email");
      return;
    }
    try {
      const credential = await signInWithEmailLink(auth, email, window.location.href);
      const idToken = await credential.user.getIdToken();
      window.localStorage.removeItem("emailForSignIn");

      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) throw new Error("session exchange failed");
      const { needsOnboarding } = await res.json();
      router.push(needsOnboarding ? "/onboarding-flow" : "/");
    } catch {
      setStatus("error");
      setError("That link is invalid or has expired. Request a new one.");
    }
  }

  function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("working");
    complete(emailInput.trim());
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 flex flex-col gap-8">
      <FadeIn>
        <h1 className="text-3xl font-semibold tracking-tight">
          {status === "working" && "Signing you in…"}
          {status === "needs-email" && "Confirm your email"}
          {status === "error" && "Sign-in link didn't work"}
        </h1>
        {status === "error" && error && <p className="text-muted mt-1.5">{error}</p>}
      </FadeIn>

      {status === "needs-email" && (
        <FadeIn delay={0.06}>
          <p className="text-muted mb-3">
            Opened this link on a different device or browser? Enter the email you used to
            request it.
          </p>
          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              required
              autoFocus
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="you@example.com"
              className="border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none"
            />
            <Button type="submit" variant="primary" className="w-full">
              Continue
            </Button>
          </form>
        </FadeIn>
      )}

      {status === "error" && (
        <FadeIn delay={0.06}>
          <Link href="/sign-in">
            <Button variant="secondary">Back to sign in</Button>
          </Link>
        </FadeIn>
      )}
    </div>
  );
}
