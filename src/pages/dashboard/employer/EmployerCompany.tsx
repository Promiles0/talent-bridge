import { DashboardLayout } from "@/components/DashboardLayout";
import { EmployerSidebar } from "@/components/EmployerSidebar";
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

export default function EmployerCompany() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

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

  return (
    <DashboardLayout sidebar={<EmployerSidebar />} requiredRole="employer">
      <div className="max-w-2xl space-y-6">
        <h1 className="font-heading text-2xl font-bold">Company Profile</h1>

        <Card>
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
      </div>
    </DashboardLayout>
  );
}
