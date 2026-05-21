import { motion } from "framer-motion";

/**
 * Animated mesh-gradient background. Pure CSS+SVG, no canvas.
 * Drop inside a relatively-positioned section.
 */
export function MeshGradient({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <motion.div
        className="absolute -top-32 -left-32 h-[480px] w-[480px] rounded-full bg-primary/30 blur-3xl"
        animate={{ x: [0, 80, -40, 0], y: [0, 60, -30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 -right-24 h-[420px] w-[420px] rounded-full bg-secondary/30 blur-3xl"
        animate={{ x: [0, -60, 40, 0], y: [0, -40, 50, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 left-1/3 h-[360px] w-[360px] rounded-full bg-primary/20 blur-3xl"
        animate={{ x: [0, 50, -50, 0], y: [0, -30, 30, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_30%,hsl(var(--background))_70%)]" />
    </div>
  );
}
