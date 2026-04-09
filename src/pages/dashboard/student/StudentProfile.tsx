import { DashboardLayout } from "@/components/DashboardLayout";
import { StudentSidebar } from "@/components/StudentSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { Upload, FileText, X, Camera, Plus, Search } from "lucide-react";
import { motion } from "framer-motion";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export default function StudentProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCV, setUploadingCV] = useState(false);
  const [skillSearch, setSkillSearch] = useState("");
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: student, isLoading } = useQuery({
    queryKey: ["student-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("students").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Skills
  const { data: allSkills } = useQuery({
    queryKey: ["all-skills"],
    queryFn: async () => {
      const { data } = await supabase.from("skills").select("*").order("name");
      return data ?? [];
    },
  });

  const { data: studentSkills, refetch: refetchSkills } = useQuery({
    queryKey: ["student-skills", student?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("student_skills")
        .select("skill_id, skills(id, name)")
        .eq("student_id", student!.id);
      return data ?? [];
    },
    enabled: !!student,
  });

  const [form, setForm] = useState({
    headline: "", bio: "", university: "", field_of_study: "",
    graduation_year: "", github_url: "", linkedin_url: "", portfolio_url: "",
  });

  useEffect(() => {
    if (student) {
      setForm({
        headline: student.headline ?? "", bio: student.bio ?? "",
        university: student.university ?? "", field_of_study: student.field_of_study ?? "",
        graduation_year: student.graduation_year?.toString() ?? "",
        github_url: student.github_url ?? "", linkedin_url: student.linkedin_url ?? "",
        portfolio_url: student.portfolio_url ?? "",
      });
    }
  }, [student]);

  const getAvatarUrl = () => {
    if (profile?.avatar_url) {
      if (profile.avatar_url.startsWith("http")) return profile.avatar_url;
      return `${SUPABASE_URL}/storage/v1/object/public/avatars/${profile.avatar_url}`;
    }
    return null;
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }

    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
    if (uploadError) { toast.error(uploadError.message); setUploadingAvatar(false); return; }
    const { error: updateError } = await supabase.from("profiles").update({ avatar_url: filePath }).eq("id", user.id);
    if (updateError) toast.error(updateError.message);
    else { toast.success("Avatar updated!"); queryClient.invalidateQueries({ queryKey: ["profile"] }); }
    setUploadingAvatar(false);
  };

  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowedTypes.includes(file.type)) { toast.error("Please upload a PDF or Word document"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("CV must be under 10MB"); return; }

    setUploadingCV(true);
    const ext = file.name.split(".").pop();
    const filePath = `${user.id}/cv.${ext}`;
    const { error: uploadError } = await supabase.storage.from("cvs").upload(filePath, file, { upsert: true });
    if (uploadError) { toast.error(uploadError.message); setUploadingCV(false); return; }
    if (student) {
      const { error: updateError } = await supabase.from("students").update({ cv_url: filePath }).eq("id", student.id);
      if (updateError) toast.error(updateError.message);
      else { toast.success("CV uploaded!"); queryClient.invalidateQueries({ queryKey: ["student-profile"] }); }
    }
    setUploadingCV(false);
  };

  const handleRemoveCV = async () => {
    if (!student?.cv_url || !user) return;
    await supabase.storage.from("cvs").remove([student.cv_url]);
    await supabase.from("students").update({ cv_url: null }).eq("id", student.id);
    toast.success("CV removed");
    queryClient.invalidateQueries({ queryKey: ["student-profile"] });
  };

  const downloadCV = async () => {
    if (!student?.cv_url) return;
    const { data } = await supabase.storage.from("cvs").createSignedUrl(student.cv_url, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
    else toast.error("Could not generate download link");
  };

  const addSkill = async (skillId: string) => {
    if (!student) return;
    const { error } = await supabase.from("student_skills").insert({ student_id: student.id, skill_id: skillId });
    if (error) {
      if (error.code === "23505") toast.error("Skill already added");
      else toast.error(error.message);
    } else {
      toast.success("Skill added!");
      refetchSkills();
    }
    setSkillSearch("");
    setShowSkillDropdown(false);
  };

  const addNewSkill = async () => {
    if (!skillSearch.trim() || !student) return;
    // Create the skill first, then link
    const { data: existing } = await supabase.from("skills").select("id").ilike("name", skillSearch.trim()).maybeSingle();
    if (existing) {
      await addSkill(existing.id);
      return;
    }
    const { data: newSkill, error } = await supabase.from("skills").insert({ name: skillSearch.trim() }).select("id").single();
    if (error) { toast.error(error.message); return; }
    await addSkill(newSkill.id);
  };

  const removeSkill = async (skillId: string) => {
    if (!student) return;
    const { error } = await supabase.from("student_skills").delete().eq("student_id", student.id).eq("skill_id", skillId);
    if (error) toast.error(error.message);
    else { toast.success("Skill removed"); refetchSkills(); }
  };

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: user!.id,
        headline: form.headline || null, bio: form.bio || null,
        university: form.university || null, field_of_study: form.field_of_study || null,
        graduation_year: form.graduation_year ? parseInt(form.graduation_year) : null,
        github_url: form.github_url || null, linkedin_url: form.linkedin_url || null,
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

  const avatarUrl = getAvatarUrl();
  const initials = profile?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase() || "?";

  const filteredSkills = allSkills?.filter(
    (s) =>
      s.name.toLowerCase().includes(skillSearch.toLowerCase()) &&
      !studentSkills?.some((ss: any) => ss.skill_id === s.id)
  ) ?? [];

  return (
    <DashboardLayout sidebar={<StudentSidebar />} requiredRole="student">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl space-y-6">
        <h1 className="font-heading text-2xl font-bold">My Profile</h1>

        {/* Avatar & CV */}
        <Card className="glass-card-themed">
          <CardHeader><CardTitle>Photo & Resume</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Avatar className="h-20 w-20">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt="Avatar" />}
                  <AvatarFallback className="text-lg bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>
                <button onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar}
                  className="absolute inset-0 flex items-center justify-center bg-foreground/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="h-5 w-5 text-background" />
                </button>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>
              <div>
                <p className="text-sm font-medium">{profile?.full_name || "Student"}</p>
                <p className="text-xs text-muted-foreground">{uploadingAvatar ? "Uploading..." : "Hover to change photo"}</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar}>
                  <Upload className="h-3 w-3 mr-1" /> {uploadingAvatar ? "Uploading..." : "Upload Photo"}
                </Button>
              </div>
            </div>

            <div className="border border-dashed border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{student?.cv_url ? "CV Uploaded" : "No CV uploaded"}</p>
                    <p className="text-xs text-muted-foreground">{student?.cv_url ? student.cv_url.split("/").pop() : "PDF or Word, max 10MB"}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {student?.cv_url && (
                    <>
                      <Button variant="outline" size="sm" onClick={downloadCV}>View</Button>
                      <Button variant="ghost" size="icon" onClick={handleRemoveCV}><X className="h-4 w-4 text-destructive" /></Button>
                    </>
                  )}
                  <Button variant="outline" size="sm" onClick={() => cvInputRef.current?.click()} disabled={uploadingCV}>
                    <Upload className="h-3 w-3 mr-1" /> {uploadingCV ? "Uploading..." : student?.cv_url ? "Replace" : "Upload CV"}
                  </Button>
                  <input ref={cvInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleCVUpload} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skills Management */}
        <Card className="glass-card-themed">
          <CardHeader><CardTitle>Skills</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {/* Current skills */}
            {studentSkills && studentSkills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {studentSkills.map((ss: any) => (
                  <motion.div key={ss.skill_id} whileHover={{ scale: 1.05 }} className="inline-flex">
                    <Badge variant="secondary" className="gap-1 pr-1 hover:shadow-[0_0_8px_hsl(var(--primary)/0.3)] transition-shadow">
                      {ss.skills?.name}
                      <button onClick={() => removeSkill(ss.skill_id)} className="ml-1 hover:text-destructive transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Add skill */}
            {student && (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search or add a skill..."
                    value={skillSearch}
                    onChange={(e) => { setSkillSearch(e.target.value); setShowSkillDropdown(true); }}
                    onFocus={() => setShowSkillDropdown(true)}
                    className="pl-9"
                  />
                </div>
                {showSkillDropdown && skillSearch && (
                  <div className="absolute z-10 top-full mt-1 w-full rounded-lg border border-border bg-popover shadow-lg max-h-48 overflow-y-auto">
                    {filteredSkills.slice(0, 8).map((s) => (
                      <button
                        key={s.id}
                        onClick={() => addSkill(s.id)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                      >
                        {s.name}
                      </button>
                    ))}
                    {filteredSkills.length === 0 && (
                      <button
                        onClick={addNewSkill}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors text-primary"
                      >
                        <Plus className="h-3 w-3 inline mr-1" /> Add "{skillSearch}"
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            {!student && <p className="text-sm text-muted-foreground">Save your profile first to manage skills.</p>}
          </CardContent>
        </Card>

        <Card className="glass-card-themed">
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

        <Card className="glass-card-themed">
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

        <Card className="glass-card-themed">
          <CardHeader><CardTitle>Links</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>GitHub URL</Label><Input value={form.github_url} onChange={(e) => setForm({ ...form, github_url: e.target.value })} /></div>
            <div className="space-y-2"><Label>LinkedIn URL</Label><Input value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} /></div>
            <div className="space-y-2"><Label>Portfolio URL</Label><Input value={form.portfolio_url} onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })} /></div>
          </CardContent>
        </Card>

        <Button onClick={() => upsertMutation.mutate()} disabled={upsertMutation.isPending}>
          {upsertMutation.isPending ? "Saving..." : "Save Profile"}
        </Button>
      </motion.div>
    </DashboardLayout>
  );
}
