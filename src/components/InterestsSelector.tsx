"use client";

import { useState } from "react";
import { INTEREST_CATEGORIES } from "@/lib/interests";

type InterestsSelectorProps = {
  defaultInterests?: string[];
  onSelect?: (interests: string[]) => void;
  minRequired?: number;
};

export function InterestsSelector({
  defaultInterests = [],
  onSelect,
  minRequired = 5,
}: InterestsSelectorProps) {
  const [selected, setSelected] = useState<string[]>(defaultInterests);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    defaultInterests.length === 0 ? INTEREST_CATEGORIES[0].name : null,
  );

  const toggleInterest = (interest: string) => {
    const newSelected = selected.includes(interest) ? selected.filter((i) => i !== interest) : [...selected, interest];
    setSelected(newSelected);
    onSelect?.(newSelected);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {selected.map((interest) => (
          <button
            key={interest}
            type="button"
            onClick={() => toggleInterest(interest)}
            className="px-3 py-1.5 text-sm rounded-full bg-primary text-primary-foreground border-2 border-primary flex items-center gap-2"
          >
            {interest}
            <span className="ml-1">✕</span>
          </button>
        ))}
      </div>

      {selected.length < minRequired && (
        <p className="text-xs text-[#8c2f2f]">
          Please select at least {minRequired} interests ({selected.length}/{minRequired})
        </p>
      )}

      <div className="space-y-3">
        {INTEREST_CATEGORIES.map((category) => (
          <div key={category.name} className="border-2 border-foreground/20 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() =>
                setExpandedCategory(expandedCategory === category.name ? null : category.name)
              }
              className="w-full flex items-center gap-3 p-3 hover:bg-surface-muted transition-colors"
            >
              <span className="text-xl">{category.emoji}</span>
              <span className="font-medium flex-1 text-left">{category.name}</span>
              <span className={`transition-transform ${expandedCategory === category.name ? "rotate-180" : ""}`}>
                ▼
              </span>
            </button>

            {expandedCategory === category.name && (
              <div className="p-3 border-t-2 border-foreground/20 bg-surface-muted flex flex-wrap gap-2">
                {category.items.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleInterest(item)}
                    className={`px-3 py-1.5 rounded-full border-2 transition-colors text-sm font-medium ${
                      selected.includes(item)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-surface border-foreground text-foreground hover:bg-surface-muted"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <input type="hidden" name="interests" value={JSON.stringify(selected)} />
    </div>
  );
}
