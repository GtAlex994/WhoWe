"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tracks scroll direction and returns whether scroll-linked chrome (header,
 * dock, ...) should currently be hidden: true on a fast scroll-down past the
 * top, false near the top or on any scroll-up.
 */
export function useAutoHideOnScroll() {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;
    let ticking = false;

    function update() {
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
      ticking = false;
    }

    function onScroll() {
      // Batch to one update per frame so a burst of touch-scroll events
      // (common on iPad) can't saturate the main thread and delay the tap
      // that follows.
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return hidden;
}
