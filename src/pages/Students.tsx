import { Layout } from "@/components/Layout";
import { PageTransition } from "@/components/PageTransition";
import { GlassCard } from "@/components/GlassCard";
import { SkillTag } from "@/components/SkillTag";
import { Input } from "@/components/ui/input";
import { Search, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function Students() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [universityFilter, setUniversityFilter] = useState(() => searchParams.get("university") ?? "all");
  const [fieldFilter, setFieldFilter] = useState(() => searchParams.get("field") ?? "all");
  const [graduationYearFilter, setGraduationYearFilter] = useState(() => searchParams.get("graduationYear") ?? "all");
  const [availabilityFilter, setAvailabilityFilter] = useState(() => searchParams.get("availability") ?? "all");
  const [skillFilter, setSkillFilter] = useState(() => searchParams.get("skill") ?? "all");

  const { data: students, isLoading } = useQuery({
    queryKey: ["public-students"],
    queryFn: async () => {
      const { data } = await supabase
        .from("students")
        .select("id, available, field_of_study, graduation_year, headline, university, user_id, profiles!students_user_id_profiles_fkey(full_name, avatar_url), student_skills(skills(name))")
        .order("created_at", { ascending: false });
      return (data ?? []).map((s: any) => ({
        id: s.id,
        available: s.available,
        fieldOfStudy: s.field_of_study || "",
        graduationYear: s.graduation_year,
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
    if (universityFilter !== "all") {
      nextParams.set("university", universityFilter);
    }
    if (fieldFilter !== "all") {
      nextParams.set("field", fieldFilter);
    }
    if (graduationYearFilter !== "all") {
      nextParams.set("graduationYear", graduationYearFilter);
    }
    if (availabilityFilter !== "all") {
      nextParams.set("availability", availabilityFilter);
    }
    if (skillFilter !== "all") {
      nextParams.set("skill", skillFilter);
    }

    setSearchParams(nextParams, { replace: true });
  }, [availabilityFilter, fieldFilter, graduationYearFilter, query, setSearchParams, skillFilter, universityFilter]);

  const universities = useMemo(() => [...new Set(students?.map((student) => student.university).filter(Boolean) ?? [])], [students]);
  const fields = useMemo(() => [...new Set(students?.map((student) => student.fieldOfStudy).filter(Boolean) ?? [])], [students]);
  const graduationYears = useMemo(() => [...new Set(students?.map((student) => student.graduationYear).filter(Boolean) ?? [])].sort((left, right) => Number(right) - Number(left)), [students]);
  const topSkills = useMemo(() => {
    const counts = new Map<string, number>();

    for (const student of students ?? []) {
      for (const skill of student.skills) {
        counts.set(skill, (counts.get(skill) ?? 0) + 1);
      }
    }

    return [...counts.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 8)
      .map(([skill]) => skill);
  }, [students]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();

    return (students ?? []).filter((student) => {
      const matchesQuery =
        !normalizedQuery ||
        student.name.toLowerCase().includes(normalizedQuery) ||
        student.skills.some((skill: string) => skill.toLowerCase().includes(normalizedQuery));
      const matchesUniversity = universityFilter === "all" || student.university === universityFilter;
      const matchesField = fieldFilter === "all" || student.fieldOfStudy === fieldFilter;
      const matchesGraduationYear = graduationYearFilter === "all" || String(student.graduationYear) === graduationYearFilter;
      const matchesAvailability =
        availabilityFilter === "all" ||
        (availabilityFilter === "available" && student.available) ||
        (availabilityFilter === "unavailable" && !student.available);
      const matchesSkill = skillFilter === "all" || student.skills.includes(skillFilter);

      return matchesQuery && matchesUniversity && matchesField && matchesGraduationYear && matchesAvailability && matchesSkill;
    });
  }, [availabilityFilter, fieldFilter, graduationYearFilter, query, skillFilter, students, universityFilter]);

  return (
    <Layout>
      <PageTransition>
        <section className="container mx-auto px-4 py-12">
          <h1 className="font-heading text-3xl font-bold mb-2">Student Directory</h1>
          <p className="text-muted-foreground mb-8">Discover talented students from Rwanda's top universities.</p>

          <div className="grid gap-3 mb-8 md:grid-cols-2 xl:grid-cols-3">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or skill..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 bg-card"
              />
            </div>
            <Select value={universityFilter} onValueChange={setUniversityFilter}>
              <SelectTrigger className="bg-card">
                <SelectValue placeholder="University" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All universities</SelectItem>
                {universities.map((university) => (
                  <SelectItem key={university} value={university}>{university}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={fieldFilter} onValueChange={setFieldFilter}>
              <SelectTrigger className="bg-card">
                <SelectValue placeholder="Field of study" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All fields</SelectItem>
                {fields.map((field) => (
                  <SelectItem key={field} value={field}>{field}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={graduationYearFilter} onValueChange={setGraduationYearFilter}>
              <SelectTrigger className="bg-card">
                <SelectValue placeholder="Graduation year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All years</SelectItem>
                {graduationYears.map((year) => (
                  <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
              <SelectTrigger className="bg-card">
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All students</SelectItem>
                <SelectItem value="available">Open to internships</SelectItem>
                <SelectItem value="unavailable">Not currently available</SelectItem>
              </SelectContent>
            </Select>
            <Select value={skillFilter} onValueChange={setSkillFilter}>
              <SelectTrigger className="bg-card">
                <SelectValue placeholder="Top skills" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All skills</SelectItem>
                {topSkills.map((skill) => (
                  <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                  <div className="mb-3 flex flex-wrap gap-2">
                    {student.university && <p className="text-xs text-muted-foreground">{student.university}</p>}
                    {student.fieldOfStudy && <Badge variant="secondary" className="text-[11px]">{student.fieldOfStudy}</Badge>}
                    {student.graduationYear && <Badge variant="outline" className="text-[11px]">Class of {student.graduationYear}</Badge>}
                    <Badge variant={student.available ? "secondary" : "outline"} className="text-[11px]">
                      {student.available ? "Open to internships" : "Not available"}
                    </Badge>
                  </div>
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
