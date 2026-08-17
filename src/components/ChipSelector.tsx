"use client";

import { useState, useEffect } from "react";

interface ChipSelectorProps {
  items: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  max?: number;
}

export function ChipSelector({ items, selected, onChange, max }: ChipSelectorProps) {
  const [local, setLocal] = useState(selected);

  useEffect(() => {
    setLocal(selected);
  }, [selected]);

  const toggleItem = (item: string) => {
    let updated: string[];
    if (local.includes(item)) {
      updated = local.filter((i) => i !== item);
    } else {
      if (max && local.length >= max) {
        return;
      }
      updated = [...local, item];
    }
    setLocal(updated);
    onChange(updated);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => toggleItem(item)}
          className={`px-3 py-2 rounded-full text-sm font-medium transition-colors border-2 ${
            local.includes(item)
              ? "border-foreground bg-primary text-primary-foreground"
              : "border-foreground bg-surface text-foreground hover:bg-background"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
