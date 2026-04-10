import { DashboardLayout } from "@/components/DashboardLayout";
import { EmployerSidebar } from "@/components/EmployerSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Eye, Users, CheckCircle, Award, Briefcase } from "lucide-react";
import { motion } from "framer-motion";
import { StaggerContainer, StaggerItem } from "@/components/StaggerContainer";

export default function EmployerAnalytics() {
  const { user } = useAuth();

  const { data: company } = useQuery({
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
    queryKey: ["employer-all-applications", company?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("applications")
        .select("id, status, internship_id, internships!inner(title, company_id)")
        .eq("internships.company_id", company!.id);
      return data ?? [];
    },
    enabled: !!company,
  });

  const totalInternships = internships?.length ?? 0;
  const activeListings = internships?.filter(i => i.status === "active").length ?? 0;
  const totalApplications = applications?.length ?? 0;
  const shortlisted = applications?.filter((a: any) => a.status === "shortlisted").length ?? 0;
  const interviews = applications?.filter((a: any) => a.status === "interview").length ?? 0;
  const offered = applications?.filter((a: any) => a.status === "offered").length ?? 0;

  // Per-internship stats
  const internshipStats = internships?.map(i => {
    const apps = applications?.filter((a: any) => a.internship_id === i.id) ?? [];
    return {
      title: i.title,
      status: i.status,
      applications: apps.length,
      shortlisted: apps.filter((a: any) => a.status === "shortlisted").length,
      offered: apps.filter((a: any) => a.status === "offered").length,
    };
  }).sort((a, b) => b.applications - a.applications) ?? [];

  // Funnel
  const funnel = [
    { label: "Applications", value: totalApplications, icon: Users, color: "bg-primary" },
    { label: "Shortlisted", value: shortlisted, icon: CheckCircle, color: "bg-secondary" },
    { label: "Interviews", value: interviews, icon: Eye, color: "bg-primary" },
    { label: "Offers", value: offered, icon: Award, color: "bg-green-500" },
  ];

  const maxFunnel = Math.max(...funnel.map(f => f.value), 1);

  return (
    <DashboardLayout sidebar={<EmployerSidebar />} requiredRole="employer">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h1 className="font-heading text-2xl font-bold">Analytics</h1>
        </div>

        {/* Overview Stats */}
        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Listings", value: totalInternships, icon: Briefcase },
            { label: "Active Listings", value: activeListings, icon: TrendingUp },
            { label: "Total Applications", value: totalApplications, icon: Users },
            { label: "Offers Made", value: offered, icon: Award },
          ].map((s) => (
            <StaggerItem key={s.label}>
              <Card className="glass-card-themed">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <s.icon className="h-7 w-7 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Conversion Funnel */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="glass-card-themed">
            <CardHeader><CardTitle className="text-lg">Conversion Funnel</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {funnel.map((step, i) => (
                <div key={step.label} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <step.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{step.label}</span>
                    </div>
                    <span className="text-sm font-bold">{step.value}</span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(step.value / maxFunnel) * 100}%` }}
                      transition={{ duration: 0.8, delay: i * 0.15 }}
                      className={`h-full rounded-full ${step.color}`}
                    />
                  </div>
                  {i < funnel.length - 1 && step.value > 0 && (
                    <p className="text-[10px] text-muted-foreground ml-6">
                      → {Math.round((funnel[i + 1].value / step.value) * 100)}% conversion
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Per-listing Performance */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="glass-card-themed">
            <CardHeader><CardTitle className="text-lg">Listing Performance</CardTitle></CardHeader>
            <CardContent>
              {!internshipStats.length ? (
                <p className="text-sm text-muted-foreground text-center py-6">No listings yet</p>
              ) : (
                <div className="space-y-3">
                  {internshipStats.slice(0, 10).map((stat, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{stat.title}</p>
                        <p className="text-xs text-muted-foreground">{stat.applications} apps · {stat.shortlisted} shortlisted · {stat.offered} offers</p>
                      </div>
                      <div className="h-2 w-24 rounded-full bg-muted overflow-hidden shrink-0 ml-3">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.min((stat.applications / (internshipStats[0]?.applications || 1)) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
