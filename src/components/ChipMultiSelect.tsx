"use client";

import { useState } from "react";
import { motion } from "motion/react";

export function ChipMultiSelect({
  name,
  options,
  defaultValue = [],
}: {
  name: string;
  options: readonly string[];
  defaultValue?: string[];
}) {
  const [selected, setSelected] = useState<string[]>(defaultValue);

  function toggle(option: string) {
    setSelected((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option],
    );
  }

  return (
    <div>
      <input type="hidden" name={name} value={selected.join(",")} />
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <motion.button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              whileTap={{ scale: 0.95 }}
              className={`rounded-full border-2 px-4 py-1.5 text-sm font-medium cursor-pointer transition-colors ${
                active
                  ? "bg-primary text-primary-foreground border-foreground"
                  : "bg-surface text-foreground border-border hover:border-foreground"
              }`}
            >
              {option}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
