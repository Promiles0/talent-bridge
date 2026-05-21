import { DashboardLayout } from "@/components/DashboardLayout";
import { StudentSidebar } from "@/components/StudentSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarClock, Check, X, ExternalLink, MapPin } from "lucide-react";

export default function StudentInterviews() {
  const qc = useQueryClient();

  const { data: slots, isLoading } = useQuery({
    queryKey: ["student-interviews"],
    queryFn: async () => {
      const { data } = await supabase
        .from("interview_slots")
        .select("*, applications(id, internships(title, companies(name)))")
        .order("start_at", { ascending: true });
      return data ?? [];
    },
  });

  // Group by application
  const groups = (slots ?? []).reduce<Record<string, any[]>>((acc, s: any) => {
    const key = s.application_id;
    (acc[key] ||= []).push(s);
    return acc;
  }, {});

  const respond = useMutation({
    mutationFn: async ({ slotId, accept, otherIds }: { slotId: string; accept: boolean; otherIds: string[] }) => {
      const { error } = await supabase.from("interview_slots")
        .update({ status: accept ? "accepted" : "declined", student_response: accept ? "accepted" : "declined" })
        .eq("id", slotId);
      if (error) throw error;
      if (accept && otherIds.length) {
        await supabase.from("interview_slots").update({ status: "declined", student_response: "declined" }).in("id", otherIds);
      }
    },
    onSuccess: () => { toast.success("Response sent"); qc.invalidateQueries({ queryKey: ["student-interviews"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <DashboardLayout sidebar={<StudentSidebar />} requiredRole="student">
      <div className="space-y-6 pb-20 md:pb-0">
        <h1 className="font-heading text-2xl font-bold">Interviews</h1>

        {isLoading ? (
          <div className="flex items-center justify-center h-40"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
        ) : !Object.keys(groups).length ? (
          <Card><CardContent className="py-12 text-center">
            <CalendarClock className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-muted-foreground">No interview proposals yet.</p>
          </CardContent></Card>
        ) : (
          Object.entries(groups).map(([appId, items]) => {
            const meta = (items[0] as any).applications;
            const accepted = items.find((s: any) => s.status === "accepted");
            return (
              <Card key={appId} className="glass-card-themed">
                <CardContent className="py-5 space-y-3">
                  <div>
                    <p className="font-medium">{meta?.internships?.title}</p>
                    <p className="text-sm text-muted-foreground">{meta?.internships?.companies?.name}</p>
                  </div>
                  <div className="space-y-2">
                    {items.map((s: any) => {
                      const isAccepted = s.status === "accepted";
                      const isDeclined = s.status === "declined";
                      return (
                        <div key={s.id} className={`flex items-center justify-between gap-3 p-3 rounded-lg border ${isAccepted ? "border-primary bg-primary/5" : "border-border"}`}>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{format(new Date(s.start_at), "EEE MMM d, p")} – {format(new Date(s.end_at), "p")}</p>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                              {s.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{s.location}</span>}
                              {s.meeting_url && <a className="inline-flex items-center gap-1 text-primary hover:underline" href={s.meeting_url} target="_blank" rel="noreferrer"><ExternalLink className="h-3 w-3" /> Meeting link</a>}
                            </div>
                            {s.notes && <p className="text-xs text-muted-foreground mt-1">{s.notes}</p>}
                          </div>
                          <div className="shrink-0">
                            {isAccepted ? (
                              <Badge className="bg-primary text-primary-foreground">Confirmed</Badge>
                            ) : isDeclined ? (
                              <Badge variant="outline">Declined</Badge>
                            ) : accepted ? (
                              <Badge variant="outline">—</Badge>
                            ) : (
                              <div className="flex gap-1">
                                <Button size="sm" onClick={() => respond.mutate({ slotId: s.id, accept: true, otherIds: items.filter((o: any) => o.id !== s.id).map((o: any) => o.id) })}>
                                  <Check className="h-3 w-3 mr-1" /> Pick
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => respond.mutate({ slotId: s.id, accept: false, otherIds: [] })}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
}
