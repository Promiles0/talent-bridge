import { DashboardLayout } from "@/components/DashboardLayout";
import { StudentSidebar } from "@/components/StudentSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, FolderKanban, Eye, CheckCircle } from "lucide-react";

export default function StudentOverview() {
  const { user } = useAuth();

  const { data: student } = useQuery({
    queryKey: ["student-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("students")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: applications } = useQuery({
    queryKey: ["student-applications", student?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("applications")
        .select("*, internships(title, companies(name))")
        .eq("student_id", student!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
    enabled: !!student,
  });

  const { data: projects } = useQuery({
    queryKey: ["student-projects", student?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("student_id", student!.id);
      return data ?? [];
    },
    enabled: !!student,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const stats = [
    { label: "Applications", value: applications?.length ?? 0, icon: Briefcase, color: "text-primary" },
    { label: "Projects", value: projects?.length ?? 0, icon: FolderKanban, color: "text-secondary" },
    { label: "Profile Views", value: 0, icon: Eye, color: "text-primary" },
    { label: "Shortlisted", value: applications?.filter(a => a.status === "shortlisted").length ?? 0, icon: CheckCircle, color: "text-secondary" },
  ];

  return (
    <DashboardLayout sidebar={<StudentSidebar />} requiredRole="student">
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            Welcome back, {profile?.full_name || "Student"}!
          </h1>
          <p className="text-muted-foreground text-sm">Here's your activity summary.</p>
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
          <CardHeader>
            <CardTitle className="text-lg">Recent Applications</CardTitle>
          </CardHeader>
          <CardContent>
            {!applications?.length ? (
              <div className="py-6 text-center">
                <Briefcase className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No applications yet. Start exploring internships!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((app: any) => (
                  <div key={app.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{app.internships?.title}</p>
                      <p className="text-xs text-muted-foreground">{app.internships?.companies?.name}</p>
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
