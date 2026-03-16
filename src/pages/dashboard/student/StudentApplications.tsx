import { DashboardLayout } from "@/components/DashboardLayout";
import { StudentSidebar } from "@/components/StudentSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";
import { Briefcase } from "lucide-react";
import { Link } from "react-router-dom";

const statusColors: Record<string, string> = {
  applied: "bg-muted text-muted-foreground",
  shortlisted: "bg-primary/10 text-primary",
  interview: "bg-secondary/10 text-secondary",
  offered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-destructive/10 text-destructive",
  withdrawn: "bg-muted text-muted-foreground",
};

export default function StudentApplications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [withdrawId, setWithdrawId] = useState<string | null>(null);

  const { data: student } = useQuery({
    queryKey: ["student-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("students").select("id").eq("user_id", user!.id).maybeSingle();
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

  const withdrawMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("applications").update({ status: "withdrawn" as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Application withdrawn");
      setWithdrawId(null);
      queryClient.invalidateQueries({ queryKey: ["student-applications-full"] });
    },
    onError: (err: any) => toast.error(err.message),
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
          <Card><CardContent className="py-12 text-center">
            <Briefcase className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-muted-foreground mb-3">No applications yet. Browse internships to get started!</p>
            <Button asChild size="sm"><Link to="/internships">Browse Internships</Link></Button>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {applications.map((app: any) => (
              <Card key={app.id}>
                <CardContent className="py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium">{app.internships?.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {app.internships?.companies?.name} · {app.internships?.location} · {app.internships?.work_type}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Applied {format(new Date(app.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {app.status === "applied" && (
                      <Button variant="ghost" size="sm" className="text-destructive text-xs" onClick={() => setWithdrawId(app.id)}>
                        Withdraw
                      </Button>
                    )}
                    <Badge className={statusColors[app.status] ?? "bg-muted"}>{app.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!withdrawId} onOpenChange={() => setWithdrawId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Withdraw Application?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to withdraw this application? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => withdrawId && withdrawMutation.mutate(withdrawId)} disabled={withdrawMutation.isPending}>
              {withdrawMutation.isPending ? "Withdrawing..." : "Withdraw"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
