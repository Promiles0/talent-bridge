import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function AuthCallback() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [waited, setWaited] = useState(false);

  // Give auth state a moment to settle after the redirect
  useEffect(() => {
    const t = setTimeout(() => setWaited(true), 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (loading || !waited) return;

    if (!user) {
      // No session found — token may have expired
      toast.error("Email link is invalid or has expired. Please try again.");
      navigate("/login", { replace: true });
      return;
    }

    if (!role) return; // Still loading role

    const dashboardPath =
      role === "admin"
        ? "/dashboard/admin"
        : role === "employer"
        ? "/dashboard/employer"
        : "/dashboard/student";

    toast.success(`Welcome to TalentBridge! Your email has been confirmed.`);
    navigate(dashboardPath, { replace: true });
  }, [user, role, loading, waited, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground animate-pulse">
          Confirming your account…
        </p>
      </div>
    </div>
  );
}
