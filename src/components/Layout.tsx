import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Layout({ children }: { children: ReactNode }) {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main
        className={cn(
          "flex-1",
          theme === "dark" ? "dot-grid" : "gradient-mesh"
        )}
      >
        {children}
      </main>
      <Footer />
    </div>
  );
}
