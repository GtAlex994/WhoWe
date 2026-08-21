"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore, type ReactNode } from "react";
import { AutoHideHeader } from "@/components/AutoHideHeader";

type ConditionalHeaderProps = {
  children: ReactNode;
};

function subscribeNoop() {
  return () => {};
}

function useMounted() {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}

// Matches MobileDock's own hidden-route list, since both are part of the
// same "is there any navigation chrome on this page" decision.
const HIDDEN_ON = ["/sign-in", "/onboarding"];

export function ConditionalHeader({ children }: ConditionalHeaderProps) {
  const pathname = usePathname();
  const mounted = useMounted();

  if (!mounted) {
    return <AutoHideHeader>{children}</AutoHideHeader>;
  }

  const isHiddenRoute = HIDDEN_ON.some((path) => pathname === path || pathname?.startsWith(`${path}/`));
  if (isHiddenRoute) {
    return null;
  }

  // On mobile, MobileDock is the nav — showing this header too on non-home
  // pages just duplicates it above each page's own back button. Desktop has
  // no dock, so the header (and its nav links) must stay visible everywhere.
  const isHome = pathname === "/";

  return <AutoHideHeader className={isHome ? undefined : "hidden lg:block"}>{children}</AutoHideHeader>;
}
