"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="text-muted">We hit an unexpected error. Try again, or head back home.</p>
        <div className="flex flex-col gap-3">
          <Button variant="primary" className="w-full" onClick={reset}>
            Try again
          </Button>
          <Link href="/">
            <Button variant="secondary" className="w-full">
              Go home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
