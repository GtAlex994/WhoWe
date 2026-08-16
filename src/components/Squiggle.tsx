export function Squiggle({ className = "", color = "var(--primary)" }: { className?: string; color?: string }) {
  return (
    <svg
      viewBox="0 0 200 12"
      preserveAspectRatio="none"
      aria-hidden
      className={className}
    >
      <path
        d="M2 8.5C30 2 55 2 75 7C95 12 120 3 145 6C165 8.3 180 3 198 6.5"
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
