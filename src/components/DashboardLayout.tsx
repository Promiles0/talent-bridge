import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/ThemeProvider";
import { Navigate, Link } from "react-router-dom";
import { Sun, Moon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/NotificationBell";
import { MobileTabBar } from "@/components/MobileTabBar";
import { AIChatWidget } from "@/components/AIChatWidget";
import { usePresenceHeartbeat } from "@/lib/realtime";
import type { ReactNode } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
  requiredRole?: "student" | "employer" | "admin";
}

export function DashboardLayout({ children, sidebar, requiredRole }: DashboardLayoutProps) {
  const { user, role, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  usePresenceHeartbeat();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && role !== requiredRole) return <Navigate to="/" replace />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {sidebar}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border bg-card px-2 sm:px-4 gap-1 sm:gap-2 shrink-0">
            <SidebarTrigger />
            <Link to="/" className="font-heading text-base sm:text-lg font-bold tracking-tight hover:opacity-80 transition-opacity shrink-0">
              <span className="text-foreground">Talent</span>
              <span className="text-primary">Bridge</span>
            </Link>
            <span className="font-heading text-sm font-semibold text-muted-foreground capitalize ml-1 hidden min-[480px]:inline truncate">
              {role} Dashboard
            </span>
            <div className="ml-auto flex items-center gap-0.5 sm:gap-1 shrink-0">
              <NotificationBell />
              <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme" className="h-8 w-8 sm:h-10 sm:w-10">
                {theme === "midnight" ? <Sparkles className="h-4 w-4" /> : theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </header>
          <main className="flex-1 p-3 sm:p-6 pb-24 md:pb-6 bg-background overflow-auto scrollbar-thin">
            {children}
          </main>
        </div>
        <MobileTabBar />
        {role === "student" && <AIChatWidget />}
      </div>
    </SidebarProvider>
  );
}
