import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Target, TrendingUp, BookOpen, Loader2, CheckCircle2, Calendar } from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { motion } from "framer-motion";

// Market demand baselines per role (0–100). Editable presets — easily extended.
const ROLE_MARKETS: Record<string, Record<string, number>> = {
  "Frontend Developer": {
    React: 95, TypeScript: 90, CSS: 85, "UI/UX": 70, Testing: 65, Accessibility: 60, Performance: 70,
  },
  "Backend Developer": {
    Node: 85, SQL: 90, APIs: 90, Docker: 75, Security: 80, Testing: 70, "System Design": 75,
  },
  "Data Analyst": {
    SQL: 95, Python: 85, Excel: 80, Statistics: 85, Visualization: 80, "Power BI": 70, Communication: 75,
  },
  "Product Designer": {
    Figma: 95, "UI/UX": 95, Prototyping: 85, Research: 80, "Design Systems": 75, Accessibility: 70, Communication: 80,
  },
  "Marketing Specialist": {
    SEO: 85, Copywriting: 80, Analytics: 80, "Social Media": 75, "Email Marketing": 70, Branding: 70, Strategy: 75,
  },
};

type RoadmapWeek = {
  week: number;
  focus: string;
  milestone: string;
  tasks: string[];
  resources: { title: string; type: string }[];
};

type Roadmap = { summary: string; weeks: RoadmapWeek[] };

export default function StudentSkillGap() {
  const { user } = useAuth();
  const [targetRole, setTargetRole] = useState<string>("Frontend Developer");
  const [customSkill, setCustomSkill] = useState("");
  const [extraSkills, setExtraSkills] = useState<string[]>([]);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: studentSkills = [] } = useQuery({
    queryKey: ["student-skills-for-gap", user?.id],
    queryFn: async () => {
      const { data: student } = await supabase.from("students").select("id").eq("user_id", user!.id).maybeSingle();
      if (!student) return [];
      const { data } = await supabase
        .from("student_skills")
        .select("skill_id, skills(name)")
        .eq("student_id", student.id);
      return (data || []).map((r: any) => r.skills?.name).filter(Boolean) as string[];
    },
    enabled: !!user,
  });

  const allMySkills = useMemo(
    () => Array.from(new Set([...studentSkills.map((s) => s.toLowerCase()), ...extraSkills.map((s) => s.toLowerCase())])),
    [studentSkills, extraSkills]
  );

  const market = ROLE_MARKETS[targetRole] || {};

  const chartData = useMemo(
    () =>
      Object.entries(market).map(([skill, demand]) => ({
        skill,
        market: demand,
        you: allMySkills.includes(skill.toLowerCase()) ? Math.min(80, demand - 5) : 15,
      })),
    [market, allMySkills]
  );

  const gaps = useMemo(
    () =>
      chartData
        .filter((d) => d.market - d.you >= 30)
        .sort((a, b) => b.market - b.you - (a.market - a.you))
        .map((d) => d.skill),
    [chartData]
  );

  const matchScore = useMemo(() => {
    if (!chartData.length) return 0;
    const total = chartData.reduce((acc, d) => acc + d.market, 0);
    const got = chartData.reduce((acc, d) => acc + Math.min(d.you, d.market), 0);
    return Math.round((got / total) * 100);
  }, [chartData]);

  const addSkill = () => {
    const s = customSkill.trim();
    if (!s) return;
    setExtraSkills((prev) => Array.from(new Set([...prev, s])));
    setCustomSkill("");
  };

  const generateRoadmap = async () => {
    setLoading(true);
    setRoadmap(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-skill-roadmap", {
        body: { currentSkills: allMySkills, targetRole, gaps },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setRoadmap(data as Roadmap);
      toast.success("Your personalized roadmap is ready!");
    } catch (e: any) {
      toast.error(e?.message || "Failed to generate roadmap");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Skill Gap Analyzer</h1>
              <p className="text-sm text-muted-foreground">Compare your skills to the market and get an AI learning plan.</p>
            </div>
          </div>
        </motion.div>

        {/* Controls */}
        <GlassCard className="p-4 md:p-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium mb-2 block">Target role</label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(ROLE_MARKETS).map((r) => (
                  <Button
                    key={r}
                    size="sm"
                    variant={r === targetRole ? "default" : "outline"}
                    onClick={() => setTargetRole(r)}
                  >
                    {r}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Add a skill you have</label>
              <div className="flex gap-2">
                <Input
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                  placeholder="e.g. React, SQL, Figma"
                />
                <Button onClick={addSkill} variant="secondary">Add</Button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {allMySkills.length === 0 && (
                  <span className="text-xs text-muted-foreground">No skills added yet — add some or update your profile.</span>
                )}
                {allMySkills.map((s) => (
                  <Badge key={s} variant="secondary" className="capitalize">{s}</Badge>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Chart + score */}
        <div className="grid gap-6 lg:grid-cols-3">
          <GlassCard className="p-4 md:p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> You vs Market — {targetRole}</h2>
              <Badge variant="outline">{chartData.length} skills</Badge>
            </div>
            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={chartData} outerRadius="75%">
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                  <Radar name="Market demand" dataKey="market" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} />
                  <Radar name="You" dataKey="you" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.4} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard className="p-4 md:p-6 space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Market match score</p>
              <p className="text-4xl font-bold mt-1">{matchScore}%</p>
              <Progress value={matchScore} className="mt-2" />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Top skill gaps</p>
              {gaps.length === 0 ? (
                <p className="text-xs text-muted-foreground">No major gaps — you're well aligned. 🎉</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {gaps.map((g) => (
                    <Badge key={g} variant="destructive" className="bg-destructive/15 text-destructive border-destructive/30">{g}</Badge>
                  ))}
                </div>
              )}
            </div>
            <Button onClick={generateRoadmap} disabled={loading} className="w-full">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate AI Roadmap</>}
            </Button>
          </GlassCard>
        </div>

        {/* Roadmap */}
        {roadmap && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard className="p-4 md:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-lg">Your 8-Week Learning Roadmap</h2>
              </div>
              <p className="text-sm text-muted-foreground">{roadmap.summary}</p>

              <div className="grid gap-4 md:grid-cols-2">
                {roadmap.weeks.map((w) => (
                  <motion.div
                    key={w.week}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: w.week * 0.04 }}
                    className="rounded-xl border border-border/60 bg-background/40 p-4 hover:border-primary/40 transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="font-mono">Week {w.week}</Badge>
                      <span className="text-xs text-muted-foreground">{w.resources.length} resources</span>
                    </div>
                    <h3 className="font-semibold">{w.focus}</h3>
                    <div className="flex items-start gap-2 mt-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-muted-foreground"><span className="text-foreground font-medium">Milestone:</span> {w.milestone}</p>
                    </div>
                    <ul className="mt-3 space-y-1 text-sm list-disc pl-5 text-muted-foreground">
                      {w.tasks.map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                    {w.resources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/50 space-y-1">
                        {w.resources.map((r, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <BookOpen className="h-3 w-3 text-primary" />
                            <span className="font-medium">{r.title}</span>
                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 capitalize">{r.type}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
