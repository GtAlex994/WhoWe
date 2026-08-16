import type { ReactNode } from "react";

export function StaggerList({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <ul className={className}>{children}</ul>;
}

export function StaggerItem({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <li className={`stagger-item ${className}`}>{children}</li>;
}
