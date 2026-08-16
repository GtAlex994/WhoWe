import { categoryColor } from "@/lib/categories";

export function CategoryTag({ category, className = "" }: { category: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase text-muted ${className}`}>
      <span
        className="h-2 w-2 rounded-full shrink-0"
        style={{ backgroundColor: categoryColor(category) }}
        aria-hidden
      />
      {category}
    </span>
  );
}
