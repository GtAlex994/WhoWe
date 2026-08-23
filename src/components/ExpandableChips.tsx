"use client";

import { useState } from "react";

export function ExpandableChips({
  items,
  limit,
  variant = "default",
}: {
  items: string[];
  limit: number;
  variant?: "default" | "primary";
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, limit);
  const hiddenCount = items.length - limit;

  const chipClass =
    variant === "primary"
      ? "text-sm rounded-md border-2 border-foreground bg-primary text-primary-foreground px-3 py-1 shadow-[2px_2px_0_0_var(--foreground)]"
      : "text-sm rounded-md border-2 border-foreground px-3 py-1 shadow-[2px_2px_0_0_var(--foreground)]";

  return (
    <div className="flex flex-wrap gap-2">
      {visible.map((item) => (
        <span key={item} className={chipClass}>
          {item}
        </span>
      ))}
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="text-sm rounded-md border-2 border-foreground px-3 py-1 text-muted hover:text-foreground shadow-[2px_2px_0_0_var(--foreground)] hover:shadow-[3px_3px_0_0_var(--foreground)] hover:-translate-x-px hover:-translate-y-px transition-all"
        >
          {expanded ? "Show less" : `+${hiddenCount} more`}
        </button>
      )}
    </div>
  );
}
