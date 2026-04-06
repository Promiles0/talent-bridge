import { DashboardLayout } from "@/components/DashboardLayout";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Users, Briefcase, Building2, Flag, TrendingUp, Shield } from "lucide-react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { StaggerContainer, StaggerItem } from "@/components/StaggerContainer";

function AnimatedCounter({ value }: { value: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(count, value, { duration: 1, ease: "easeOut" });
    return controls.stop;
  }, [value, count]);

  useEffect(() => {
    return rounded.on("change", (v) => {
      if (ref.current) ref.current.textContent = String(v);
    });
  }, [rounded]);

  return <span ref={ref}>0</span>;
}

export default function AdminOverview() {
  const { data: counts, isLoading } = useQuery({
    queryKey: ["admin-counts"],
    queryFn: async () => {
      const [students, companies, internships, flags] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("companies").select("id", { count: "exact", head: true }),
        supabase.from("internships").select("id", { count: "exact", head: true }),
        supabase.from("flags").select("id", { count: "exact", head: true }).eq("resolved", false),
      ]);
      return {
        students: students.count ?? 0,
        companies: companies.count ?? 0,
        internships: internships.count ?? 0,
        flags: flags.count ?? 0,
      };
    },
  });

  const { data: recentApps } = useQuery({
    queryKey: ["admin-recent-apps"],
    queryFn: async () => {
      const { data } = await supabase
        .from("applications")
        .select("id, status, created_at, internships(title)")
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const { data: recentUsers } = useQuery({
    queryKey: ["admin-recent-users"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const stats = [
    { label: "Students", value: counts?.students ?? 0, icon: Users, color: "text-primary" },
    { label: "Companies", value: counts?.companies ?? 0, icon: Building2, color: "text-secondary" },
    { label: "Internships", value: counts?.internships ?? 0, icon: Briefcase, color: "text-primary" },
    { label: "Open Flags", value: counts?.flags ?? 0, icon: Flag, color: "text-destructive" },
  ];

  const statusColor: Record<string, string> = {
    applied: "bg-primary/10 text-primary",
    shortlisted: "bg-secondary/10 text-secondary",
    interview: "bg-primary/10 text-primary",
    offered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    rejected: "bg-destructive/10 text-destructive",
    withdrawn: "bg-muted text-muted-foreground",
  };

  return (
    <DashboardLayout sidebar={<AdminSidebar />} requiredRole="admin">
      <div className="space-y-6">
        {/* Welcome banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-gradient-to-r from-primary/10 via-secondary/5 to-transparent p-6 border border-primary/10"
        >
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="font-heading text-2xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Monitor platform health, manage users, and review flagged content.
          </p>
        </motion.div>

        {/* Stats */}
        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <StaggerItem key={i}>
                  <Card className="glass-card-themed">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-6 w-10" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))
            : stats.map((s) => (
                <StaggerItem key={s.label}>
                  <Card className="glass-card-themed hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <s.icon className={`h-8 w-8 ${s.color}`} />
                        <div>
                          <p className="text-2xl font-bold">
                            <AnimatedCounter value={s.value} />
                          </p>
                          <p className="text-xs text-muted-foreground">{s.label}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
        </StaggerContainer>

        {/* Activity Feed */}
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="glass-card-themed">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Recent Applications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!recentApps?.length ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No applications yet</p>
                ) : (
                  <div className="space-y-3">
                    {recentApps.map((app: any) => (
                      <div key={app.id} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{app.internships?.title || "Internship"}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(app.created_at), "MMM d, h:mm a")}</p>
                        </div>
                        <Badge className={statusColor[app.status] ?? "bg-muted"}>{app.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="glass-card-themed">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> Recent Signups
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!recentUsers?.length ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No users yet</p>
                ) : (
                  <div className="space-y-3">
                    {recentUsers.map((u: any) => (
                      <div key={u.id} className="flex items-center gap-3 border-b border-border/50 pb-3 last:border-0 last:pb-0">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {u.full_name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{u.full_name || "Unnamed"}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(u.created_at), "MMM d, yyyy")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
