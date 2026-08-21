"use client";

interface SingleChoiceProps {
  label: string;
  hint: string;
  options: string[];
  value: string | null;
  onChange: (value: string) => void;
  required?: boolean;
}

export function SingleChoice({ label, hint, options, value, onChange, required }: SingleChoiceProps) {
  return (
    <div>
      <p className="text-sm font-medium mb-1">
        {label} {!required && <span className="font-normal text-muted">(optional)</span>}
      </p>
      <p className="text-xs text-muted mb-2">{hint}</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={value === option}
            onClick={() => onChange(option)}
            className={`text-sm font-medium px-3 py-1.5 rounded-md border-2 border-foreground transition-all ${
              value === option
                ? "bg-primary text-primary-foreground shadow-[1px_1px_0_0_var(--foreground)] translate-x-[1px] translate-y-[1px]"
                : "bg-surface shadow-[2px_2px_0_0_var(--foreground)] hover:shadow-[3px_3px_0_0_var(--foreground)] hover:-translate-x-px hover:-translate-y-px"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
