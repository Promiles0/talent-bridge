import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import { forwardRef, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MagneticButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  strength?: number;
}

/**
 * A button that subtly drifts toward the cursor on hover.
 * Respects prefers-reduced-motion.
 */
export const MagneticButton = forwardRef<HTMLButtonElement, MagneticButtonProps>(
  ({ children, className, strength = 0.35, ...props }, _ref) => {
    const ref = useRef<HTMLButtonElement>(null);
    const reduced = useReducedMotion();

    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const sx = useSpring(x, { stiffness: 200, damping: 18, mass: 0.4 });
    const sy = useSpring(y, { stiffness: 200, damping: 18, mass: 0.4 });

    const onMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (reduced || !ref.current) return;
      const r = ref.current.getBoundingClientRect();
      x.set((e.clientX - (r.left + r.width / 2)) * strength);
      y.set((e.clientY - (r.top + r.height / 2)) * strength);
    };
    const reset = () => { x.set(0); y.set(0); };

    return (
      <motion.button
        ref={ref}
        style={{ x: sx, y: sy }}
        onMouseMove={onMove}
        onMouseLeave={reset}
        className={cn("relative inline-flex select-none", className)}
        {...(props as any)}
      >
        {children}
      </motion.button>
    );
  }
);
MagneticButton.displayName = "MagneticButton";
