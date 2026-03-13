import { DashboardLayout } from "@/components/DashboardLayout";
import { StudentSidebar } from "@/components/StudentSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, FolderKanban, Eye, CheckCircle, Search, UserCog, Plus, MessageSquare, Lightbulb } from "lucide-react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

function AnimatedCounter({ value }: { value: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(count, value, { duration: 1, ease: "easeOut" });
    return controls.stop;
  }, [value, count]);

  useEffect(() => {
    return rounded.on("change", (v) => {
      if (ref.current) ref.current.textContent = String(v);
    });
  }, [rounded]);

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
      const { data } = await supabase.from("student_skills").select("skill_id").eq("student_id", student!.id);
      return data ?? [];
    },
    enabled: !!student,
  });

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
    { label: "Profile Views", value: 0, icon: Eye, color: "text-primary" },
    { label: "Shortlisted", value: applications?.filter(a => a.status === "shortlisted").length ?? 0, icon: CheckCircle, color: "text-secondary" },
  ];

  return (
    <DashboardLayout sidebar={<StudentSidebar />} requiredRole="student">
      <div className="space-y-6">
        {/* Welcome banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-gradient-to-r from-primary/10 via-secondary/5 to-transparent p-6 border border-primary/10"
        >
          <h1 className="font-heading text-2xl font-bold">
            Welcome back, {profile?.full_name || "Student"} 👋
          </h1>
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
              <Card key={i}><CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-6 w-10" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </CardContent></Card>
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
              <Link to={a.href}>
                <a.icon className="h-4 w-4" /> {a.label}
              </Link>
            </Button>
          ))}
        </div>

        {/* Career tip */}
        <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm italic text-muted-foreground">{tips[tipIdx]}</p>
        </div>

        {/* Recent Applications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Applications</CardTitle>
          </CardHeader>
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
