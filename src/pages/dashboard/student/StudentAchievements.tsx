import { DashboardLayout } from "@/components/DashboardLayout";
import { StudentSidebar } from "@/components/StudentSidebar";
import { AuroraBackground } from "@/components/AuroraBackground";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Lock, Sparkles, Flame, Star, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { StaggerContainer, StaggerItem } from "@/components/StaggerContainer";

const TIER_STYLES: Record<string, { ring: string; chip: string; label: string }> = {
  bronze:   { ring: "ring-amber-700/40",   chip: "bg-amber-700/15 text-amber-600 border-amber-700/30",       label: "Bronze" },
  silver:   { ring: "ring-slate-400/40",   chip: "bg-slate-400/15 text-slate-500 border-slate-400/30",       label: "Silver" },
  gold:     { ring: "ring-yellow-500/40",  chip: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",    label: "Gold" },
  platinum: { ring: "ring-cyan-400/40",    chip: "bg-cyan-400/15 text-cyan-500 border-cyan-400/30",          label: "Platinum" },
  diamond:  { ring: "ring-fuchsia-400/40", chip: "bg-fuchsia-400/15 text-fuchsia-500 border-fuchsia-400/30", label: "Diamond" },
};

function tierOf(t: string) {
  return TIER_STYLES[t.toLowerCase()] ?? TIER_STYLES.bronze;
}

function levelFromXp(xp: number) {
  // Simple progression: each level needs 100 * level XP
  let level = 1;
  let remaining = xp;
  while (remaining >= level * 100) {
    remaining -= level * 100;
    level += 1;
  }
  const needed = level * 100;
  return { level, intoLevel: remaining, needed, pct: Math.round((remaining / needed) * 100) };
}

export default function StudentAchievements() {
  const { user } = useAuth();

  const { data: achievements, isLoading: loadingAch } = useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const { data } = await supabase
        .from("achievements")
        .select("id, key, title, description, tier, icon, points")
        .order("points", { ascending: true });
      return data ?? [];
    },
  });

  const { data: unlocked, isLoading: loadingUnlocked } = useQuery({
    queryKey: ["user-achievements", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_achievements")
        .select("achievement_id, unlocked_at")
        .eq("user_id", user!.id);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: xpEvents, isLoading: loadingXp } = useQuery({
    queryKey: ["xp-events", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("xp_events")
        .select("points, event_type, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
    enabled: !!user,
  });

  const totalXp = (xpEvents ?? []).reduce((sum, e) => sum + (e.points ?? 0), 0);
  const { level, intoLevel, needed, pct } = levelFromXp(totalXp);
  const unlockedIds = new Set((unlocked ?? []).map((u) => u.achievement_id));
  const totalCount = achievements?.length ?? 0;
  const unlockedCount = unlockedIds.size;

  // Streak: consecutive days with at least one xp event
  const streak = (() => {
    if (!xpEvents || xpEvents.length === 0) return 0;
    const dayKeys = new Set(
      xpEvents.map((e) => new Date(e.created_at).toISOString().slice(0, 10))
    );
    let s = 0;
    const cursor = new Date();
    while (dayKeys.has(cursor.toISOString().slice(0, 10))) {
      s += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return s;
  })();

  const loading = loadingAch || loadingUnlocked || loadingXp;

  return (
    <DashboardLayout sidebar={<StudentSidebar />} requiredRole="student">
      <AuroraBackground intensity="subtle" />

      <div className="relative space-y-6 sm:space-y-8 max-w-6xl mx-auto">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border border-border bg-card/60 backdrop-blur-md p-5 sm:p-7"
        >
          <div className="flex items-start gap-4 flex-wrap">
            <div className="relative">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 grid place-items-center ring-2 ring-primary/40">
                <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
              </div>
              <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2">
                Lv {level}
              </Badge>
            </div>

            <div className="flex-1 min-w-[220px]">
              <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">
                Your Achievements
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Earn XP for activity, unlock badges, and climb the ranks.
              </p>
              <div className="mt-3 flex items-center gap-3 flex-wrap text-xs sm:text-sm">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <strong className="text-foreground">{totalXp.toLocaleString()}</strong> XP total
                </span>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Flame className="h-3.5 w-3.5 text-orange-500" />
                  <strong className="text-foreground">{streak}</strong> day streak
                </span>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Star className="h-3.5 w-3.5 text-yellow-500" />
                  <strong className="text-foreground">{unlockedCount}</strong> / {totalCount} unlocked
                </span>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Level {level} progress</span>
                  <span>{intoLevel} / {needed} XP</span>
                </div>
                <Progress value={pct} className="h-2" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Achievements grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg sm:text-xl font-semibold">Badge collection</h2>
            <Badge variant="outline" className="text-xs">
              {unlockedCount} of {totalCount}
            </Badge>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-2xl" />
              ))}
            </div>
          ) : (
            <StaggerContainer>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(achievements ?? []).map((a) => {
                  const isUnlocked = unlockedIds.has(a.id);
                  const tier = tierOf(a.tier);
                  return (
                    <StaggerItem key={a.id}>
                      <Card
                        className={`relative overflow-hidden transition-all duration-300 ring-1 ${tier.ring} ${
                          isUnlocked ? "bg-card hover:-translate-y-1 hover:shadow-lg" : "bg-muted/30 grayscale opacity-70"
                        }`}
                      >
                        {isUnlocked && (
                          <div
                            aria-hidden
                            className="absolute -top-12 -right-12 h-32 w-32 rounded-full blur-3xl"
                            style={{ background: "hsl(var(--primary) / 0.18)" }}
                          />
                        )}
                        <CardHeader className="relative pb-2">
                          <div className="flex items-start justify-between gap-3">
                            <div
                              className={`h-12 w-12 rounded-xl grid place-items-center text-2xl ${
                                isUnlocked
                                  ? "bg-gradient-to-br from-primary/20 to-accent/20"
                                  : "bg-muted"
                              }`}
                            >
                              {isUnlocked ? (a.icon || "🏆") : <Lock className="h-5 w-5 text-muted-foreground" />}
                            </div>
                            <Badge variant="outline" className={`text-[10px] uppercase tracking-wider ${tier.chip}`}>
                              {tier.label}
                            </Badge>
                          </div>
                          <CardTitle className="text-base mt-3">{a.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="relative">
                          <p className="text-sm text-muted-foreground line-clamp-2">{a.description}</p>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Zap className="h-3.5 w-3.5 text-primary" />
                              {a.points} XP
                            </span>
                            {isUnlocked ? (
                              <Badge className="bg-primary/15 text-primary border border-primary/30 text-[10px]">
                                Unlocked
                              </Badge>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">Locked</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </StaggerItem>
                  );
                })}
              </div>
            </StaggerContainer>
          )}
        </div>

        {/* Recent XP events */}
        <div>
          <h2 className="font-heading text-lg sm:text-xl font-semibold mb-4">Recent activity</h2>
          {loadingXp ? (
            <Skeleton className="h-32 rounded-2xl" />
          ) : (xpEvents ?? []).length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No XP yet — apply to internships, complete your profile, or post a project to start earning.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0 divide-y divide-border">
                {xpEvents!.slice(0, 10).map((e, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3 text-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 grid place-items-center shrink-0">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium capitalize truncate">
                          {e.event_type.replace(/_/g, " ")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(e.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-primary/15 text-primary border border-primary/30">
                      +{e.points} XP
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
