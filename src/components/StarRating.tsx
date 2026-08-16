export function StarRating({
  avg,
  count,
  hideCount = false,
  className = "",
}: {
  avg: number;
  count: number;
  hideCount?: boolean;
  className?: string;
}) {
  const rounded = Math.round(avg);

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="text-primary tracking-tighter" aria-hidden>
        {"★".repeat(rounded)}
        <span className="text-border">{"★".repeat(5 - rounded)}</span>
      </span>
      {!hideCount && (
        <span className="text-xs text-muted">
          {avg.toFixed(1)} ({count})
        </span>
      )}
    </span>
  );
}
