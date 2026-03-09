import { DashboardLayout } from "@/components/DashboardLayout";
import { StudentSidebar } from "@/components/StudentSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import { Plus, ExternalLink, Trash2 } from "lucide-react";
import { SkillTag } from "@/components/SkillTag";

export default function StudentProjects() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", project_url: "", repo_url: "", tags: "" });

  const { data: student } = useQuery({
    queryKey: ["student-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("students").select("id").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: projects, isLoading } = useQuery({
    queryKey: ["student-projects", student?.id],
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("*").eq("student_id", student!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!student,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("projects").insert({
        student_id: student!.id,
        title: form.title,
        description: form.description || null,
        project_url: form.project_url || null,
        repo_url: form.repo_url || null,
        tags: form.tags ? form.tags.split(",").map(t => t.trim()) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Project added!");
      queryClient.invalidateQueries({ queryKey: ["student-projects"] });
      setForm({ title: "", description: "", project_url: "", repo_url: "", tags: "" });
      setOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Project deleted");
      queryClient.invalidateQueries({ queryKey: ["student-projects"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <DashboardLayout sidebar={<StudentSidebar />} requiredRole="student">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold">My Projects</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Project</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Project</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Live URL</Label>
                  <Input value={form.project_url} onChange={e => setForm({ ...form, project_url: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Repo URL</Label>
                  <Input value={form.repo_url} onChange={e => setForm({ ...form, repo_url: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Tags (comma-separated)</Label>
                  <Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="React, Node.js, Python" />
                </div>
                <Button onClick={() => addMutation.mutate()} disabled={!form.title || addMutation.isPending} className="w-full">
                  {addMutation.isPending ? "Adding..." : "Add Project"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : !projects?.length ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No projects yet. Add your first project to showcase your work!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {projects.map((p) => (
              <Card key={p.id}>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-heading font-semibold">{p.title}</h3>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(p.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
                  {p.tags && (
                    <div className="flex flex-wrap gap-1.5">
                      {p.tags.map((t) => <SkillTag key={t} label={t} />)}
                    </div>
                  )}
                  <div className="flex gap-2">
                    {p.project_url && (
                      <a href={p.project_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm"><ExternalLink className="h-3 w-3 mr-1" /> Live</Button>
                      </a>
                    )}
                    {p.repo_url && (
                      <a href={p.repo_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm"><ExternalLink className="h-3 w-3 mr-1" /> Repo</Button>
                      </a>
                    )}
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
