"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";

type View = "form" | "code-sent" | "verified";

async function parseJsonResponse(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Something went wrong. Please try again.");
  }
}

export function PhoneForm({ currentPhone, verified }: { currentPhone: string | null; verified: boolean }) {
  const router = useRouter();
  const [view, setView] = useState<View>(verified ? "verified" : "form");
  const [phone, setPhone] = useState(currentPhone ?? "");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode() {
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/profile/phone/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.error);
      setCode("");
      setView("code-sent");
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Couldn't send that code. Try again.");
    } finally {
      setSending(false);
    }
  }

  function handleRequestSubmit(e: FormEvent) {
    e.preventDefault();
    sendCode();
  }

  async function verifyCode(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setVerifying(true);
    try {
      const res = await fetch("/api/profile/phone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.error);
      setView("verified");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "That code doesn't match.");
    } finally {
      setVerifying(false);
    }
  }

  if (view === "verified") {
    return (
      <div className="border-2 border-foreground rounded-md p-4 shadow-[2px_2px_0_0_var(--foreground)]">
        <p className="text-sm">✓ Phone verified — {currentPhone}</p>
        <button
          type="button"
          onClick={() => {
            setView("form");
            setError(null);
          }}
          className="text-sm text-primary underline mt-2"
        >
          Use a different number
        </button>
      </div>
    );
  }

  if (view === "code-sent") {
    return (
      <form onSubmit={verifyCode} className="flex flex-col gap-3">
        <p className="text-sm text-muted">
          We sent a 6-digit code to <span className="text-foreground">{phone}</span>. It expires in 10 minutes.
        </p>
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
        <Button type="submit" variant="primary" disabled={verifying || code.length !== 6}>
          {verifying ? "Checking…" : "Verify code"}
        </Button>
        <div className="flex items-center justify-between text-sm">
          <button type="button" onClick={() => setView("form")} className="text-muted underline">
            Use a different number
          </button>
          <button
            type="button"
            disabled={sending}
            onClick={() => sendCode()}
            className="text-muted underline disabled:opacity-50"
          >
            {sending ? "Sending…" : "Resend code"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleRequestSubmit} className="flex flex-col gap-3">
      <label htmlFor="phone" className="text-sm font-medium">
        Phone number
      </label>
      <input
        id="phone"
        type="tel"
        required
        autoFocus
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+61412345678"
        className="border-2 border-foreground bg-surface rounded-md px-4 py-2.5 outline-none"
      />
      <p className="text-xs text-muted">Include your country code, e.g. +61 for Australia.</p>
      {error && <p className="text-sm text-[#8c2f2f]">{error}</p>}
      <Button type="submit" variant="primary" disabled={sending}>
        {sending ? "Sending…" : "Send me a code"}
      </Button>
    </form>
  );
}
