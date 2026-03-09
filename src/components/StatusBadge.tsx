import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  applied: "bg-secondary/20 text-secondary border-secondary/30",
  interview: "bg-primary/20 text-primary border-primary/30",
  offered: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  rejected: "bg-destructive/20 text-destructive border-destructive/30",
  shortlisted: "bg-primary/20 text-primary border-primary/30",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = statusStyles[status.toLowerCase()] || statusStyles.applied;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
        style,
        className
      )}
    >
      {status}
    </span>
  );
}
