import { DollarSign } from "lucide-react";

export function EventPriceBadge({ isFree, price }: { isFree: boolean; price: number | null }) {
  return isFree ? (
    <span className="inline-flex items-center text-[10px] font-semibold text-accent bg-background border-2 border-accent rounded-full px-2 py-0.5">
      Free
    </span>
  ) : (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-foreground bg-background border-2 border-foreground rounded-full px-2 py-0.5">
      <DollarSign size={10} />
      {price}
    </span>
  );
}
