"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { type ReactNode } from "react";
import { AutoHideHeader } from "@/components/AutoHideHeader";

type ConditionalHeaderProps = {
  children: ReactNode;
};

export function ConditionalHeader({ children }: ConditionalHeaderProps) {
  const pathname = usePathname();
  const isOnboarding = pathname?.includes("/onboarding-flow");

  if (isOnboarding) {
    return null;
  }

  return <AutoHideHeader>{children}</AutoHideHeader>;
}
