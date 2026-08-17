"use client";

import { useState } from "react";

type ChipSelectProps = {
  name: string;
  options: string[];
  defaultValue?: string[];
  multiple?: boolean;
  required?: boolean;
  minSelection?: number;
};

export function ChipSelect({
  name,
  options,
  defaultValue = [],
  multiple = true,
  required = false,
  minSelection = 0,
}: ChipSelectProps) {
  const [selected, setSelected] = useState<string[]>(defaultValue);

  const toggleOption = (option: string) => {
    if (multiple) {
      setSelected((prev) => (prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]));
    } else {
      setSelected([option]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => toggleOption(option)}
            className={`px-4 py-2 rounded-full border-2 transition-colors font-medium text-sm ${
              selected.includes(option)
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-surface border-foreground text-foreground hover:bg-surface-muted"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      {selected.length > 0 && (
        <input type="hidden" name={name} value={JSON.stringify(selected)} />
      )}
      {required && selected.length === 0 && (
        <p className="text-xs text-[#8c2f2f]">Please select at least {minSelection || 1} option</p>
      )}
    </div>
  );
}
