import { Layout } from "@/components/Layout";
import { PageTransition } from "@/components/PageTransition";
import { GlassCard } from "@/components/GlassCard";
import { SkillTag } from "@/components/SkillTag";
import { Input } from "@/components/ui/input";
import { Search, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

export default function Students() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");

  const { data: students, isLoading } = useQuery({
    queryKey: ["public-students"],
    queryFn: async () => {
      const { data } = await supabase
        .from("students")
        .select("id, headline, university, user_id, profiles!students_user_id_profiles_fkey(full_name, avatar_url), student_skills(skills(name))")
        .eq("available", true)
        .order("created_at", { ascending: false });
      return (data ?? []).map((s: any) => ({
        id: s.id,
        name: s.profiles?.full_name || "Student",
        headline: s.headline || "",
        university: s.university || "",
        skills: s.student_skills?.map((ss: any) => ss.skills?.name).filter(Boolean) ?? [],
        avatarUrl: s.profiles?.avatar_url,
      }));
    },
  });

  useEffect(() => {
    const nextParams = new URLSearchParams();
    const trimmedQuery = query.trim();

    if (trimmedQuery) {
      nextParams.set("q", trimmedQuery);
    }

    setSearchParams(nextParams, { replace: true });
  }, [query, setSearchParams]);

  const filtered = (students ?? []).filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.skills.some((sk: string) => sk.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <Layout>
      <PageTransition>
        <section className="container mx-auto px-4 py-12">
          <h1 className="font-heading text-3xl font-bold mb-2">Student Directory</h1>
          <p className="text-muted-foreground mb-8">Discover talented students from Rwanda's top universities.</p>

          <div className="relative max-w-md mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or skill..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-5 rounded-xl border border-border bg-card space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-32" />
                  <div className="flex gap-1.5">
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((student, i) => (
                <GlassCard key={student.id} delay={i * 0.05}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
                      <GraduationCap className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-sm">{student.name}</h3>
                      <p className="text-xs text-muted-foreground">{student.headline}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{student.university}</p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {student.skills.map((s: string) => (
                      <SkillTag key={s} label={s} />
                    ))}
                  </div>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link to={`/students/${student.id}`}>View Profile</Link>
                  </Button>
                </GlassCard>
              ))}
            </div>
          )}
          {!isLoading && filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-12">No students found matching your search.</p>
          )}
        </section>
      </PageTransition>
    </Layout>
  );
}
