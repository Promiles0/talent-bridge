import { DashboardLayout } from "@/components/DashboardLayout";
import { EmployerSidebar } from "@/components/EmployerSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { MessageSquare, Send } from "lucide-react";
import { useState } from "react";

export default function EmployerApplications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [msgDialog, setMsgDialog] = useState<{ open: boolean; studentUserId: string; studentName: string }>({ open: false, studentUserId: "", studentName: "" });
  const [msgContent, setMsgContent] = useState("");

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
        .select("*, internships!inner(title, company_id), students(headline, university, user_id)")
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
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
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
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setMsgDialog({
                            open: true,
                            studentUserId: app.students?.user_id ?? "",
                            studentName: app.students?.headline || "Student",
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Message Dialog */}
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
