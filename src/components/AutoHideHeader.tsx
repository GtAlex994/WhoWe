"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function AutoHideHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;

    function onScroll() {
      const y = window.scrollY;
      const diff = y - lastY.current;

      if (y < 64) {
        setHidden(false);
      } else if (diff > 10) {
        setHidden(true);
      } else if (diff < -10) {
        setHidden(false);
      }

      lastY.current = y;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-20 border-b-2 border-foreground bg-background/95 backdrop-blur-sm transition-transform duration-300 ease-out ${
        hidden ? "-translate-y-full" : "translate-y-0"
      } ${className}`}
    >
      {children}
    </header>
  );
}
