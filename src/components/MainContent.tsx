"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isNavHiddenRoute } from "@/lib/nav";

export function MainContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const clearDock = !isNavHiddenRoute(pathname);

  return <main className={`flex-1 relative w-full ${clearDock ? "pb-24" : ""}`}>{children}</main>;
}
