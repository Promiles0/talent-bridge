import { DashboardLayout } from "@/components/DashboardLayout";
import { EmployerSidebar } from "@/components/EmployerSidebar";
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
import { Upload, Camera, Building2 } from "lucide-react";
import { motion } from "framer-motion";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export default function EmployerCompany() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const { data: company, isLoading } = useQuery({
    queryKey: ["company", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("companies").select("*").eq("owner_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const [form, setForm] = useState({
    name: "",
    description: "",
    location: "",
    website: "",
  });

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name ?? "",
        description: company.description ?? "",
        location: company.location ?? "",
        website: company.website ?? "",
      });
    }
  }, [company]);

  const getLogoUrl = () => {
    if (company?.logo_url) {
      if (company.logo_url.startsWith("http")) return company.logo_url;
      return `${SUPABASE_URL}/storage/v1/object/public/avatars/${company.logo_url}`;
    }
    return null;
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !company) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploadingLogo(true);
    const ext = file.name.split(".").pop();
    const filePath = `companies/${company.id}/logo.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error(uploadError.message);
      setUploadingLogo(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("companies")
      .update({ logo_url: filePath })
      .eq("id", company.id);

    if (updateError) {
      toast.error(updateError.message);
    } else {
      toast.success("Logo updated!");
      queryClient.invalidateQueries({ queryKey: ["company"] });
    }
    setUploadingLogo(false);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        owner_id: user!.id,
        name: form.name,
        description: form.description || null,
        location: form.location || null,
        website: form.website || null,
      };
      if (company) {
        const { error } = await supabase.from("companies").update(payload).eq("id", company.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("companies").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Company saved!");
      queryClient.invalidateQueries({ queryKey: ["company"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (isLoading) return (
    <DashboardLayout sidebar={<EmployerSidebar />} requiredRole="employer">
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    </DashboardLayout>
  );

  const logoUrl = getLogoUrl();
  const initials = company?.name?.slice(0, 2)?.toUpperCase() || "CO";

  return (
    <DashboardLayout sidebar={<EmployerSidebar />} requiredRole="employer">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl space-y-6">
        <h1 className="font-heading text-2xl font-bold">Company Profile</h1>

        {/* Logo Upload */}
        <Card className="glass-card-themed">
          <CardHeader><CardTitle>Company Logo</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Avatar className="h-20 w-20 rounded-xl">
                  {logoUrl && <AvatarImage src={logoUrl} alt="Logo" />}
                  <AvatarFallback className="text-lg bg-primary/10 text-primary rounded-xl">
                    <Building2 className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                {company && (
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="absolute inset-0 flex items-center justify-center bg-foreground/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Camera className="h-5 w-5 text-background" />
                  </button>
                )}
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </div>
              <div>
                <p className="text-sm font-medium">{company?.name || "Your Company"}</p>
                <p className="text-xs text-muted-foreground">
                  {uploadingLogo ? "Uploading..." : company ? "Hover to change logo" : "Save company first to upload logo"}
                </p>
                {company && (
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>
                    <Upload className="h-3 w-3 mr-1" /> {uploadingLogo ? "Uploading..." : "Upload Logo"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card-themed">
          <CardHeader><CardTitle>Company Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Company Name *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button onClick={() => saveMutation.mutate()} disabled={!form.name || saveMutation.isPending}>
          {saveMutation.isPending ? "Saving..." : "Save Company"}
        </Button>
      </motion.div>
    </DashboardLayout>
  );
}
