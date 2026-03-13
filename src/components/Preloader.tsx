import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export function Preloader({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const duration = 2500;
    const interval = 30;
    const step = (interval / duration) * 100;
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setExiting(true);
          setTimeout(onComplete, 600);
          return 100;
        }
        return Math.min(prev + step + Math.random() * 0.5, 100);
      });
    }, interval);
    return () => clearInterval(timer);
  }, [onComplete]);

  const brandText = "Talent-Bridge.";
  const charDelay = 0.06;

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{ background: "hsl(0 0% 2%)" }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Subtle glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 50% 40% at 50% 50%, hsl(160 84% 50% / 0.08) 0%, transparent 70%)",
            }}
          />

          {/* Brand name with character reveal */}
          <div className="relative mb-8">
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
              {brandText.split("").map((char, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.3 + i * charDelay,
                    duration: 0.4,
                    ease: "easeOut",
                  }}
                  className={
                    char === "-" || char === "."
                      ? "text-[hsl(160_84%_50%)]"
                      : "text-[hsl(150_18%_93%)]"
                  }
                >
                  {char}
                </motion.span>
              ))}
            </h1>

            {/* Cursor blink */}
            <motion.span
              className="inline-block w-[3px] h-[1.1em] bg-[hsl(160_84%_50%)] ml-1 align-text-bottom"
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
            />
          </div>

          {/* Tagline */}
          <motion.p
            className="text-[hsl(150_10%_55%)] text-sm tracking-widest uppercase mb-10 font-body"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
          >
            Connecting talent with opportunity
          </motion.p>

          {/* Progress bar */}
          <div className="w-48 sm:w-64">
            <div className="h-[2px] w-full rounded-full bg-[hsl(0_0%_100%/0.06)] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, hsl(160 84% 50%), hsl(160 84% 39%))",
                  width: `${progress}%`,
                }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <motion.p
              className="text-[hsl(150_10%_55%)] text-xs mt-3 text-center tabular-nums"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {Math.round(progress)}%
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
