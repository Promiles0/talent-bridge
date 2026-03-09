import { DashboardLayout } from "@/components/DashboardLayout";
import { StudentSidebar } from "@/components/StudentSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  applied: "bg-muted text-muted-foreground",
  shortlisted: "bg-primary/10 text-primary",
  interview: "bg-secondary/10 text-secondary",
  offered: "bg-green-100 text-green-700",
  rejected: "bg-destructive/10 text-destructive",
  withdrawn: "bg-muted text-muted-foreground",
};

export default function StudentApplications() {
  const { user } = useAuth();

  const { data: student } = useQuery({
    queryKey: ["student-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: applications, isLoading } = useQuery({
    queryKey: ["student-applications-full", student?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("applications")
        .select("*, internships(title, location, work_type, companies(name))")
        .eq("student_id", student!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!student,
  });

  return (
    <DashboardLayout sidebar={<StudentSidebar />} requiredRole="student">
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">My Applications</h1>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : !applications?.length ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No applications yet. Browse internships to get started!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {applications.map((app: any) => (
              <Card key={app.id}>
                <CardContent className="py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{app.internships?.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {app.internships?.companies?.name} · {app.internships?.location} · {app.internships?.work_type}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Applied {format(new Date(app.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  <Badge className={statusColors[app.status] ?? "bg-muted"}>
                    {app.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
