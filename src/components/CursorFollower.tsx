import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function CursorFollower() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { damping: 25, stiffness: 200, mass: 0.5 });
  const sy = useSpring(y, { damping: 25, stiffness: 200, mass: 0.5 });
  const [scale, setScale] = useState(1);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isCoarse = window.matchMedia("(pointer: coarse)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isCoarse || reduced) return;
    setVisible(true);

    const move = (e: MouseEvent) => { x.set(e.clientX - 16); y.set(e.clientY - 16); };
    const over = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t?.closest("a,button,[role=button]")) setScale(2.2);
      else setScale(1);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
    };
  }, [x, y]);

  if (!visible) return null;
  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-[200] h-8 w-8 rounded-full bg-primary/20 mix-blend-multiply dark:mix-blend-screen backdrop-blur-sm"
      style={{ x: sx, y: sy, scale }}
      transition={{ scale: { type: "spring", stiffness: 300, damping: 20 } }}
    />
  );
}
