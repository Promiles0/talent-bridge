import { useEffect, useState } from "react";
import { useTheme } from "./ThemeProvider";

export function BackgroundEffects() {
  const { theme } = useTheme();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY * 0.1);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isDark = theme === "dark";

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      {/* Amber blob - left side */}
      <div
        className="floating-blob absolute rounded-full blur-3xl"
        style={{
          width: "40vw",
          height: "40vw",
          maxWidth: "600px",
          maxHeight: "600px",
          left: "-10%",
          top: `${10 + scrollY * 0.3}%`,
          background: isDark
            ? "radial-gradient(circle, hsl(36 90% 55% / 0.08) 0%, transparent 70%)"
            : "radial-gradient(circle, hsl(34 90% 44% / 0.06) 0%, transparent 70%)",
          animation: "blob-drift-1 20s ease-in-out infinite",
        }}
      />

      {/* Teal blob - right side */}
      <div
        className="floating-blob absolute rounded-full blur-3xl"
        style={{
          width: "35vw",
          height: "35vw",
          maxWidth: "500px",
          maxHeight: "500px",
          right: "-5%",
          top: `${40 + scrollY * -0.2}%`,
          background: isDark
            ? "radial-gradient(circle, hsl(168 76% 50% / 0.06) 0%, transparent 70%)"
            : "radial-gradient(circle, hsl(174 84% 29% / 0.05) 0%, transparent 70%)",
          animation: "blob-drift-2 25s ease-in-out infinite",
        }}
      />

      {/* Purple blob - center */}
      <div
        className="floating-blob absolute rounded-full blur-3xl"
        style={{
          width: "30vw",
          height: "30vw",
          maxWidth: "450px",
          maxHeight: "450px",
          left: "40%",
          top: `${60 + scrollY * 0.15}%`,
          background: isDark
            ? "radial-gradient(circle, hsl(280 60% 50% / 0.04) 0%, transparent 70%)"
            : "radial-gradient(circle, hsl(280 60% 50% / 0.03) 0%, transparent 70%)",
          animation: "blob-drift-3 30s ease-in-out infinite",
        }}
      />

      <style>{`
        @keyframes blob-drift-1 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(5%, 10%) scale(1.05);
          }
          66% {
            transform: translate(-3%, 5%) scale(0.95);
          }
        }

        @keyframes blob-drift-2 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(-8%, -5%) scale(0.95);
          }
          66% {
            transform: translate(4%, 8%) scale(1.05);
          }
        }

        @keyframes blob-drift-3 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-5%, -10%) scale(1.1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .floating-blob {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
