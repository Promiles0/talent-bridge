import { DashboardLayout } from "@/components/DashboardLayout";
import { StudentSidebar } from "@/components/StudentSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Briefcase, FolderKanban, Zap, CheckCircle, Search, UserCog, Plus, MessageSquare, Lightbulb, UserCheck, FileText, Code2, Send, Star, Lock, MapPin, Building2 } from "lucide-react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { SkillTag } from "@/components/SkillTag";

function AnimatedCounter({ value }: { value: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => { const c = animate(count, value, { duration: 1, ease: "easeOut" }); return c.stop; }, [value, count]);
  useEffect(() => rounded.on("change", (v) => { if (ref.current) ref.current.textContent = String(v); }), [rounded]);
  return <span ref={ref}>0</span>;
}

const tips = [
  "Tip: Tailor your headline to the role you want.",
  "Did you know? Profiles with projects get 3x more views.",
  "Keep your skills updated to match trending job requirements.",
  "A strong bio tells employers who you are beyond your resume.",
  "Add your GitHub and LinkedIn to boost credibility.",
  "Apply early — most positions fill within the first week.",
];

const quickActions = [
  { label: "Browse Internships", icon: Search, href: "/internships" },
  { label: "Update Profile", icon: UserCog, href: "/dashboard/student/profile" },
  { label: "Add Project", icon: Plus, href: "/dashboard/student/projects" },
  { label: "Messages", icon: MessageSquare, href: "/dashboard/student/messages" },
];

const milestonesDef = [
  { key: "profile_created", label: "Profile Created", icon: UserCheck },
  { key: "bio_added", label: "Bio Written", icon: FileText },
  { key: "first_skill", label: "First Skill", icon: Zap },
  { key: "first_project", label: "First Project", icon: Code2 },
  { key: "first_application", label: "First Application", icon: Send },
  { key: "profile_complete", label: "100% Complete", icon: Star },
];

