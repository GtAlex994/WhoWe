"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export function BackButton({ label = "Back" }: { label?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
      aria-label={label}
    >
      <ChevronLeft size={18} />
      {label}
    </button>
  );
}
