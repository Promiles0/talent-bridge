import { DashboardLayout } from "@/components/DashboardLayout";
import { EmployerSidebar } from "@/components/EmployerSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import { Plus, Trash2, MapPin, Pencil, Users, Briefcase, Sparkles, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { StaggerContainer, StaggerItem } from "@/components/StaggerContainer";

const emptyForm = {
  title: "", description: "", location: "", work_type: "on-site" as const,
  duration: "", stipend: "", spots: "1", requirements: "",
};

export default function EmployerInternships() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [aiLoading, setAiLoading] = useState(false);

  const handleAIGenerate = async () => {
    if (!form.title.trim()) { toast.error("Enter a title first"); return; }
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-internship-generator", {
        body: { title: form.title, companyName: company?.id ? "our company" : "" },
      });
      if (error) throw error;
      if (data?.result) {
        setForm((f) => ({
          ...f,
          description: data.result.description || f.description,
          requirements: data.result.requirements || f.requirements,
        }));
        toast.success("AI generated description & requirements!");
      }
    } catch (e: any) {
      toast.error(e.message || "AI generation failed");
    } finally {
      setAiLoading(false);
    }
  };

  const { data: company } = useQuery({
    queryKey: ["company", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("companies").select("id").eq("owner_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: internships, isLoading } = useQuery({
    queryKey: ["employer-internships", company?.id],
    queryFn: async () => {
      const { data } = await supabase.from("internships").select("*").eq("company_id", company!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!company,
  });

  // Applicant counts per internship
  const { data: appCounts } = useQuery({
    queryKey: ["employer-app-counts", company?.id],
    queryFn: async () => {
      const ids = internships?.map((i) => i.id) ?? [];
      if (!ids.length) return {};
      const { data } = await supabase.from("applications").select("internship_id").in("internship_id", ids);
      const counts: Record<string, number> = {};
      data?.forEach((a) => { counts[a.internship_id] = (counts[a.internship_id] ?? 0) + 1; });
      return counts;
    },
    enabled: !!internships?.length,
  });

  const openEdit = (i: any) => {
    setEditId(i.id);
    setForm({
      title: i.title, description: i.description ?? "", location: i.location ?? "",
      work_type: i.work_type, duration: i.duration ?? "", stipend: i.stipend ?? "",
      spots: String(i.spots ?? 1), requirements: i.requirements ?? "",
    });
    setOpen(true);
  };

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        company_id: company!.id,
        title: form.title,
        description: form.description || null,
        location: form.location || null,
        work_type: form.work_type,
        duration: form.duration || null,
        stipend: form.stipend || null,
        spots: parseInt(form.spots) || 1,
        requirements: form.requirements || null,
      };
      if (editId) {
        const { error } = await supabase.from("internships").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("internships").insert({ ...payload, status: "active" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editId ? "Internship updated!" : "Internship created!");
      queryClient.invalidateQueries({ queryKey: ["employer-internships"] });
      setForm(emptyForm);
      setEditId(null);
      setOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const newStatus = status === "active" ? "paused" : "active";
      const { error } = await supabase.from("internships").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employer-internships"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("internships").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      queryClient.invalidateQueries({ queryKey: ["employer-internships"] });
    },
  });

  const statusColor: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    paused: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    closed: "bg-destructive/10 text-destructive",
  };

  if (!company) {
    return (
      <DashboardLayout sidebar={<EmployerSidebar />} requiredRole="employer">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="glass-card-themed">
            <CardContent className="py-12 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground mb-3">Please set up your company profile first.</p>
              <Button asChild size="sm"><a href="/dashboard/employer/company">Set Up Company</a></Button>
            </CardContent>
          </Card>
        </motion.div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebar={<EmployerSidebar />} requiredRole="employer">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold">Internships</h1>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditId(null); }}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> New Internship</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editId ? "Edit Internship" : "Create Internship"}</DialogTitle></DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <div className="flex gap-2">
                    <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="flex-1" />
                    {!editId && (
                      <Button type="button" variant="outline" size="icon" onClick={handleAIGenerate} disabled={aiLoading || !form.title.trim()} title="AI Generate Description">
                        {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Work Type</Label>
                    <Select value={form.work_type} onValueChange={(v: any) => setForm({ ...form, work_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="on-site">On-site</SelectItem>
                        <SelectItem value="remote">Remote</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Input value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="3 months" />
                  </div>
                  <div className="space-y-2">
                    <Label>Stipend</Label>
                    <Input value={form.stipend} onChange={e => setForm({ ...form, stipend: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Spots</Label>
                    <Input type="number" value={form.spots} onChange={e => setForm({ ...form, spots: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Requirements</Label>
                  <Textarea value={form.requirements} onChange={e => setForm({ ...form, requirements: e.target.value })} rows={2} />
                </div>
                <Button onClick={() => saveMutation.mutate()} disabled={!form.title || saveMutation.isPending} className="w-full">
                  {saveMutation.isPending ? "Saving..." : editId ? "Update Internship" : "Create Internship"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : !internships?.length ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="glass-card-themed">
              <CardContent className="py-12 text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground mb-3">No internships yet. Create your first listing!</p>
                <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Create Internship</Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <StaggerContainer className="space-y-3">
            {internships.map((i) => (
              <StaggerItem key={i.id}>
                <Card className="glass-card-themed hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
                  <CardContent className="py-4 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-medium">{i.title}</p>
                        <Badge className={statusColor[i.status]}>{i.status}</Badge>
                        {appCounts && appCounts[i.id] ? (
                          <Badge variant="outline" className="gap-1">
                            <Users className="h-3 w-3" /> {appCounts[i.id]}
                          </Badge>
                        ) : null}
                      </div>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        {i.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{i.location}</span>}
                        <span className="capitalize">{i.work_type}</span>
                        {i.spots && <span>{i.spots} spot{i.spots > 1 ? "s" : ""}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0 ml-4">
                      <Button variant="outline" size="icon" onClick={() => openEdit(i)} title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleStatus.mutate({ id: i.id, status: i.status })}
                      >
                        {i.status === "active" ? "Pause" : "Activate"}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(i.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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
