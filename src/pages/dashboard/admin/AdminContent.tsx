import { DashboardLayout } from "@/components/DashboardLayout";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import { Search, FileText, Building2, MapPin, Eye, Pause, Play, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { StaggerContainer, StaggerItem } from "@/components/StaggerContainer";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  draft: "bg-muted text-muted-foreground",
  paused: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  closed: "bg-destructive/10 text-destructive",
};

export default function AdminContent() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: internships, isLoading } = useQuery({
    queryKey: ["admin-all-internships"],
    queryFn: async () => {
      const { data } = await supabase
        .from("internships")
        .select("*, companies(name, logo_url)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("internships").update({ status: status as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-internships"] });
      toast.success("Status updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteInternship = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("internships").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-internships"] });
      toast.success("Internship deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = internships?.filter((i: any) => {
    const matchSearch = !search || i.title.toLowerCase().includes(search.toLowerCase()) || i.companies?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <DashboardLayout sidebar={<AdminSidebar />} requiredRole="admin">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h1 className="font-heading text-2xl font-bold">Content Management</h1>
        </div>

        <Card className="glass-card-themed">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search internships or companies..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground">{filtered?.length ?? 0} internship{(filtered?.length ?? 0) !== 1 ? "s" : ""} found</p>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : !filtered?.length ? (
          <Card className="glass-card-themed">
            <CardContent className="py-12 text-center">
              <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              </motion.div>
              <p className="text-muted-foreground">No internships match your filters.</p>
            </CardContent>
          </Card>
        ) : (
          <StaggerContainer className="space-y-3">
            {filtered.map((intern: any) => (
              <StaggerItem key={intern.id}>
                <Card className="glass-card-themed hover:shadow-md transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{intern.title}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {intern.companies?.name} {intern.location ? `· ${intern.location}` : ""} · {intern.work_type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <Badge className={statusColors[intern.status] ?? "bg-muted"}>{intern.status}</Badge>
                        {intern.status !== "active" && (
                          <Button variant="outline" size="sm" onClick={() => updateStatus.mutate({ id: intern.id, status: "active" })} className="gap-1">
                            <Play className="h-3 w-3" /> Activate
                          </Button>
                        )}
                        {intern.status === "active" && (
                          <Button variant="outline" size="sm" onClick={() => updateStatus.mutate({ id: intern.id, status: "paused" })} className="gap-1">
                            <Pause className="h-3 w-3" /> Pause
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteInternship.mutate(intern.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
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
