import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
}

export function GlassCard({ children, className, hover = true, delay = 0 }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay }}
      whileHover={hover ? { y: -3, transition: { duration: 0.2 } } : undefined}
      className={cn(
        "glass-card rounded-lg p-6 transition-all duration-200",
        hover && "cursor-pointer hover:border-primary/20",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
