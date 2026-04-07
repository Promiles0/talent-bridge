import { useEffect, useRef, useState } from "react";

const BRAND = "Talent-Bridge";
const FILL_DURATION = 2800;
const FILL_START_DELAY = 1100;

export function Preloader({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Particle canvas background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: { x: number; y: number; vx: number; vy: number; r: number; a: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const count = Math.min(60, Math.floor((window.innerWidth * window.innerHeight) / 20000));
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        a: Math.random() * 0.4 + 0.1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(46, 204, 113, ${p.a})`;
        ctx.fill();
      });
      // draw lines between close particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(46, 204, 113, ${(1 - d / 100) * 0.12})`;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Progress bar simulation
  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setProgress(100);
      setTimeout(() => onComplete(), 200);
      return;
    }

    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start - FILL_START_DELAY;
      if (elapsed < 0) return;
      const t = Math.min(elapsed / FILL_DURATION, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const pct = Math.round(eased * 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(timer);
        setTimeout(() => {
          setExiting(true);
          setTimeout(() => onComplete(), 900);
        }, 300);
      }
    }, 30);
    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div
      ref={loaderRef}
      className={`preloader ${exiting ? "preloader-exit" : ""}`}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0d0d0d",
        transition: "opacity 0.9s ease, transform 0.9s ease, filter 0.9s ease",
        ...(exiting
          ? { opacity: 0, transform: "scale(0.94) translateY(-8px)", filter: "blur(6px)", pointerEvents: "none" as const }
          : {}),
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}
      />

      <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 20 }}>
        {/* Logo with letter drop */}
        <div className="preloader-logo">
          {BRAND.split("").map((char, i) => (
            <span
              key={i}
              className="preloader-letter"
              style={{
                animationDelay: `${0.05 + i * 0.05}s`,
                color: char === "-" ? "#2ECC71" : "#ffffff",
              }}
            >
              {char}
            </span>
          ))}
          <span className="preloader-dot" />
        </div>

        {/* Underline sweep */}
        <div className="preloader-underline" />

        {/* Progress bar */}
        <div className="preloader-bar-wrap">
          <div className="preloader-bar-track">
            <div className="preloader-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="preloader-bar-row">
            <span className="preloader-bar-status">
              {progress < 100 ? "Initializing" : "Ready"}
            </span>
            <span className="preloader-bar-pct">{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
