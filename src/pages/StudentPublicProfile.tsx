import { Layout } from "@/components/Layout";
import { PageTransition } from "@/components/PageTransition";
import { GlassCard } from "@/components/GlassCard";
import { SkillTag } from "@/components/SkillTag";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { Github, Linkedin, Globe, ExternalLink, MapPin, GraduationCap, ArrowLeft } from "lucide-react";

export default function StudentPublicProfile() {
  const { studentId } = useParams<{ studentId: string }>();

  const { data: student, isLoading } = useQuery({
    queryKey: ["public-student", studentId],
    queryFn: async () => {
      const { data } = await supabase
        .from("students")
        .select("*, profiles!students_user_id_profiles_fkey(full_name, avatar_url)")
        .eq("id", studentId!)
        .maybeSingle();
      return data;
    },
    enabled: !!studentId,
  });

  const { data: skills } = useQuery({
    queryKey: ["student-skills", studentId],
    queryFn: async () => {
      const { data } = await supabase
        .from("student_skills")
        .select("skills(name, category)")
        .eq("student_id", studentId!);
      return data ?? [];
    },
    enabled: !!studentId,
  });

  const { data: projects } = useQuery({
    queryKey: ["student-projects-public", studentId],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("student_id", studentId!)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!studentId,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </Layout>
    );
  }

  if (!student) {
    return (
      <Layout>
        <PageTransition>
          <section className="container mx-auto px-4 py-20 text-center">
            <h1 className="font-heading text-2xl font-bold mb-2">Student Not Found</h1>
            <p className="text-muted-foreground mb-4">This profile doesn't exist or has been removed.</p>
            <Button asChild variant="outline"><Link to="/students"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link></Button>
          </section>
        </PageTransition>
      </Layout>
    );
  }

  const profile = student.profiles as any;
  const fullName = profile?.full_name || "Student";
  const avatarUrl = profile?.avatar_url;
  const initials = fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Layout>
      <PageTransition>
        <section className="container mx-auto px-4 py-12 max-w-3xl">
          <Button asChild variant="ghost" size="sm" className="mb-6">
            <Link to="/students"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Students</Link>
          </Button>

          <GlassCard>
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <Avatar className="h-24 w-24">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <h1 className="font-heading text-2xl font-bold">{fullName}</h1>
                {student.headline && <p className="text-muted-foreground mt-1">{student.headline}</p>}
                <div className="flex flex-wrap gap-3 mt-3 justify-center sm:justify-start">
                  {student.university && (
                    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                      <GraduationCap className="h-4 w-4" /> {student.university}
                    </span>
                  )}
                  {student.field_of_study && (
                    <span className="text-sm text-muted-foreground">· {student.field_of_study}</span>
                  )}
                  {student.graduation_year && (
                    <span className="text-sm text-muted-foreground">· Class of {student.graduation_year}</span>
                  )}
                </div>
                <div className="flex gap-2 mt-3 justify-center sm:justify-start">
                  {student.available && <Badge className="bg-green-100 text-green-700">Available</Badge>}
                  {student.github_url && (
                    <Button asChild variant="outline" size="sm">
                      <a href={student.github_url} target="_blank" rel="noopener noreferrer"><Github className="h-4 w-4" /></a>
                    </Button>
                  )}
                  {student.linkedin_url && (
                    <Button asChild variant="outline" size="sm">
                      <a href={student.linkedin_url} target="_blank" rel="noopener noreferrer"><Linkedin className="h-4 w-4" /></a>
                    </Button>
                  )}
                  {student.portfolio_url && (
                    <Button asChild variant="outline" size="sm">
                      <a href={student.portfolio_url} target="_blank" rel="noopener noreferrer"><Globe className="h-4 w-4" /></a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>

          {student.bio && (
            <Card className="mt-6">
              <CardContent className="py-4">
                <h2 className="font-heading font-semibold mb-2">About</h2>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{student.bio}</p>
              </CardContent>
            </Card>
          )}

          {skills && skills.length > 0 && (
            <Card className="mt-4">
              <CardContent className="py-4">
                <h2 className="font-heading font-semibold mb-3">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s: any, idx: number) => (
                    <SkillTag key={idx} label={s.skills?.name ?? "Skill"} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {projects && projects.length > 0 && (
            <div className="mt-6">
              <h2 className="font-heading font-semibold text-lg mb-3">Projects</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {projects.map((project: any) => (
                  <Card key={project.id}>
                    <CardContent className="py-4">
                      <h3 className="font-heading font-semibold text-sm">{project.title}</h3>
                      {project.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{project.description}</p>
                      )}
                      {project.tags && project.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {project.tags.map((tag: string) => (
                            <SkillTag key={tag} label={tag} />
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2 mt-3">
                        {project.project_url && (
                          <Button asChild variant="outline" size="sm">
                            <a href={project.project_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3 mr-1" /> Live
                            </a>
                          </Button>
                        )}
                        {project.repo_url && (
                          <Button asChild variant="outline" size="sm">
                            <a href={project.repo_url} target="_blank" rel="noopener noreferrer">
                              <Github className="h-3 w-3 mr-1" /> Code
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </section>
      </PageTransition>
    </Layout>
  );
}
