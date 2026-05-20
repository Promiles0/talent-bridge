import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { EmployerSidebar } from "@/components/EmployerSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sparkles, Search, Loader2, Star, Plus, MessageSquare, X } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { PresenceDot } from "@/components/PresenceDot";
import { usePresenceFor, usePresenceHeartbeat } from "@/lib/realtime";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { Switch } from "@/components/ui/switch";

type StudentRow = {
  id: string;
  user_id: string;
  headline: string | null;
  field_of_study: string | null;
  university: string | null;
  available: boolean;
  verified: boolean | null;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
  student_skills: { skills: { name: string } | null }[];
};

type Result = StudentRow & { score?: number; reason?: string };

export default function EmployerTalent() {
  usePresenceHeartbeat();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [aiMode, setAiMode] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [shortlists, setShortlists] = useState<{ id: string; name: string }[]>([]);
  const [activeShortlist, setActiveShortlist] = useState<string | null>(null);
  const [members, setMembers] = useState<Record<string, true>>({});
  const [verifiedOnly, setVerifiedOnly] = useState(true);

  const presence = usePresenceFor(results.map(r => r.user_id).filter(Boolean));

  const loadStudents = async () => {
    setLoading(true);
    let q = supabase
      .from("students")
      .select("id,user_id,headline,field_of_study,university,available,verified,profiles!inner(full_name,avatar_url),student_skills(skills(name))")
      .eq("available", true)
      .limit(40);
    if (verifiedOnly) q = q.eq("verified", true);
    if (query && !aiMode) {
      q = q.or(`headline.ilike.%${query}%,field_of_study.ilike.%${query}%,university.ilike.%${query}%`);
    }
    const { data } = await q;
    setResults((data ?? []) as any);
    setLoading(false);
  };

  const loadShortlists = async () => {
    if (!user) return;
    const { data } = await supabase.from("talent_shortlists").select("id,name").eq("employer_id", user.id).order("created_at");
    setShortlists(data ?? []);
    if (data && data.length && !activeShortlist) setActiveShortlist(data[0].id);
  };
  const loadMembers = async () => {
    if (!activeShortlist) { setMembers({}); return; }
    const { data } = await supabase.from("shortlist_members").select("student_id").eq("shortlist_id", activeShortlist);
    const map: Record<string, true> = {};
    (data ?? []).forEach((r: any) => { map[r.student_id] = true; });
    setMembers(map);
  };

  useEffect(() => { loadStudents(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { loadShortlists(); /* eslint-disable-next-line */ }, [user]);
  useEffect(() => { loadMembers(); /* eslint-disable-next-line */ }, [activeShortlist]);

  const aiSearch = async () => {
    if (!query) return;
    setLoading(true);
    setAiMode(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-talent-search", { body: { query, limit: 12 } });
      if (error) throw error;
      const ids = (data?.results ?? []).map((r: any) => r.id);
      if (!ids.length) { setResults([]); return; }
      const { data: students } = await supabase
        .from("students")
        .select("id,user_id,headline,field_of_study,university,available,profiles!inner(full_name,avatar_url),student_skills(skills(name))")
        .in("id", ids);
      const map = new Map((students ?? []).map((s: any) => [s.id, s]));
      const merged: Result[] = (data.results as any[])
        .map((r) => map.get(r.id) ? { ...(map.get(r.id) as any), score: r.score, reason: r.reason } : null)
        .filter(Boolean) as any;
      setResults(merged);
    } catch (e: any) {
      toast.error(e.message ?? "AI search failed");
    } finally { setLoading(false); }
  };

  const createShortlist = async () => {
    const name = prompt("Shortlist name?");
    if (!name || !user) return;
    const { data, error } = await supabase.from("talent_shortlists").insert({ employer_id: user.id, name }).select().single();
    if (error) { toast.error(error.message); return; }
    setShortlists(s => [...s, data]);
    setActiveShortlist(data.id);
  };

  const toggleMember = async (studentId: string) => {
    if (!activeShortlist) { toast.error("Create a shortlist first"); return; }
    if (members[studentId]) {
      await supabase.from("shortlist_members").delete().eq("shortlist_id", activeShortlist).eq("student_id", studentId);
      const m = { ...members }; delete m[studentId]; setMembers(m);
    } else {
      const { error } = await supabase.from("shortlist_members").insert({ shortlist_id: activeShortlist, student_id: studentId });
      if (error) { toast.error(error.message); return; }
      setMembers({ ...members, [studentId]: true });
      toast.success("Added to shortlist");
    }
  };

  const messageStudent = async (userId: string) => {
    if (!user) return;
    await supabase.from("messages").insert({ sender_id: user.id, receiver_id: userId, content: "Hi! I came across your profile on TalentBridge and would love to connect." });
    toast.success("Message sent");
  };

  return (
    <DashboardLayout sidebar={<EmployerSidebar />} requiredRole="employer">
      <div className="space-y-6 pb-20 animate-slide-up">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Search className="h-7 w-7 text-primary" /> Talent Search
          </h1>
          <p className="text-muted-foreground text-sm">Find Rwandan students that match your roles — with AI ranking.</p>
        </div>

        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs">
            <Switch checked={verifiedOnly} onCheckedChange={(v) => { setVerifiedOnly(v); }} id="verified-only" />
            <label htmlFor="verified-only" className="cursor-pointer">Verified students only</label>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex-1 min-w-[200px] flex gap-2">
              <Input
                placeholder='Try: "React frontend intern with portfolio"'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (aiMode ? aiSearch() : loadStudents())}
              />
              <Button variant="outline" onClick={() => { setAiMode(false); loadStudents(); }} disabled={loading}>
                <Search className="h-4 w-4 mr-1" /> Search
              </Button>
              <Button onClick={aiSearch} disabled={loading || !query}>
                {loading && aiMode ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
                AI Match
              </Button>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline"><Star className="h-4 w-4 mr-1" /> Shortlists</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader><SheetTitle>Shortlists</SheetTitle></SheetHeader>
                <div className="space-y-2 mt-4">
                  {shortlists.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setActiveShortlist(s.id)}
                      className={`w-full text-left p-3 rounded-md border ${activeShortlist === s.id ? "border-primary bg-primary/10" : "border-border"}`}
                    >
                      {s.name}
                    </button>
                  ))}
                  <Button variant="outline" className="w-full" onClick={createShortlist}>
                    <Plus className="h-4 w-4 mr-1" /> New shortlist
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          {activeShortlist && (
            <p className="text-xs text-muted-foreground mt-2">
              Active shortlist: <span className="font-medium">{shortlists.find(s => s.id === activeShortlist)?.name}</span>
            </p>
          )}
        </Card>

        {loading ? (
          <p className="text-sm text-muted-foreground">Searching…</p>
        ) : results.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">No students match yet — try a different query.</Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map(s => (
              <Card key={s.id} className="p-4 bento-card bento-card-glow">
                <div className="relative">
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={s.profiles?.avatar_url ?? undefined} />
                        <AvatarFallback>{s.profiles?.full_name?.[0] ?? "?"}</AvatarFallback>
                      </Avatar>
                      <span className="absolute -bottom-0.5 -right-0.5">
                        <PresenceDot status={presence[s.user_id] ?? "offline"} />
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to={`/students/${s.id}`} className="font-semibold hover:text-primary truncate flex items-center gap-1">
                        <span className="truncate">{s.profiles?.full_name ?? "Student"}</span>
                        <VerifiedBadge verified={s.verified} kind="student" />
                      </Link>
                      <p className="text-xs text-muted-foreground truncate">{s.headline ?? s.field_of_study}</p>
                      <p className="text-xs text-muted-foreground truncate">{s.university}</p>
                    </div>
                    {typeof s.score === "number" && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">{s.score}%</Badge>
                    )}
                  </div>
                  {s.reason && <p className="text-xs italic text-muted-foreground mt-2 line-clamp-2">"{s.reason}"</p>}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {(s.student_skills ?? []).slice(0, 5).map((sk, i) => sk.skills?.name && (
                      <Badge key={i} variant="secondary" className="text-[10px]">{sk.skills.name}</Badge>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => toggleMember(s.id)}>
                      {members[s.id] ? <><X className="h-3 w-3 mr-1" /> Remove</> : <><Plus className="h-3 w-3 mr-1" /> Shortlist</>}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => messageStudent(s.user_id)}>
                      <MessageSquare className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
