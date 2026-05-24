import { motion } from "framer-motion";
import { Command } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Subtle pill that hints at the global Command-K palette.
 * Auto-hides after first open and on mobile.
 */
export function CommandKHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(max-width: 768px)").matches) return;
    if (localStorage.getItem("cmdk-hint-dismissed")) return;
    const t = setTimeout(() => setVisible(true), 1800);
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        localStorage.setItem("cmdk-hint-dismissed", "1");
        setVisible(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => { clearTimeout(t); window.removeEventListener("keydown", onKey); };
  }, []);

  if (!visible) return null;

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      onClick={() => {
        localStorage.setItem("cmdk-hint-dismissed", "1");
        setVisible(false);
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
      }}
      className="fixed bottom-24 left-6 z-40 hidden md:flex items-center gap-2 rounded-full bg-background/70 backdrop-blur-md border border-border px-3 py-1.5 text-xs text-muted-foreground shadow-lg hover:text-foreground hover:border-primary/40 transition-colors"
    >
      <Command className="h-3 w-3" />
      <span>Press</span>
      <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-[10px]">⌘K</kbd>
      <span>to jump anywhere</span>
    </motion.button>
  );
}
