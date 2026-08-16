"use client";

import { motion } from "motion/react";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground border-foreground",
  secondary: "bg-surface text-foreground border-foreground hover:bg-surface-muted",
  ghost: "bg-transparent text-foreground border-transparent hover:border-border",
  danger: "bg-surface text-[#8c2f2f] border-[#8c2f2f] hover:bg-[#8c2f2f]/5",
};

type ButtonProps = Omit<ComponentProps<typeof motion.button>, "className"> & {
  variant?: Variant;
  className?: string;
};

const INK = "var(--foreground)";

export function Button({ variant = "primary", className = "", children, ...props }: ButtonProps) {
  const bordered = variant !== "ghost";

  return (
    <motion.button
      initial={{ x: 0, y: 0, boxShadow: bordered ? `3px 3px 0 0 ${INK}` : "0 0 0 0 transparent" }}
      whileHover={bordered ? { x: -1, y: -1, boxShadow: `4px 4px 0 0 ${INK}` } : undefined}
      whileTap={bordered ? { x: 3, y: 3, boxShadow: "0 0 0 0 transparent" } : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 600, damping: 32 }}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md border-2 px-5 py-2.5 font-medium cursor-pointer ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
