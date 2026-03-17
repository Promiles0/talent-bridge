import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

const ease = {
  enter: [0.0, 0.0, 0.2, 1] as [number, number, number, number],
  exit: [0.4, 0.0, 1, 1] as [number, number, number, number],
};

const variants = {
  initial: { opacity: 0, y: 16, filter: "blur(4px)" },
  animate: {
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { duration: 0.38, ease: ease.enter },
  },
  exit: {
    opacity: 0, y: -8, filter: "blur(2px)",
    transition: { duration: 0.22, ease: ease.exit },
  },
};

const reducedVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.1 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

export function PageTransition({ children }: { children: ReactNode }) {
  const prefersReduced = useReducedMotion();
  const v = prefersReduced ? reducedVariants : variants;

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={v}
    >
      {children}
    </motion.div>
  );
}
