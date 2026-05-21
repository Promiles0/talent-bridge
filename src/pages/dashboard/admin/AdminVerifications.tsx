import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AdminSidebar } from "@/components/AdminSidebar";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ShieldCheck, Check, X, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { fireConfetti } from "@/lib/confetti";

type Row = {
  id: string;
  user_id: string;
  kind: "student" | "company";
  method: string;
  status: "pending" | "approved" | "rejected";
  evidence_data: any;
  notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
};

export default function AdminVerifications() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("verifications")
      .select("*")
      .eq("status", tab)
      .order("created_at", { ascending: false });
    const ids = Array.from(new Set((data ?? []).map((r: any) => r.user_id)));
    let profilesById: Record<string, any> = {};
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", ids);
      profilesById = Object.fromEntries((profs ?? []).map((p: any) => [p.id, p]));
    }
    setRows(((data ?? []) as any[]).map((r) => ({ ...r, profiles: profilesById[r.user_id] ?? null })));
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tab]);

  const decide = async (id: string, status: "approved" | "rejected") => {
    setBusyId(id);
    const notes = noteDrafts[id] ?? (status === "approved" ? "Approved by admin" : "");
    const { error } = await supabase
      .from("verifications")
      .update({ status, notes, reviewer_id: user?.id })
      .eq("id", id);
    setBusyId(null);
    if (error) { toast.error(error.message); return; }
    if (status === "approved") fireConfetti({ count: 100 });
    toast.success(`Verification ${status}`);
    await load();
  };

  return (
    <DashboardLayout sidebar={<AdminSidebar />} requiredRole="admin">
      <div className="space-y-6 pb-20 animate-slide-up max-w-5xl">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-primary" /> Verifications Queue
          </h1>
          <p className="text-muted-foreground text-sm">Review identity submissions from students and employers.</p>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : rows.length === 0 ? (
              <Card className="p-10 text-center text-muted-foreground text-sm">No {tab} submissions.</Card>
            ) : (
              rows.map((r) => (
                <Card key={r.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{r.profiles?.full_name ?? "Unknown user"}</span>
                        <Badge variant="outline">{r.kind}</Badge>
                        <Badge variant="secondary">{r.method}</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                      </div>
                      <pre className="text-xs bg-muted/50 p-2 rounded max-w-2xl whitespace-pre-wrap break-all">
{JSON.stringify(r.evidence_data ?? {}, null, 2)}
                      </pre>
                      {r.notes && <p className="text-xs italic text-muted-foreground">Note: {r.notes}</p>}
                    </div>
                  </div>
                  {tab === "pending" && (
                    <div className="mt-3 space-y-2">
                      <Textarea rows={2} placeholder="Optional note (sent to user on reject)"
                        value={noteDrafts[r.id] ?? ""}
                        onChange={(e) => setNoteDrafts({ ...noteDrafts, [r.id]: e.target.value })} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => decide(r.id, "approved")} disabled={busyId === r.id}>
                          <Check className="h-3 w-3 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => decide(r.id, "rejected")} disabled={busyId === r.id}>
                          <X className="h-3 w-3 mr-1" /> Reject
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
