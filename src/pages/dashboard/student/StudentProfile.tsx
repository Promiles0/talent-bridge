import { DashboardLayout } from "@/components/DashboardLayout";
import { StudentSidebar } from "@/components/StudentSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { Upload, FileText, X, Camera } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export default function StudentProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCV, setUploadingCV] = useState(false);

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

  const getCvUrl = () => {
    if (student?.cv_url) {
      if (student.cv_url.startsWith("http")) return student.cv_url;
      // For private bucket, use signed URL
      return null; // We'll generate signed URLs on demand
    }
    return null;
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error(uploadError.message);
      setUploadingAvatar(false);
      return;
    }

    // Update profile with avatar path
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: filePath })
      .eq("id", user.id);

    if (updateError) {
      toast.error(updateError.message);
    } else {
      toast.success("Avatar updated!");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    }
    setUploadingAvatar(false);
  };

  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a PDF or Word document");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("CV must be under 10MB");
      return;
    }

    setUploadingCV(true);
    const ext = file.name.split(".").pop();
    const filePath = `${user.id}/cv.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("cvs")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error(uploadError.message);
      setUploadingCV(false);
      return;
    }

    // Update student record with CV path
    if (student) {
      const { error: updateError } = await supabase
        .from("students")
        .update({ cv_url: filePath })
        .eq("id", student.id);

      if (updateError) {
        toast.error(updateError.message);
      } else {
        toast.success("CV uploaded!");
        queryClient.invalidateQueries({ queryKey: ["student-profile"] });
      }
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
    const { data, error } = await supabase.storage
      .from("cvs")
      .createSignedUrl(student.cv_url, 60);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    } else {
      toast.error("Could not generate download link");
    }
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

  return (
    <DashboardLayout sidebar={<StudentSidebar />} requiredRole="student">
      <div className="max-w-2xl space-y-6">
        <h1 className="font-heading text-2xl font-bold">My Profile</h1>

        {/* Avatar & CV Upload Card */}
        <Card>
          <CardHeader><CardTitle>Photo & Resume</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Avatar className="h-20 w-20">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt="Avatar" />}
                  <AvatarFallback className="text-lg bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 flex items-center justify-center bg-foreground/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera className="h-5 w-5 text-background" />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              <div>
                <p className="text-sm font-medium">{profile?.full_name || "Student"}</p>
                <p className="text-xs text-muted-foreground">
                  {uploadingAvatar ? "Uploading..." : "Hover to change photo"}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  <Upload className="h-3 w-3 mr-1" />
                  {uploadingAvatar ? "Uploading..." : "Upload Photo"}
                </Button>
              </div>
            </div>

            {/* CV Upload */}
            <div className="border border-dashed border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {student?.cv_url ? "CV Uploaded" : "No CV uploaded"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {student?.cv_url
                        ? student.cv_url.split("/").pop()
                        : "PDF or Word, max 10MB"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {student?.cv_url && (
                    <>
                      <Button variant="outline" size="sm" onClick={downloadCV}>
                        View
                      </Button>
                      <Button variant="ghost" size="icon" onClick={handleRemoveCV}>
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => cvInputRef.current?.click()}
                    disabled={uploadingCV}
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    {uploadingCV ? "Uploading..." : student?.cv_url ? "Replace" : "Upload CV"}
                  </Button>
                  <input
                    ref={cvInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={handleCVUpload}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
