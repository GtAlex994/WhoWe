import { ThumbsUp } from "lucide-react";

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
  const percentage = Math.round(((avg + count) / (2 * count)) * 100);

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="inline-flex items-center gap-1 text-primary">
        <ThumbsUp size={16} />
        <span className="text-sm font-medium">{percentage}%</span>
      </span>
      {!hideCount && (
        <span className="text-xs text-muted">
          ({count})
        </span>
      )}
    </span>
  );
}
