"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { isNavHiddenRoute } from "@/lib/nav";

export function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

  if (isNavHiddenRoute(pathname) || pathname === "/") return null;

  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Back"
      className="fixed top-24 left-4 z-40 flex items-center justify-center h-10 w-10 rounded-full border-2 border-foreground bg-surface shadow-[2px_2px_0_0_var(--foreground)] hover:shadow-[3px_3px_0_0_var(--foreground)] hover:-translate-x-px hover:-translate-y-px transition-all"
    >
      <ChevronLeft size={20} />
    </button>
  );
}