export default function StudentOverview() {
  const { user } = useAuth();
  const [tipIdx] = useState(() => Math.floor(Math.random() * tips.length));

  const { data: student, isLoading: loadingStudent } = useQuery({
    queryKey: ["student-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("students").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: applications } = useQuery({
    queryKey: ["student-applications", student?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("applications")
        .select("*, internships(title, companies(name))")
        .eq("student_id", student!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
    enabled: !!student,
  });

  const { data: projects } = useQuery({
    queryKey: ["student-projects", student?.id],
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("*").eq("student_id", student!.id);
      return data ?? [];
    },
    enabled: !!student,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: skills } = useQuery({
    queryKey: ["student-skills-count", student?.id],
    queryFn: async () => {
      const { data } = await supabase.from("student_skills").select("skill_id, skills(name)").eq("student_id", student!.id);
      return data ?? [];
    },
    enabled: !!student,
  });

  const { data: earnedMilestones } = useQuery({
    queryKey: ["student-milestones", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("student_milestones").select("*").eq("student_id", user!.id);
      return data ?? [];
    },
    enabled: !!user,
  });

  // Recommended internships
  const skillNames = skills?.map((s: any) => s.skills?.name).filter(Boolean) ?? [];
  const { data: recommended } = useQuery({
    queryKey: ["recommended-internships", skillNames],
    queryFn: async () => {
      if (!skillNames.length) return [];
      let q = supabase
        .from("internships")
        .select("*, companies(name, logo_url)")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(6);
      // Build OR filter for skills matching requirements
      const orFilter = skillNames.map((s: string) => `requirements.ilike.%${s}%`).join(",");
      q = q.or(orFilter);
      const { data } = await q;
      return data ?? [];
    },
    enabled: skillNames.length > 0,
  });

  // Check and award milestones
  const awardMutation = useMutation({
    mutationFn: async (milestone: string) => {
      await supabase.from("student_milestones").insert({ student_id: user!.id, milestone }).select();
    },
  });

  useEffect(() => {
    if (!student || !earnedMilestones || !user) return;
    const earned = new Set(earnedMilestones.map((m: any) => m.milestone));
    const checks: Record<string, boolean> = {
      profile_created: true,
      bio_added: !!student.bio && student.bio.length > 10,
      first_skill: (skills?.length ?? 0) >= 1,
      first_project: (projects?.length ?? 0) >= 1,
      first_application: (applications?.length ?? 0) >= 1,
      profile_complete: completion >= 100,
    };
    Object.entries(checks).forEach(([key, met]) => {
      if (met && !earned.has(key)) {
        awardMutation.mutate(key);
        const def = milestonesDef.find(m => m.key === key);
        if (def) toast.success(`🏆 Achievement unlocked: ${def.label}!`);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student, earnedMilestones, skills, projects, applications]);

  // Profile completion
  const completionFields = [
    !!profile?.full_name,
    !!student?.headline,
    !!student?.university,
    !!student?.bio,
    (skills?.length ?? 0) > 0,
    (projects?.length ?? 0) > 0,
    !!student?.github_url || !!student?.linkedin_url,
  ];
  const completion = Math.round((completionFields.filter(Boolean).length / completionFields.length) * 100);

  const stats = [
    { label: "Applications", value: applications?.length ?? 0, icon: Briefcase, color: "text-primary" },
    { label: "Projects", value: projects?.length ?? 0, icon: FolderKanban, color: "text-secondary" },
    { label: "Skills", value: skills?.length ?? 0, icon: Zap, color: "text-primary" },
    { label: "Shortlisted", value: applications?.filter((a: any) => a.status === "shortlisted").length ?? 0, icon: CheckCircle, color: "text-secondary" },
  ];

  const earnedSet = new Set(earnedMilestones?.map((m: any) => m.milestone) ?? []);

  return (
    <DashboardLayout sidebar={<StudentSidebar />} requiredRole="student">
      <div className="space-y-6">
        {/* Welcome banner */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-gradient-to-r from-primary/10 via-secondary/5 to-transparent p-6 border border-primary/10">
          <h1 className="font-heading text-2xl font-bold">Welcome back, {profile?.full_name || "Student"} 👋</h1>
          <p className="text-muted-foreground text-sm mt-1">Here's what's happening with your career today.</p>
          <div className="mt-4 max-w-md">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Profile completion</span>
              <span className="font-semibold text-primary">{completion}%</span>
            </div>
            <Progress value={completion} className="h-2" />
            {completion < 100 && (
              <p className="text-xs text-muted-foreground mt-1.5">
                {!student?.bio ? "Add a bio" : (skills?.length ?? 0) === 0 ? "Add your skills" : "Complete your profile"} to reach {Math.min(completion + 15, 100)}%
              </p>
            )}
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loadingStudent ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><CardContent className="pt-6"><div className="flex items-center gap-3"><Skeleton className="h-8 w-8 rounded" /><div className="space-y-1.5"><Skeleton className="h-6 w-10" /><Skeleton className="h-3 w-16" /></div></div></CardContent></Card>
            ))
          ) : (
            stats.map((s) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <Card className="glass-card-themed">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <s.icon className={`h-8 w-8 ${s.color}`} />
                      <div>
                        <p className="text-2xl font-bold"><AnimatedCounter value={s.value} /></p>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          {quickActions.map((a) => (
            <Button key={a.label} asChild variant="outline" size="sm" className="gap-2">
              <Link to={a.href}><a.icon className="h-4 w-4" /> {a.label}</Link>
            </Button>
          ))}
        </div>

        {/* Achievement Badges */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Your Achievements</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {milestonesDef.map((m) => {
                const earned = earnedSet.has(m.key);
                return (
                  <Tooltip key={m.key}>
                    <TooltipTrigger asChild>
                      <div className={`flex flex-col items-center gap-1.5 min-w-[72px] p-3 rounded-xl border transition-all ${
                        earned ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30 opacity-40 grayscale"
                      }`}>
                        <div className="relative">
                          <m.icon className={`h-7 w-7 ${earned ? "text-primary" : "text-muted-foreground"}`} />
                          {earned ? (
                            <CheckCircle className="h-3.5 w-3.5 text-primary absolute -top-1 -right-1" />
                          ) : (
                            <Lock className="h-3 w-3 text-muted-foreground absolute -top-1 -right-1" />
                          )}
                        </div>
                        <span className="text-[10px] text-center font-medium leading-tight">{m.label}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {earned ? `Earned!` : "Keep going to unlock this!"}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Career tip */}
        <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm italic text-muted-foreground">{tips[tipIdx]}</p>
        </div>

        {/* Recommended Internships */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recommended for You</CardTitle>
            <p className="text-xs text-muted-foreground">Based on your skills</p>
          </CardHeader>
          <CardContent>
            {skillNames.length === 0 ? (
              <div className="py-6 text-center">
                <Zap className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">Add skills to your profile to get personalized recommendations.</p>
                <Button asChild size="sm"><Link to="/dashboard/student/profile">Add Skills</Link></Button>
              </div>
            ) : !recommended?.length ? (
              <div className="py-6 text-center">
                <Search className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">No matches yet — browse all internships.</p>
                <Button asChild size="sm"><Link to="/internships">Browse Internships</Link></Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommended.map((intern: any) => (
                  <Card key={intern.id} className="glass-card-themed">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-2 mb-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{intern.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{intern.companies?.name}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {intern.location && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <MapPin className="h-3 w-3" /> {intern.location}
                          </span>
                        )}
                        <SkillTag label={intern.work_type} />
                        {intern.stipend && <SkillTag label={intern.stipend} />}
                      </div>
                      <Button asChild size="sm" variant="outline" className="w-full text-xs">
                        <Link to={`/internships/${intern.id}`}>View & Apply</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Recent Applications</CardTitle></CardHeader>
          <CardContent>
            {!applications?.length ? (
              <div className="py-6 text-center">
                <Briefcase className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">No applications yet — your next opportunity is waiting!</p>
                <Button asChild size="sm"><Link to="/internships">Browse Internships</Link></Button>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((app: any) => (
                  <div key={app.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{app.internships?.title}</p>
                      <p className="text-xs text-muted-foreground">{app.internships?.companies?.name}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-muted capitalize">{app.status}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
