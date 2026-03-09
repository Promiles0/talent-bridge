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
import { Plus, Trash2, MapPin } from "lucide-react";

export default function EmployerInternships() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    title: "", description: "", location: "", work_type: "on-site" as const,
    duration: "", stipend: "", spots: "1", requirements: "",
  });

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

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("internships").insert({
        company_id: company!.id,
        title: form.title,
        description: form.description || null,
        location: form.location || null,
        work_type: form.work_type,
        duration: form.duration || null,
        stipend: form.stipend || null,
        spots: parseInt(form.spots) || 1,
        requirements: form.requirements || null,
        status: "draft",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Internship created!");
      queryClient.invalidateQueries({ queryKey: ["employer-internships"] });
      setForm({ title: "", description: "", location: "", work_type: "on-site", duration: "", stipend: "", spots: "1", requirements: "" });
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
    active: "bg-green-100 text-green-700",
    paused: "bg-yellow-100 text-yellow-700",
    closed: "bg-destructive/10 text-destructive",
  };

  if (!company) {
    return (
      <DashboardLayout sidebar={<EmployerSidebar />} requiredRole="employer">
        <Card><CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Please set up your company profile first.</p>
        </CardContent></Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebar={<EmployerSidebar />} requiredRole="employer">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold">Internships</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Internship</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Create Internship</DialogTitle></DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
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
                <Button onClick={() => addMutation.mutate()} disabled={!form.title || addMutation.isPending} className="w-full">
                  {addMutation.isPending ? "Creating..." : "Create Internship"}
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
          <Card><CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No internships yet. Create your first listing!</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {internships.map((i) => (
              <Card key={i.id}>
                <CardContent className="py-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{i.title}</p>
                      <Badge className={statusColor[i.status]}>{i.status}</Badge>
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      {i.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{i.location}</span>}
                      <span>{i.work_type}</span>
                      {i.spots && <span>{i.spots} spot{i.spots > 1 ? "s" : ""}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
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
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
