import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AdminSidebar } from "@/components/AdminSidebar";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, History, Search } from "lucide-react";

interface AuditRow {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: any;
  created_at: string;
}

const PAGE_SIZE = 50;

export default function AdminAudit() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [actorFilter, setActorFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    let q = supabase.from("audit_log")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (actorFilter) q = q.ilike("actor_id", `%${actorFilter}%`);
    if (actionFilter) q = q.ilike("action", `%${actionFilter}%`);
    const { data } = await q;
    setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, actorFilter, actionFilter]);

  const exportCsv = () => {
    const header = "id,actor_id,action,target_type,target_id,created_at\n";
    const body = rows.map(r => [r.id, r.actor_id, r.action, r.target_type, r.target_id, r.created_at].map(v => JSON.stringify(v ?? "")).join(",")).join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `audit-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout sidebar={<AdminSidebar />} requiredRole="admin">
      <div className="space-y-6 pb-20 animate-slide-up">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <History className="h-7 w-7 text-primary" /> Audit Log
            </h1>
            <p className="text-muted-foreground text-sm">Sensitive admin and user actions across the platform.</p>
          </div>
          <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
        </div>

        <Card className="p-4">
          <div className="flex gap-2 flex-wrap">
            <div className="flex-1 min-w-[180px] flex gap-2 items-center">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="Filter by actor id" value={actorFilter} onChange={(e) => { setActorFilter(e.target.value); setPage(0); }} />
            </div>
            <Input className="max-w-[240px]" placeholder="Filter by action" value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(0); }} />
          </div>
        </Card>

        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase">
              <tr>
                <th className="text-left p-3">When</th>
                <th className="text-left p-3">Actor</th>
                <th className="text-left p-3">Action</th>
                <th className="text-left p-3">Target</th>
                <th className="text-left p-3">Metadata</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No audit entries.</td></tr>
              ) : rows.map(r => (
                <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                  <td className="p-3 whitespace-nowrap text-xs">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-3 font-mono text-xs">{r.actor_id?.slice(0, 8) ?? "—"}</td>
                  <td className="p-3"><Badge variant="outline">{r.action}</Badge></td>
                  <td className="p-3 text-xs">{r.target_type}<br /><span className="font-mono text-muted-foreground">{r.target_id?.slice(0, 8)}</span></td>
                  <td className="p-3 text-xs max-w-xs truncate" title={JSON.stringify(r.metadata)}>{r.metadata ? JSON.stringify(r.metadata).slice(0, 80) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>Previous</Button>
          <span className="text-sm text-muted-foreground self-center">Page {page + 1}</span>
          <Button variant="outline" disabled={rows.length < PAGE_SIZE} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
