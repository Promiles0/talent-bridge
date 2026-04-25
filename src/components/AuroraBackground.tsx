import { cn } from "@/lib/utils";

interface AuroraBackgroundProps {
  className?: string;
  intensity?: "subtle" | "normal" | "vivid";
}

/**
 * Animated, theme-aware aurora gradient background.
 * Uses semantic HSL tokens (primary / accent) with multiplied radial gradients.
 */
export function AuroraBackground({ className, intensity = "normal" }: AuroraBackgroundProps) {
  const opacity = intensity === "subtle" ? 0.25 : intensity === "vivid" ? 0.7 : 0.45;

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden",
        className
      )}
    >
      <div
        className="absolute -top-1/3 -left-1/4 h-[70vh] w-[70vw] rounded-full blur-3xl animate-aurora-1"
        style={{
          background: `radial-gradient(closest-side, hsl(var(--primary) / ${opacity}), transparent 70%)`,
        }}
      />
      <div
        className="absolute -bottom-1/3 -right-1/4 h-[70vh] w-[70vw] rounded-full blur-3xl animate-aurora-2"
        style={{
          background: `radial-gradient(closest-side, hsl(var(--accent) / ${opacity}), transparent 70%)`,
        }}
      />
      <div
        className="absolute top-1/3 left-1/3 h-[50vh] w-[50vw] rounded-full blur-3xl animate-aurora-3"
        style={{
          background: `radial-gradient(closest-side, hsl(var(--primary) / ${opacity * 0.6}), transparent 70%)`,
        }}
      />
    </div>
  );
}
