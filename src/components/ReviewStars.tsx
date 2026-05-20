import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function ReviewStars({ value = 0, onChange, size = "md", readOnly }: {
  value?: number; onChange?: (v: number) => void; size?: "sm" | "md" | "lg"; readOnly?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;
  const sizeCls = { sm: "h-3.5 w-3.5", md: "h-5 w-5", lg: "h-6 w-6" }[size];
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onMouseEnter={() => !readOnly && setHover(n)}
          onMouseLeave={() => setHover(null)}
          onClick={() => !readOnly && onChange?.(n)}
          className={cn("transition-transform", !readOnly && "hover:scale-110 cursor-pointer")}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          <Star className={cn(sizeCls, n <= display ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40")} />
        </button>
      ))}
    </div>
  );
}

export function ReputationSummary({ avg, count }: { avg?: number | null; count?: number | null }) {
  if (!count) return <span className="text-xs text-muted-foreground">No reviews yet</span>;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <ReviewStars value={Math.round(Number(avg ?? 0))} size="sm" readOnly />
      <span className="font-semibold">{Number(avg).toFixed(1)}</span>
      <span className="text-muted-foreground">({count})</span>
    </span>
  );
}
