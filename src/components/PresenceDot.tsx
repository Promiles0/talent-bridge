import { cn } from "@/lib/utils";
import type { PresenceStatus } from "@/lib/realtime";

interface Props {
  status?: PresenceStatus;
  className?: string;
}

export function PresenceDot({ status = "offline", className }: Props) {
  return (
    <span
      aria-label={`status ${status}`}
      className={cn(
        "presence-dot",
        status === "online" && "presence-online",
        status === "away" && "presence-away",
        status === "offline" && "presence-offline",
        className
      )}
    />
  );
}
