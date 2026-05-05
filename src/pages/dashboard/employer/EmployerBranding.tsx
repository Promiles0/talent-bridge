import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { EmployerSidebar } from "@/components/EmployerSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Save, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Company = {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  location: string | null;
  tagline: string | null;
  story: string | null;
  industry: string | null;
  size: string | null;
  brand_color: string | null;
  hero_image_url: string | null;
  culture_values: { title: string; description: string }[] | null;
};

export default function EmployerBranding() {
  const { user } = useAuth();
  const [c, setC] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiBusy, setAiBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("companies").select("*").eq("owner_id", user.id).maybeSingle();
      setC(data as any);
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <DashboardLayout sidebar={<EmployerSidebar />} requiredRole="employer"><p>Loading…</p></DashboardLayout>;
  if (!c) return <DashboardLayout sidebar={<EmployerSidebar />} requiredRole="employer"><p>No company found.</p></DashboardLayout>;

  const update = (patch: Partial<Company>) => setC({ ...c, ...patch });

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("companies").update({
      name: c.name, tagline: c.tagline, description: c.description, story: c.story,
      industry: c.industry, size: c.size, brand_color: c.brand_color, hero_image_url: c.hero_image_url,
      culture_values: c.culture_values ?? [], website: c.website, location: c.location,
    }).eq("id", c.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Brand saved");
  };

  const aiAssist = async (action: "rewrite_story" | "generate_values" | "suggest_tagline") => {
    setAiBusy(action);
    try {
      const { data, error } = await supabase.functions.invoke("ai-brand-assist", {
        body: { action, company: { name: c.name, industry: c.industry, story: c.story } },
      });
      if (error) throw error;
      if (action === "rewrite_story") update({ story: data.text });
      if (action === "generate_values") update({ culture_values: data.values ?? [] });
      if (action === "suggest_tagline") {
        const first = (data.taglines ?? [])[0];
        if (first) update({ tagline: first });
        toast.success(`Suggested: ${first}`);
      }
    } catch (e: any) {
      toast.error(e.message ?? "AI failed");
    } finally { setAiBusy(null); }
  };

  return (
    <DashboardLayout sidebar={<EmployerSidebar />} requiredRole="employer">
      <div className="space-y-6 pb-20 animate-slide-up max-w-5xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-7 w-7 text-primary" /> Branding Studio
            </h1>
            <p className="text-muted-foreground text-sm">Craft a brand that attracts the best Rwandan talent.</p>
          </div>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />} Save
          </Button>
        </div>

        <Tabs defaultValue="identity">
          <TabsList>
            <TabsTrigger value="identity">Identity</TabsTrigger>
            <TabsTrigger value="story">Story</TabsTrigger>
            <TabsTrigger value="culture">Culture</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="identity">
            <Card className="p-6 space-y-4">
              <div><label>Company name</label><Input value={c.name} onChange={(e) => update({ name: e.target.value })} /></div>
              <div className="flex gap-2 items-end">
                <div className="flex-1"><label>Tagline</label><Input value={c.tagline ?? ""} onChange={(e) => update({ tagline: e.target.value })} placeholder="A short, memorable line" /></div>
                <Button variant="outline" onClick={() => aiAssist("suggest_tagline")} disabled={aiBusy === "suggest_tagline"}>
                  {aiBusy === "suggest_tagline" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label>Industry</label><Input value={c.industry ?? ""} onChange={(e) => update({ industry: e.target.value })} placeholder="e.g. Fintech" /></div>
                <div><label>Size</label><Input value={c.size ?? ""} onChange={(e) => update({ size: e.target.value })} placeholder="e.g. 10-50" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label>Website</label><Input value={c.website ?? ""} onChange={(e) => update({ website: e.target.value })} /></div>
                <div><label>Location</label><Input value={c.location ?? ""} onChange={(e) => update({ location: e.target.value })} /></div>
              </div>
              <div>
                <label>Brand color</label>
                <div className="flex gap-2">
                  <Input type="color" value={c.brand_color ?? "#2ECC71"} onChange={(e) => update({ brand_color: e.target.value })} className="w-20 h-10 p-1" />
                  <Input value={c.brand_color ?? ""} onChange={(e) => update({ brand_color: e.target.value })} placeholder="#2ECC71" />
                </div>
              </div>
              <div><label>Hero image URL</label><Input value={c.hero_image_url ?? ""} onChange={(e) => update({ hero_image_url: e.target.value })} /></div>
            </Card>
          </TabsContent>

          <TabsContent value="story">
            <Card className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <label className="!mb-0">Company story</label>
                <Button variant="outline" size="sm" onClick={() => aiAssist("rewrite_story")} disabled={aiBusy === "rewrite_story"}>
                  {aiBusy === "rewrite_story" ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                  AI rewrite
                </Button>
              </div>
              <Textarea rows={10} value={c.story ?? ""} onChange={(e) => update({ story: e.target.value })} placeholder="Tell candidates who you are, why you exist, what you're building…" />
              <div><label>Short description (cards & search)</label><Textarea rows={3} value={c.description ?? ""} onChange={(e) => update({ description: e.target.value })} /></div>
            </Card>
          </TabsContent>

          <TabsContent value="culture">
            <Card className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <label className="!mb-0">Culture values</label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => aiAssist("generate_values")} disabled={aiBusy === "generate_values"}>
                    {aiBusy === "generate_values" ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                    AI generate
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => update({ culture_values: [...(c.culture_values ?? []), { title: "", description: "" }] })}>
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
              </div>
              {(c.culture_values ?? []).map((v, i) => (
                <Card key={i} className="p-3 space-y-2">
                  <div className="flex gap-2">
                    <Input value={v.title} onChange={(e) => {
                      const arr = [...(c.culture_values ?? [])]; arr[i] = { ...arr[i], title: e.target.value }; update({ culture_values: arr });
                    }} placeholder="Value title" />
                    <Button variant="ghost" size="icon" onClick={() => {
                      const arr = [...(c.culture_values ?? [])]; arr.splice(i, 1); update({ culture_values: arr });
                    }}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  <Textarea rows={2} value={v.description} onChange={(e) => {
                    const arr = [...(c.culture_values ?? [])]; arr[i] = { ...arr[i], description: e.target.value }; update({ culture_values: arr });
                  }} placeholder="What does this value look like in practice?" />
                </Card>
              ))}
            </Card>
          </TabsContent>

          <TabsContent value="preview">
            <Card className="overflow-hidden">
              <div className="h-40 relative" style={{ background: `linear-gradient(135deg, ${c.brand_color ?? "#2ECC71"}, hsl(var(--primary)))` }}>
                {c.hero_image_url && <img src={c.hero_image_url} alt="" className="w-full h-full object-cover opacity-50" />}
              </div>
              <div className="p-6 space-y-3">
                <h2 className="font-heading text-3xl font-bold">{c.name}</h2>
                {c.tagline && <p className="text-lg text-muted-foreground">{c.tagline}</p>}
                <div className="flex gap-2 flex-wrap">
                  {c.industry && <Badge variant="outline">{c.industry}</Badge>}
                  {c.size && <Badge variant="outline">{c.size} people</Badge>}
                  {c.location && <Badge variant="outline">{c.location}</Badge>}
                </div>
                {c.story && <p className="text-sm whitespace-pre-wrap leading-relaxed">{c.story}</p>}
                {(c.culture_values ?? []).length > 0 && (
                  <>
                    <h3 className="font-heading font-semibold mt-6">Our culture</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(c.culture_values ?? []).map((v, i) => (
                        <Card key={i} className="p-3">
                          <h4 className="font-semibold text-sm">{v.title}</h4>
                          <p className="text-xs text-muted-foreground">{v.description}</p>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
