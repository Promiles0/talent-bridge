import { type ReactNode } from "react";

interface Props {
  children: ReactNode;
  speed?: number; // seconds for one cycle
  className?: string;
}

export function Marquee({ children, speed = 30, className = "" }: Props) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />
      <div className="flex w-max gap-12 animate-[marquee_var(--marquee-duration)_linear_infinite]"
           style={{ ["--marquee-duration" as any]: `${speed}s` }}>
        <div className="flex shrink-0 items-center gap-12">{children}</div>
        <div className="flex shrink-0 items-center gap-12" aria-hidden>{children}</div>
      </div>
    </div>
  );
}
