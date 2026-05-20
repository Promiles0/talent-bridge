import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type Props = {
  verified?: boolean | null;
  kind?: "student" | "company";
  className?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
};

export function VerifiedBadge({ verified, kind = "student", className, size = "sm", showLabel = false }: Props) {
  if (!verified) return null;
  const sizeMap = { sm: "h-3.5 w-3.5", md: "h-4 w-4", lg: "h-5 w-5" };
  const label = kind === "company" ? "Verified employer" : "Verified student";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn("inline-flex items-center gap-1 text-primary font-medium", className)}>
          <BadgeCheck className={cn(sizeMap[size], "fill-primary/15")} />
          {showLabel && <span className="text-xs">{label}</span>}
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
