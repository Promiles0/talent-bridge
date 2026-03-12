import { DashboardLayout } from "@/components/DashboardLayout";
import { EmployerSidebar } from "@/components/EmployerSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { MessageSquare, Send, User, ChevronDown, Download } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { SkillTag } from "@/components/SkillTag";

export default function EmployerApplications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [msgDialog, setMsgDialog] = useState<{ open: boolean; studentUserId: string; studentName: string }>({ open: false, studentUserId: "", studentName: "" });
  const [msgContent, setMsgContent] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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
        .select("*, internships!inner(title, company_id), students(id, headline, university, user_id, bio, cv_url, student_skills(skills(name)))")
        .eq("internships.company_id", company!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!company,
  });

  // Fetch profile names for students
  const studentUserIds = [...new Set((applications ?? []).map((a: any) => a.students?.user_id).filter(Boolean))];
  const { data: profiles } = useQuery({
    queryKey: ["profiles-for-apps", studentUserIds],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name").in("id", studentUserIds);
      return Object.fromEntries((data ?? []).map((p) => [p.id, p.full_name]));
    },
    enabled: studentUserIds.length > 0,
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

  const sendMessage = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("messages").insert({
        sender_id: user!.id,
        receiver_id: msgDialog.studentUserId,
        content: msgContent,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`Message sent to ${msgDialog.studentName}`);
      setMsgContent("");
      setMsgDialog({ open: false, studentUserId: "", studentName: "" });
      queryClient.invalidateQueries({ queryKey: ["employer-messages"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleExpand = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

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
            {applications.map((app: any) => {
              const studentName = profiles?.[app.students?.user_id] || app.students?.headline || "Student";
              const skills = app.students?.student_skills?.map((ss: any) => ss.skills?.name).filter(Boolean) ?? [];

              return (
                <Collapsible key={app.id} open={expanded[app.id]} onOpenChange={() => toggleExpand(app.id)}>
                  <Card>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{studentName}</p>
                            {app.students?.id && (
                              <Button asChild variant="ghost" size="sm" className="h-6 px-2">
                                <Link to={`/students/${app.students.id}`}>
                                  <User className="h-3 w-3 mr-1" /> View Profile
                                </Link>
                              </Button>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {app.students?.university} · Applied for {app.internships?.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(app.created_at), "MMM d, yyyy")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <ChevronDown className={`h-4 w-4 transition-transform ${expanded[app.id] ? "rotate-180" : ""}`} />
                            </Button>
                          </CollapsibleTrigger>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setMsgDialog({
                                open: true,
                                studentUserId: app.students?.user_id ?? "",
                                studentName,
                              })
                            }
                          >
                            <MessageSquare className="h-4 w-4 mr-1" /> Message
                          </Button>
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
                      </div>

                      <CollapsibleContent className="mt-4 space-y-3 border-t border-border pt-4">
                        {app.cover_letter && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Cover Letter</p>
                            <p className="text-sm bg-muted/50 p-3 rounded-lg">{app.cover_letter}</p>
                          </div>
                        )}
                        {app.students?.bio && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">About</p>
                            <p className="text-sm">{app.students.bio}</p>
                          </div>
                        )}
                        {skills.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Skills</p>
                            <div className="flex flex-wrap gap-1.5">
                              {skills.map((s: string) => (
                                <SkillTag key={s} label={s} />
                              ))}
                            </div>
                          </div>
                        )}
                        {app.students?.cv_url && (
                          <Button asChild variant="outline" size="sm">
                            <a href={app.students.cv_url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-3 w-3 mr-1" /> Download CV
                            </a>
                          </Button>
                        )}
                      </CollapsibleContent>
                    </CardContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={msgDialog.open} onOpenChange={(o) => setMsgDialog({ ...msgDialog, open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message {msgDialog.studentName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={msgContent}
              onChange={(e) => setMsgContent(e.target.value)}
              placeholder="Write your message..."
              rows={4}
            />
            <Button
              onClick={() => sendMessage.mutate()}
              disabled={!msgContent.trim() || sendMessage.isPending}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-1" />
              {sendMessage.isPending ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
