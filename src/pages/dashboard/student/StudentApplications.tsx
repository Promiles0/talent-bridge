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
import { Briefcase, Circle, CheckCircle2, Clock, XCircle, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { StaggerContainer, StaggerItem } from "@/components/StaggerContainer";
import { ReviewDialog } from "@/components/ReviewDialog";

const statusConfig: Record<string, { color: string; icon: any; pulse?: boolean }> = {
  applied: { color: "bg-muted text-muted-foreground", icon: Clock, pulse: true },
  shortlisted: { color: "bg-primary/10 text-primary", icon: CheckCircle2 },
  interview: { color: "bg-secondary/10 text-secondary", icon: Circle },
  offered: { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: Award },
  rejected: { color: "bg-destructive/10 text-destructive", icon: XCircle },
  withdrawn: { color: "bg-muted text-muted-foreground", icon: XCircle },
};

const filterTabs = ["all", "applied", "shortlisted", "interview", "offered", "rejected", "withdrawn"];

export default function StudentApplications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [withdrawId, setWithdrawId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [reviewFor, setReviewFor] = useState<{ appId: string; ownerId: string; title: string } | null>(null);

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
        .select("*, internships(title, location, work_type, companies(name, owner_id))")
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

  const filtered = activeFilter === "all" ? applications : applications?.filter((a: any) => a.status === activeFilter);

  return (
    <DashboardLayout sidebar={<StudentSidebar />} requiredRole="student">
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">My Applications</h1>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
          {filterTabs.map((tab) => (
            <motion.button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              whileTap={{ scale: 0.95 }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap transition-colors snap-center ${
                activeFilter === tab
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {tab}
              {tab !== "all" && applications?.filter((a: any) => a.status === tab).length
                ? ` (${applications.filter((a: any) => a.status === tab).length})`
                : ""}
            </motion.button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : !filtered?.length ? (
          <Card><CardContent className="py-12 text-center">
            <Briefcase className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-muted-foreground mb-3">
              {activeFilter === "all" ? "No applications yet. Browse internships to get started!" : `No ${activeFilter} applications.`}
            </p>
            {activeFilter === "all" && <Button asChild size="sm"><Link to="/internships">Browse Internships</Link></Button>}
          </CardContent></Card>
        ) : (
          <StaggerContainer className="relative">
            {/* Timeline line */}
            <div className="absolute left-[19px] top-4 bottom-4 w-px bg-border hidden md:block" />

            <div className="space-y-3">
              {filtered.map((app: any) => {
                const config = statusConfig[app.status] || statusConfig.applied;
                const StatusIcon = config.icon;
                return (
                  <StaggerItem key={app.id}>
                    <Card className="glass-card-themed hover:shadow-md transition-shadow">
                      <CardContent className="py-4 flex items-center gap-4">
                        {/* Timeline dot */}
                        <div className="hidden md:flex flex-col items-center shrink-0">
                          <div className="relative">
                            {config.pulse && (
                              <motion.div
                                className="absolute inset-0 rounded-full bg-primary/30"
                                animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              />
                            )}
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${config.color}`}>
                              <StatusIcon className="h-4 w-4" />
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
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
                          {app.status === "offered" && app.internships?.companies?.owner_id && (
                            <Button variant="outline" size="sm" className="text-xs" onClick={() => setReviewFor({
                              appId: app.id,
                              ownerId: app.internships.companies.owner_id,
                              title: app.internships?.companies?.name ?? "this employer",
                            })}>
                              <Award className="h-3 w-3 mr-1" /> Review
                            </Button>
                          )}
                          <Badge className={config.color}>{app.status}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                );
              })}
            </div>
          </StaggerContainer>
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

      {reviewFor && (
        <ReviewDialog
          open={!!reviewFor}
          onOpenChange={(o) => !o && setReviewFor(null)}
          applicationId={reviewFor.appId}
          subjectId={reviewFor.ownerId}
          subjectRole="employer"
          subjectName={reviewFor.title}
        />
      )}
    </DashboardLayout>
  );
}
