"use client";

import { useState, type FormEvent } from "react";
import { sendSignInLinkToEmail } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { FadeIn } from "@/components/FadeIn";
import { Button } from "@/components/Button";
import { Squiggle } from "@/components/Squiggle";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      await sendSignInLinkToEmail(auth, email, {
        url: `${window.location.origin}/sign-in/verify`,
        handleCodeInApp: true,
      });
      window.localStorage.setItem("emailForSignIn", email);
      setSent(true);
    } catch {
      setError("Couldn't send that link — check the email address and try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 lg:min-h-[calc(100vh-137px)]">
      <div className="hidden lg:flex flex-col justify-center bg-foreground text-background px-14 py-16 relative overflow-hidden">
        <p className="font-display text-4xl xl:text-5xl leading-tight max-w-md">
          It starts with
          <br />
          <span className="text-primary">who</span>.
          <br />
          It becomes
          <br />
          <span className="text-primary">we</span>.
        </p>
        <p className="text-background/60 mt-8 max-w-sm">
          Small, real-world plans with people who share your interests —
          organized by whoever shows up first.
        </p>
        <Squiggle className="w-40 h-4 mt-8" color="var(--primary)" />
      </div>

      <div className="px-4 sm:px-6 lg:px-14 py-10 lg:py-16 flex flex-col gap-8 max-w-md w-full mx-auto lg:mx-0 justify-center">
        {sent ? (
          <FadeIn>
            <h1 className="text-3xl font-semibold tracking-tight">Check your email</h1>
            <p className="text-muted mt-1.5">
              We sent a sign-in link to <span className="text-foreground">{email}</span>. Open
              it on this device to continue.
            </p>
          </FadeIn>
        ) : (
          <>
            <FadeIn>
              <h1 className="text-3xl font-semibold tracking-tight">Welcome to WhoWe</h1>
              <p className="text-muted mt-1.5">No passwords — we&apos;ll email you a link to sign in.</p>
            </FadeIn>

            <FadeIn delay={0.08}>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none"
                />
                {error && <p className="text-sm text-[#8c2f2f]">{error}</p>}
                <Button type="submit" variant="primary" className="w-full" disabled={sending}>
                  {sending ? "Sending…" : "Send me a link"}
                </Button>
              </form>
            </FadeIn>
          </>
        )}
      </div>
    </div>
  );
}
