import { DashboardLayout } from "@/components/DashboardLayout";
import { StudentSidebar } from "@/components/StudentSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export default function StudentProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: student, isLoading } = useQuery({
    queryKey: ["student-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("students")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const [form, setForm] = useState({
    headline: "",
    bio: "",
    university: "",
    field_of_study: "",
    graduation_year: "",
    github_url: "",
    linkedin_url: "",
    portfolio_url: "",
  });

  useEffect(() => {
    if (student) {
      setForm({
        headline: student.headline ?? "",
        bio: student.bio ?? "",
        university: student.university ?? "",
        field_of_study: student.field_of_study ?? "",
        graduation_year: student.graduation_year?.toString() ?? "",
        github_url: student.github_url ?? "",
        linkedin_url: student.linkedin_url ?? "",
        portfolio_url: student.portfolio_url ?? "",
      });
    }
  }, [student]);

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: user!.id,
        headline: form.headline || null,
        bio: form.bio || null,
        university: form.university || null,
        field_of_study: form.field_of_study || null,
        graduation_year: form.graduation_year ? parseInt(form.graduation_year) : null,
        github_url: form.github_url || null,
        linkedin_url: form.linkedin_url || null,
        portfolio_url: form.portfolio_url || null,
      };

      if (student) {
        const { error } = await supabase.from("students").update(payload).eq("id", student.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("students").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Profile saved!");
      queryClient.invalidateQueries({ queryKey: ["student-profile"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (isLoading) return (
    <DashboardLayout sidebar={<StudentSidebar />} requiredRole="student">
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout sidebar={<StudentSidebar />} requiredRole="student">
      <div className="max-w-2xl space-y-6">
        <h1 className="font-heading text-2xl font-bold">My Profile</h1>

        <Card>
          <CardHeader><CardTitle>Basic Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Headline</Label>
              <Input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} placeholder="e.g. Full-Stack Developer" />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell employers about yourself..." rows={4} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Education</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>University</Label>
                <Input value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Field of Study</Label>
                <Input value={form.field_of_study} onChange={(e) => setForm({ ...form, field_of_study: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2 max-w-[200px]">
              <Label>Graduation Year</Label>
              <Input type="number" value={form.graduation_year} onChange={(e) => setForm({ ...form, graduation_year: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Links</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>GitHub URL</Label>
              <Input value={form.github_url} onChange={(e) => setForm({ ...form, github_url: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>LinkedIn URL</Label>
              <Input value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Portfolio URL</Label>
              <Input value={form.portfolio_url} onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Button onClick={() => upsertMutation.mutate()} disabled={upsertMutation.isPending}>
          {upsertMutation.isPending ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </DashboardLayout>
  );
}
