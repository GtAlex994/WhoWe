"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { sendSignInLinkToEmail, signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { FadeIn } from "@/components/FadeIn";
import { Button } from "@/components/Button";

type Method = "link" | "code";
type View = "form" | "link-sent" | "code-sent";

async function parseJsonResponse(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Something went wrong. Please try again.");
  }
}

export default function SignInPage() {
  const router = useRouter();
  const [method, setMethod] = useState<Method>("link");
  const [view, setView] = useState<View>("form");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestSignIn() {
    setError(null);
    setSending(true);
    try {
      if (method === "link") {
        await sendSignInLinkToEmail(auth, email, {
          url: `${window.location.origin}/sign-in/verify`,
          handleCodeInApp: true,
        });
        window.localStorage.setItem("emailForSignIn", email);
        setView("link-sent");
      } else {
        const res = await fetch("/api/auth/otp/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await parseJsonResponse(res);
        if (!res.ok) throw new Error(data.error);
        setCode("");
        setView("code-sent");
      }
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : `Couldn't send that ${method === "link" ? "link" : "code"}. Check the email address and try again.`,
      );
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    requestSignIn();
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setVerifying(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.error);

      const credential = await signInWithCustomToken(auth, data.customToken);
      const idToken = await credential.user.getIdToken();
      const sessionRes = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const { needsOnboarding, error: sessionError } = await parseJsonResponse(sessionRes);
      if (!sessionRes.ok) throw new Error(sessionError ?? "Couldn't start a session. Try again.");
      window.location.href = needsOnboarding ? "/onboarding" : "/";
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "That code doesn't match.");
    } finally {
      setVerifying(false);
    }
  }

  function backToForm() {
    setView("form");
    setError(null);
    setCode("");
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
          Small, real-world plans with people who share your interests,
          organized by whoever shows up first.
        </p>
      </div>

      <div className="px-4 sm:px-6 lg:px-14 py-10 lg:py-16 flex flex-col gap-8 max-w-md w-full mx-auto lg:mx-0 justify-center">
        {view === "link-sent" && (
          <FadeIn>
            <h1 className="text-3xl font-semibold tracking-tight">Check your email</h1>
            <p className="text-muted mt-1.5">
              We sent a sign-in link to <span className="text-foreground">{email}</span>. Open
              it on this device to continue.
            </p>
            <button
              type="button"
              onClick={backToForm}
              className="text-sm text-muted underline mt-4"
            >
              Use a different email or method
            </button>
          </FadeIn>
        )}

        {view === "code-sent" && (
          <FadeIn>
            <h1 className="text-3xl font-semibold tracking-tight">Enter your code</h1>
            <p className="text-muted mt-1.5">
              We sent a 6-digit code to <span className="text-foreground">{email}</span>. It
              expires in 10 minutes.
            </p>
            <form onSubmit={handleVerify} className="flex flex-col gap-3 mt-4">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                autoFocus
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none tracking-[0.3em] text-lg text-center"
              />
              {error && <p className="text-sm text-[#8c2f2f]">{error}</p>}
              <Button type="submit" variant="primary" className="w-full" disabled={verifying || code.length !== 6}>
                {verifying ? "Checking…" : "Verify code"}
              </Button>
              <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={backToForm} className="text-muted underline">
                  Use a different email or method
                </button>
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => requestSignIn()}
                  className="text-muted underline disabled:opacity-50"
                >
                  {sending ? "Sending…" : "Resend code"}
                </button>
              </div>
            </form>
          </FadeIn>
        )}

        {view === "form" && (
          <>
            <FadeIn>
              <h1 className="text-3xl font-semibold tracking-tight">Welcome to WhoWe</h1>
              <p className="text-muted mt-1.5">
                No passwords. We&apos;ll email you a {method === "link" ? "link" : "code"} to
                sign in.
              </p>
            </FadeIn>

            <FadeIn delay={0.04}>
              <div className="inline-flex border-2 border-foreground rounded-md overflow-hidden self-start">
                <button
                  type="button"
                  onClick={() => setMethod("link")}
                  className={`px-4 py-2 text-sm font-medium cursor-pointer ${
                    method === "link" ? "bg-primary text-primary-foreground" : "bg-surface"
                  }`}
                >
                  Email link
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("code")}
                  className={`px-4 py-2 text-sm font-medium cursor-pointer border-l-2 border-foreground ${
                    method === "code" ? "bg-primary text-primary-foreground" : "bg-surface"
                  }`}
                >
                  Email code
                </button>
              </div>
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
                  {sending ? "Sending…" : method === "link" ? "Send me a link" : "Send me a code"}
                </Button>
              </form>
            </FadeIn>

            {method === "code" && (
              <FadeIn delay={0.1}>
                <p className="text-xs text-muted">
                  Useful if you have the email open on a different device than the one you&apos;re
                  signing in on.
                </p>
              </FadeIn>
            )}
          </>
        )}
      </div>
    </div>
  );
}
