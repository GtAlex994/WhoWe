import type { CSSProperties, ReactNode } from "react";

export function FadeIn({
  children,
  delay = 0,
  y = 12,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const style: CSSProperties & { "--fade-in-y"?: string } = {
    animationDelay: `${delay}s`,
    "--fade-in-y": `${y}px`,
  };

  return (
    <div className={`fade-in ${className}`} style={style}>
      {children}
    </div>
  );
}
