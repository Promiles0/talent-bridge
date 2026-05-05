import { cn } from "@/lib/utils";
import type { ReactNode, HTMLAttributes } from "react";

interface BentoCardProps extends HTMLAttributes<HTMLDivElement> {
  span?: 1 | 2 | 3 | 4 | 6 | 12;
  rowSpan?: 1 | 2 | 3;
  glow?: boolean;
  children: ReactNode;
}

const colSpan: Record<number, string> = {
  1: "md:col-span-1", 2: "md:col-span-2", 3: "md:col-span-3",
  4: "md:col-span-4", 6: "md:col-span-6", 12: "md:col-span-12",
};
const rowSpanCls: Record<number, string> = {
  1: "row-span-1", 2: "row-span-2", 3: "row-span-3",
};

export function BentoCard({ span = 4, rowSpan = 1, glow = true, className, children, ...rest }: BentoCardProps) {
  return (
    <div
      className={cn(
        "bento-card col-span-12",
        colSpan[span],
        rowSpanCls[rowSpan],
        glow && "bento-card-glow",
        "animate-slide-up",
        className
      )}
      {...rest}
    >
      <div className="relative h-full p-5">{children}</div>
    </div>
  );
}

export function BentoGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-12 auto-rows-[minmax(120px,auto)] gap-4", className)}>
      {children}
    </div>
  );
}
