"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AutoHideHeader } from "@/components/AutoHideHeader";

type ConditionalHeaderProps = {
  children: ReactNode;
};

export function ConditionalHeader({ children }: ConditionalHeaderProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <AutoHideHeader>{children}</AutoHideHeader>;
  }

  const isOnboarding = pathname?.includes("/onboarding-flow");

  if (isOnboarding) {
    return null;
  }

  return <AutoHideHeader>{children}</AutoHideHeader>;
}
