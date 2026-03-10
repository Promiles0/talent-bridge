import { DashboardLayout } from "@/components/DashboardLayout";
import { EmployerSidebar } from "@/components/EmployerSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Building2, Briefcase, Users, Eye } from "lucide-react";

export default function EmployerOverview() {
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
      const { data } = await supabase.from("internships").select("*").eq("company_id", company!.id);
      return data ?? [];
    },
    enabled: !!company,
  });

  const { data: applications } = useQuery({
    queryKey: ["employer-applications", company?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("applications")
        .select("*, internships!inner(company_id)")
        .eq("internships.company_id", company!.id)
        .order("created_at", { ascending: false })
        .limit(10);
      return data ?? [];
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

  return (
    <DashboardLayout sidebar={<EmployerSidebar />} requiredRole="employer">
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            Welcome, {profile?.full_name || "Employer"}!
          </h1>
          <p className="text-muted-foreground text-sm">
            {company ? `Managing ${company.name}` : "Set up your company profile to get started."}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <s.icon className={`h-8 w-8 ${s.color}`} />
                  <div>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader><CardTitle className="text-lg">Recent Applications</CardTitle></CardHeader>
          <CardContent>
            {!applications?.length ? (
              <div className="py-6 text-center">
                <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No applications received yet. Post an internship to attract talent!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((app: any) => (
                  <div key={app.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                    <div>
                      <p className="text-sm font-medium">Application #{app.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground capitalize">{app.status}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-muted capitalize">{app.status}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
