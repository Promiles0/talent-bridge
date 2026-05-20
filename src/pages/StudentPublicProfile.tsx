import { Layout } from "@/components/Layout";
import { PageTransition } from "@/components/PageTransition";
import { SkillTag } from "@/components/SkillTag";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { Github, Linkedin, Globe, ExternalLink, MapPin, GraduationCap, ArrowLeft, Download, Mail, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { StaggerContainer, StaggerItem } from "@/components/StaggerContainer";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

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
  const avatarUrl = profile?.avatar_url
    ? profile.avatar_url.startsWith("http")
      ? profile.avatar_url
      : `${SUPABASE_URL}/storage/v1/object/public/avatars/${profile.avatar_url}`
    : null;
  const initials = fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  // Group skills by category
  const skillsByCategory = skills?.reduce((acc: Record<string, string[]>, s: any) => {
    const cat = s.skills?.category || "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s.skills?.name ?? "Skill");
    return acc;
  }, {} as Record<string, string[]>) ?? {};

  const socialLinks = [
    { url: student.github_url, icon: Github, label: "GitHub" },
    { url: student.linkedin_url, icon: Linkedin, label: "LinkedIn" },
    { url: student.portfolio_url, icon: Globe, label: "Portfolio" },
  ].filter(l => l.url);

  const downloadCV = async () => {
    if (!student.cv_url) return;
    const { data } = await supabase.storage.from("cvs").createSignedUrl(student.cv_url, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  return (
    <Layout>
      <PageTransition>
        <div className="relative">
          {/* Hero gradient header */}
          <div className="h-48 sm:h-56 bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/5 dark:from-primary/15 dark:via-secondary/8 dark:to-transparent relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
              <div className="absolute inset-0" style={{
                backgroundImage: "radial-gradient(hsl(160 84% 50%) 1px, transparent 1px)",
                backgroundSize: "24px 24px"
              }} />
            </div>
          </div>

          <section className="container mx-auto px-4 max-w-4xl -mt-20 relative z-10 pb-16">
            <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
              <Link to="/students"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Students</Link>
            </Button>

            {/* Profile Hero Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="glass-card-themed rounded-2xl p-6 sm:p-8"
            >
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="relative">
                  <Avatar className="h-28 w-28 ring-4 ring-background shadow-xl">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
                    <AvatarFallback className="text-3xl bg-primary/10 text-primary font-heading font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  {student.available && (
                    <div className="absolute -bottom-1 -right-1 flex items-center gap-1 bg-card border border-border rounded-full px-2 py-0.5">
                      <motion.div
                        className="h-2 w-2 rounded-full bg-green-500"
                        animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <span className="text-[10px] font-medium text-green-600 dark:text-green-400">Available</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 text-center sm:text-left min-w-0">
                  <h1 className="font-heading text-2xl sm:text-3xl font-bold flex items-center gap-2 justify-center sm:justify-start">{fullName} <VerifiedBadge verified={(student as any).verified} kind="student" size="lg" /></h1>
                  {student.headline && <p className="text-muted-foreground mt-1 text-lg">{student.headline}</p>}
                  <div className="flex flex-wrap gap-3 mt-3 justify-center sm:justify-start">
                    {student.university && (
                      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                        <GraduationCap className="h-4 w-4 text-primary" /> {student.university}
                      </span>
                    )}
                    {student.field_of_study && (
                      <Badge variant="secondary" className="text-xs">{student.field_of_study}</Badge>
                    )}
                    {student.graduation_year && (
                      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" /> Class of {student.graduation_year}
                      </span>
                    )}
                  </div>

                  {/* Action buttons + Social links */}
                  <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
                    {student.cv_url && (
                      <Button onClick={downloadCV} size="sm" className="gap-1.5 btn-ripple">
                        <Download className="h-4 w-4" /> Download CV
                      </Button>
                    )}
                    {socialLinks.map(({ url, icon: Icon, label }) => (
                      <Button key={label} asChild variant="outline" size="sm" className="gap-1.5 group">
                        <a href={url!} target="_blank" rel="noopener noreferrer">
                          <Icon className="h-4 w-4 group-hover:text-primary transition-colors" />
                          <span className="hidden sm:inline">{label}</span>
                        </a>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* About */}
            {student.bio && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-6"
              >
                <Card className="glass-card-themed rounded-xl overflow-hidden">
                  <CardContent className="p-6">
                    <h2 className="font-heading font-semibold text-lg mb-3">About</h2>
                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{student.bio}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Skills */}
            {skills && skills.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="mt-6"
              >
                <h2 className="font-heading font-semibold text-lg mb-3">Skills</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
                    <Card key={category} className="glass-card-themed rounded-xl">
                      <CardContent className="p-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">{category}</p>
                        <div className="flex flex-wrap gap-2">
                          {(categorySkills as string[]).map((skill: string, idx: number) => (
                            <motion.div
                              key={skill}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.3 + idx * 0.04 }}
                              whileHover={{ scale: 1.08 }}
                            >
                              <Badge variant="secondary" className="hover:shadow-[0_0_10px_hsl(var(--primary)/0.3)] transition-shadow cursor-default">
                                {skill}
                              </Badge>
                            </motion.div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Projects — Bento Grid */}
            {projects && projects.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="mt-8"
              >
                <h2 className="font-heading font-semibold text-lg mb-4">Projects</h2>
                <StaggerContainer className={`grid gap-4 ${
                  projects.length === 1 ? "grid-cols-1" :
                  projects.length === 2 ? "grid-cols-1 sm:grid-cols-2" :
                  "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                }`}>
                  {projects.map((project: any, idx: number) => (
                    <StaggerItem key={project.id} className={idx === 0 && projects.length >= 3 ? "sm:col-span-2 lg:col-span-1" : ""}>
                      <motion.div
                        whileHover={{ y: -4, scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <Card className="glass-card-themed rounded-xl overflow-hidden h-full group">
                          {project.cover_image_url && (
                            <div className="h-36 overflow-hidden">
                              <img
                                src={project.cover_image_url}
                                alt={project.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                          )}
                          <CardContent className="p-5">
                            <h3 className="font-heading font-semibold text-base mb-1">{project.title}</h3>
                            {project.description && (
                              <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{project.description}</p>
                            )}
                            {project.tags && project.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-3">
                                {project.tags.map((tag: string) => (
                                  <SkillTag key={tag} label={tag} />
                                ))}
                              </div>
                            )}
                            <div className="flex gap-2">
                              {project.project_url && (
                                <Button asChild variant="outline" size="sm" className="gap-1">
                                  <a href={project.project_url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3 w-3" /> Live
                                  </a>
                                </Button>
                              )}
                              {project.repo_url && (
                                <Button asChild variant="outline" size="sm" className="gap-1">
                                  <a href={project.repo_url} target="_blank" rel="noopener noreferrer">
                                    <Github className="h-3 w-3" /> Code
                                  </a>
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </motion.div>
            )}

            {/* Contact links */}
            {socialLinks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="mt-8"
              >
                <h2 className="font-heading font-semibold text-lg mb-3">Connect</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {socialLinks.map(({ url, icon: Icon, label }) => (
                    <a
                      key={label}
                      href={url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-card-themed rounded-xl p-4 flex items-center gap-3 card-hover group"
                    >
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{label}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{url}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </motion.div>
            )}
          </section>
        </div>
      </PageTransition>
    </Layout>
  );
}
