"use client";

interface ChipSelectorProps {
  items: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  min?: number;
  max?: number;
  /** When true, `max` only shows a hint past the limit instead of blocking further picks. */
  maxIsSoft?: boolean;
  /** Items rendered disabled (e.g. already chosen in a mutually-exclusive list elsewhere). */
  disabledItems?: string[];
  /** Selecting this item clears all others; selecting any other item deselects it. */
  exclusiveItem?: string;
  ariaLabel?: string;
}

export function ChipSelector({
  items,
  selected,
  onChange,
  min,
  max,
  maxIsSoft = false,
  disabledItems = [],
  exclusiveItem,
  ariaLabel,
}: ChipSelectorProps) {
  const toggleItem = (item: string) => {
    if (disabledItems.includes(item)) return;

    let updated: string[];
    if (selected.includes(item)) {
      updated = selected.filter((i) => i !== item);
    } else if (item === exclusiveItem) {
      updated = [item];
    } else {
      if (max && !maxIsSoft && selected.length >= max) return;
      updated = [...selected.filter((i) => i !== exclusiveItem), item];
    }
    onChange(updated);
  };

  const overSoftMax = maxIsSoft && !!max && selected.length > max;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2" role="group" aria-label={ariaLabel}>
        {items.map((item) => {
          const isSelected = selected.includes(item);
          const isDisabled = disabledItems.includes(item);
          return (
            <button
              key={item}
              type="button"
              aria-pressed={isSelected}
              disabled={isDisabled}
              onClick={() => toggleItem(item)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium border-2 inline-flex items-center gap-1.5 transition-all ${
                isDisabled
                  ? "border-foreground/20 bg-surface text-muted cursor-not-allowed opacity-50"
                  : isSelected
                    ? "border-foreground bg-primary text-primary-foreground shadow-[1px_1px_0_0_var(--foreground)] translate-x-[1px] translate-y-[1px]"
                    : "border-foreground bg-surface text-foreground shadow-[2px_2px_0_0_var(--foreground)] hover:bg-background hover:shadow-[3px_3px_0_0_var(--foreground)] hover:-translate-x-px hover:-translate-y-px"
              }`}
            >
              {isSelected && <span aria-hidden="true">✓</span>}
              {item}
            </button>
          );
        })}
      </div>
      {typeof min === "number" && selected.length < min && (
        <p className="text-xs text-[#8c2f2f]">Select at least {min - selected.length} more</p>
      )}
      {overSoftMax && <p className="text-xs text-muted">{max} is usually plenty — consider narrowing your picks</p>}
    </div>
  );
}
