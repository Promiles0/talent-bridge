import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
  requiredRole?: "student" | "employer" | "admin";
}

export function DashboardLayout({ children, sidebar, requiredRole }: DashboardLayoutProps) {
  const { user, role, loading } = useAuth();

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
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b border-border bg-card px-4 gap-2">
            <SidebarTrigger />
            <span className="font-heading text-sm font-semibold text-muted-foreground capitalize">
              {role} Dashboard
            </span>
          </header>
          <main className="flex-1 p-6 bg-background overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
