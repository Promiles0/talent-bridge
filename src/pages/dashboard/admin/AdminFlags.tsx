import { DashboardLayout } from "@/components/DashboardLayout";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { CheckCircle, Flag, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { StaggerContainer, StaggerItem } from "@/components/StaggerContainer";

export default function AdminFlags() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("open");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: flags, isLoading } = useQuery({
    queryKey: ["admin-flags"],
    queryFn: async () => {
      const { data } = await supabase.from("flags").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    let list = flags ?? [];
    if (statusFilter === "open") list = list.filter((f) => !f.resolved);
    else if (statusFilter === "resolved") list = list.filter((f) => f.resolved);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter((f) => f.reason.toLowerCase().includes(q) || f.target_type.toLowerCase().includes(q));
    }
    return list;
  }, [flags, statusFilter, searchTerm]);

  const resolveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("flags").update({ resolved: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Flag resolved");
      queryClient.invalidateQueries({ queryKey: ["admin-flags"] });
      queryClient.invalidateQueries({ queryKey: ["admin-counts"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <DashboardLayout sidebar={<AdminSidebar />} requiredRole="admin">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Flag className="h-5 w-5 text-destructive" />
          <h1 className="font-heading text-2xl font-bold">Flags</h1>
          {flags && (
            <Badge variant="outline" className="ml-2">
              {flags.filter((f) => !f.resolved).length} open
            </Badge>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by reason..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : !filtered.length ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="glass-card-themed">
              <CardContent className="py-12 text-center">
                <Flag className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground">No flags to review.</p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <StaggerContainer className="space-y-3">
            {filtered.map((f) => (
              <StaggerItem key={f.id}>
                <Card className={`glass-card-themed hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 ${f.resolved ? "opacity-60" : ""}`}>
                  <CardContent className="py-4 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm capitalize">{f.target_type}: {f.target_id.slice(0, 8)}...</p>
                        <Badge className={f.resolved ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-destructive/10 text-destructive"}>
                          {f.resolved ? "Resolved" : "Open"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{f.reason}</p>
                      <p className="text-xs text-muted-foreground mt-1">{format(new Date(f.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
                    </div>
                    {!f.resolved && (
                      <Button size="sm" variant="outline" onClick={() => resolveMutation.mutate(f.id)} className="ml-4 shrink-0">
                        <CheckCircle className="h-4 w-4 mr-1" /> Resolve
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>
    </DashboardLayout>
  );
}
