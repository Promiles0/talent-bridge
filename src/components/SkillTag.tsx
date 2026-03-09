import { cn } from "@/lib/utils";

interface SkillTagProps {
  label: string;
  className?: string;
}

export function SkillTag({ label, className }: SkillTagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-secondary/15 text-secondary border border-secondary/20 px-2.5 py-0.5 text-xs font-medium",
        className
      )}
    >
      {label}
    </span>
  );
}
