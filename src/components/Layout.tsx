import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { BackgroundEffects } from "./BackgroundEffects";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Layout({ children }: { children: ReactNode }) {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col">
      <BackgroundEffects />
      <Navbar />
      <main
        className={cn(
          "flex-1 noise-overlay relative",
          theme === "dark" ? "bg-immersive-dark" : "bg-immersive-light"
        )}
      >
        {children}
      </main>
      <Footer />
    </div>
  );
}
