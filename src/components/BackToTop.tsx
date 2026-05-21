import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

export function BackToTop() {
  const { scrollYProgress } = useScroll();
  const dash = useTransform(scrollYProgress, (v) => `${v * 100} 100`);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const fn = () => setShow(window.scrollY > 500);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          aria-label="Back to top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="fixed bottom-24 md:bottom-6 right-4 z-50 h-12 w-12 rounded-full bg-card/90 backdrop-blur-md border border-border shadow-lg flex items-center justify-center group hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="16" fill="none" stroke="hsl(var(--muted))" strokeWidth="2" />
            <motion.circle
              cx="18" cy="18" r="16" fill="none" stroke="hsl(var(--primary))"
              strokeWidth="2" strokeLinecap="round" pathLength={100}
              style={{ strokeDasharray: dash }}
            />
          </svg>
          <ArrowUp className="h-5 w-5 relative z-10" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
