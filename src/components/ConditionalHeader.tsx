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

export function ConditionalHeader({ children }: ConditionalHeaderProps) {
  const pathname = usePathname();
  const mounted = useMounted();

  if (!mounted) {
    return <AutoHideHeader>{children}</AutoHideHeader>;
  }

  const isOnboarding = pathname?.includes("/onboarding-flow");

  if (isOnboarding) {
    return null;
  }

  return <AutoHideHeader>{children}</AutoHideHeader>;
}
