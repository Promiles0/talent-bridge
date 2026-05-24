import { useState, type MouseEvent } from "react";

interface RippleSpec { id: number; x: number; y: number; size: number }

/**
 * Drop inside any relative-positioned element to add a Material-style click ripple.
 * Usage: <button className="relative overflow-hidden"><Ripple />Label</button>
 */
export function Ripple({ color = "hsl(var(--primary-foreground) / 0.45)" }: { color?: string }) {
  const [ripples, setRipples] = useState<RippleSpec[]>([]);

  const onClick = (e: MouseEvent<HTMLSpanElement>) => {
    const target = e.currentTarget.parentElement;
    if (!target) return;
    const r = target.getBoundingClientRect();
    const size = Math.max(r.width, r.height) * 2;
    const id = Date.now() + Math.random();
    setRipples((rs) => [...rs, { id, x: e.clientX - r.left - size / 2, y: e.clientY - r.top - size / 2, size }]);
    setTimeout(() => setRipples((rs) => rs.filter((rp) => rp.id !== id)), 650);
  };

  return (
    <span aria-hidden onClick={onClick} className="absolute inset-0 pointer-events-auto">
      {ripples.map((r) => (
        <span
          key={r.id}
          style={{
            left: r.x, top: r.y, width: r.size, height: r.size, background: color,
          }}
          className="absolute rounded-full opacity-60 animate-[ripple_650ms_ease-out_forwards]"
        />
      ))}
    </span>
  );
}
