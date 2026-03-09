import { DashboardLayout } from "@/components/DashboardLayout";
import { EmployerSidebar } from "@/components/EmployerSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";

export default function EmployerApplications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: company } = useQuery({
    queryKey: ["company", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("companies").select("id").eq("owner_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: applications, isLoading } = useQuery({
    queryKey: ["employer-applications-full", company?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("applications")
        .select("*, internships!inner(title, company_id), students(headline, university, user_id, profiles:students_user_id_fkey(full_name))")
        .eq("internships.company_id", company!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!company,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("applications").update({ status: status as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["employer-applications-full"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <DashboardLayout sidebar={<EmployerSidebar />} requiredRole="employer">
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">Applications</h1>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : !applications?.length ? (
          <Card><CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No applications received yet.</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {applications.map((app: any) => (
              <Card key={app.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{app.students?.headline || "Student"}</p>
                      <p className="text-sm text-muted-foreground">
                        {app.students?.university} · Applied for {app.internships?.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(app.created_at), "MMM d, yyyy")}
                      </p>
                      {app.cover_letter && (
                        <p className="text-sm mt-2 bg-muted/50 p-2 rounded">{app.cover_letter}</p>
                      )}
                    </div>
                    <Select
                      value={app.status}
                      onValueChange={(v) => updateStatus.mutate({ id: app.id, status: v })}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="applied">Applied</SelectItem>
                        <SelectItem value="shortlisted">Shortlisted</SelectItem>
                        <SelectItem value="interview">Interview</SelectItem>
                        <SelectItem value="offered">Offered</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
