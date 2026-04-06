import { DashboardLayout } from "@/components/DashboardLayout";
import { EmployerSidebar } from "@/components/EmployerSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Building2, Briefcase, Users, Eye, Plus, Search, MessageSquare } from "lucide-react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { format } from "date-fns";
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

const quickActions = [
  { label: "Post Internship", icon: Plus, href: "/dashboard/employer/internships" },
  { label: "View Applicants", icon: Users, href: "/dashboard/employer/applications" },
  { label: "Search Students", icon: Search, href: "/students" },
  { label: "Messages", icon: MessageSquare, href: "/dashboard/employer/messages" },
];

export default function EmployerOverview() {
  const { user } = useAuth();

  const { data: company, isLoading: loadingCompany } = useQuery({
    queryKey: ["company", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("companies").select("*").eq("owner_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: internships } = useQuery({
    queryKey: ["employer-internships", company?.id],
    queryFn: async () => {
      const { data } = await supabase.from("internships").select("*").eq("company_id", company!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!company,
  });

  const { data: applications } = useQuery({
    queryKey: ["employer-applications-overview", company?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("applications")
        .select("id, status, created_at, student_id, internships!inner(title, company_id)")
        .eq("internships.company_id", company!.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (!data?.length) return [];

      // Fetch student profiles for names
      const studentIds = [...new Set(data.map((a: any) => a.student_id))];
      const { data: students } = await supabase
        .from("students")
        .select("id, user_id")
        .in("id", studentIds);
      
      const userIds = students?.map((s) => s.user_id) ?? [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      return data.map((app: any) => {
        const student = students?.find((s) => s.id === app.student_id);
        const profile = profiles?.find((p) => p.id === student?.user_id);
        return { ...app, studentName: profile?.full_name || "Student" };
      });
    },
    enabled: !!company,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const stats = [
    { label: "Company", value: company ? 1 : 0, icon: Building2, color: "text-primary" },
    { label: "Internships", value: internships?.length ?? 0, icon: Briefcase, color: "text-secondary" },
    { label: "Applications", value: applications?.length ?? 0, icon: Users, color: "text-primary" },
    { label: "Active Listings", value: internships?.filter(i => i.status === "active").length ?? 0, icon: Eye, color: "text-secondary" },
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
    <DashboardLayout sidebar={<EmployerSidebar />} requiredRole="employer">
      <div className="space-y-6">
        {/* Welcome banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-gradient-to-r from-primary/10 via-secondary/5 to-transparent p-6 border border-primary/10"
        >
          <h1 className="font-heading text-2xl font-bold">
            Hello, {company?.name || profile?.full_name || "Employer"} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {company ? "Manage your talent pipeline and internship listings." : "Set up your company profile to get started."}
          </p>
        </motion.div>

        {/* Stats */}
        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loadingCompany ? (
            Array.from({ length: 4 }).map((_, i) => (
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
          ) : (
            stats.map((s) => (
              <StaggerItem key={s.label}>
                <Card className="glass-card-themed hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <s.icon className={`h-8 w-8 ${s.color}`} />
                      <div>
                        <p className="text-2xl font-bold"><AnimatedCounter value={s.value} /></p>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))
          )}
        </StaggerContainer>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          {quickActions.map((a) => (
            <Button key={a.label} asChild variant="outline" size="sm" className="gap-2">
              <Link to={a.href}>
                <a.icon className="h-4 w-4" /> {a.label}
              </Link>
            </Button>
          ))}
        </div>

        {/* Recent Applications — with names */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="glass-card-themed">
            <CardHeader><CardTitle className="text-lg">Recent Applications</CardTitle></CardHeader>
            <CardContent>
              {!applications?.length ? (
                <div className="py-6 text-center">
                  <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">No applications received yet.</p>
                  <Button asChild size="sm"><Link to="/dashboard/employer/internships">Post an Internship</Link></Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.map((app: any) => (
                    <div key={app.id} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{app.studentName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          Applied to {app.internships?.title} · {format(new Date(app.created_at), "MMM d")}
                        </p>
                      </div>
                      <Badge className={statusColor[app.status] ?? "bg-muted"}>{app.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Internships */}
        {internships && internships.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="glass-card-themed">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Your Listings</CardTitle>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/dashboard/employer/internships">View All</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {internships.slice(0, 3).map((i) => (
                    <div key={i.id} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{i.title}</p>
                        <p className="text-xs text-muted-foreground">{i.work_type} · {i.location || "No location"}</p>
                      </div>
                      <Badge className={i.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground"}>
                        {i.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
