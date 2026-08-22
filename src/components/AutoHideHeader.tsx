"use client";

import type { ReactNode } from "react";
import { useAutoHideOnScroll } from "@/hooks/useAutoHideOnScroll";

export function AutoHideHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  const hidden = useAutoHideOnScroll();

  return (
    <header
      className={`sticky top-0 z-40 border-b-2 border-foreground bg-background/95 backdrop-blur-sm transition-transform duration-300 ease-out ${
        hidden ? "-translate-y-full" : "translate-y-0"
      } ${className}`}
    >
      {children}
    </header>
  );
}
