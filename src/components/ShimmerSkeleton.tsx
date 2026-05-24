import { cn } from "@/lib/utils";

/**
 * Skeleton with a moving sheen — replaces plain pulse for hero/list placeholders.
 */
export function ShimmerSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted/60",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-white/15 before:to-transparent",
        className
      )}
    />
  );
}
