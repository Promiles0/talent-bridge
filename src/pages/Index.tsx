import { Layout } from "@/components/Layout";
import { PageTransition } from "@/components/PageTransition";
import { GlassCard } from "@/components/GlassCard";
import { SkillTag } from "@/components/SkillTag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Briefcase, Users, ArrowRight, MapPin, Building2, GraduationCap } from "lucide-react";
import { TypewriterEffect } from "@/components/TypewriterEffect";
import { SkillsShowcase } from "@/components/SkillsShowcase";
import { ContactForm } from "@/components/ContactForm";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { KeyboardEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const valueProps = [
  { icon: GraduationCap, title: "For Students", desc: "Showcase your skills, build your portfolio, and land your dream internship." },
  { icon: Building2, title: "For Employers", desc: "Access Rwanda's top student talent. Post internships and hire with confidence." },
  { icon: Users, title: "Community", desc: "Join a growing network of students and companies shaping Rwanda's future." },
];

export default function Index() {
  const navigate = useNavigate();
  const [internshipQuery, setInternshipQuery] = useState("");
  const [studentQuery, setStudentQuery] = useState("");

  const { data: featuredInternships, isLoading: loadingInternships } = useQuery({
    queryKey: ["featured-internships"],
    queryFn: async () => {
      const { data } = await supabase
        .from("internships")
        .select("id, title, location, work_type, stipend, companies(name)")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(3);
      return (data ?? []).map((i: any) => ({
        id: i.id,
        title: i.title,
        company: i.companies?.name || "Company",
        location: i.location || "Rwanda",
        type: i.work_type,
        stipend: i.stipend,
      }));
    },
  });

  const { data: featuredStudents, isLoading: loadingStudents } = useQuery({
    queryKey: ["featured-students"],
    queryFn: async () => {
      const { data } = await supabase
        .from("students")
        .select("id, headline, university, profiles!students_user_id_profiles_fkey(full_name), student_skills(skills(name))")
        .eq("available", true)
        .order("created_at", { ascending: false })
        .limit(3);
      return (data ?? []).map((s: any) => ({
        id: s.id,
        name: s.profiles?.full_name || "Student",
        headline: s.headline || "",
        university: s.university || "",
        skills: s.student_skills?.map((ss: any) => ss.skills?.name).filter(Boolean) ?? [],
      }));
    },
  });

  const CardSkeleton = () => (
    <div className="p-5 rounded-xl border border-border bg-card space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-full" />
    </div>
  );

  const handleInternshipSearch = () => {
    const query = internshipQuery.trim();
    navigate(query ? `/internships?q=${encodeURIComponent(query)}` : "/internships");
  };

  const handleStudentSearch = () => {
    const query = studentQuery.trim();
    navigate(query ? `/students?q=${encodeURIComponent(query)}` : "/students");
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>, searchType: "internships" | "students") => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    if (searchType === "internships") {
      handleInternshipSearch();
      return;
    }

    handleStudentSearch();
  };

  return (
    <Layout>
      <PageTransition>
        {/* Hero */}
        <section className="relative container mx-auto px-4 pt-20 pb-16 text-center section-hero">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}>
            <h1 className="font-heading text-4xl md:text-6xl font-bold tracking-tight mb-4">
              Discover <TypewriterEffect />
              <br />
              in <span className="text-secondary">Rwanda</span>
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10">
              Rwanda's career network for students and employers. Find internships, showcase your skills, and build your future.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="flex flex-col gap-3 max-w-3xl mx-auto mb-6">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search internships..."
                  value={internshipQuery}
                  onChange={(event) => setInternshipQuery(event.target.value)}
                  onKeyDown={(event) => handleSearchKeyDown(event, "internships")}
                  className="pl-9 h-12 bg-card"
                />
              </div>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={studentQuery}
                  onChange={(event) => setStudentQuery(event.target.value)}
                  onKeyDown={(event) => handleSearchKeyDown(event, "students")}
                  className="pl-9 h-12 bg-card"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button size="lg" className="h-12 px-6" onClick={handleInternshipSearch}>
                <Search className="h-4 w-4 mr-2" /> Search internships
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-6" onClick={handleStudentSearch}>
                <Users className="h-4 w-4 mr-2" /> Search students
              </Button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }} className="flex justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" variant="outline" className="hover-scale">
                Join as Student <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="lg" variant="outline" className="border-secondary/30 text-secondary hover:bg-secondary/10 hover-scale">
                Post an Internship <Briefcase className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </section>

        {/* Value props */}
        <section className="relative container mx-auto px-4 pb-16 section-features">
          <div className="grid md:grid-cols-3 gap-6">
            {valueProps.map((vp, i) => (
              <GlassCard key={vp.title} delay={i * 0.05} hover={false}>
                <vp.icon className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-heading text-lg font-semibold mb-2">{vp.title}</h3>
                <p className="text-sm text-muted-foreground">{vp.desc}</p>
              </GlassCard>
            ))}
          </div>
        </section>

        <SkillsShowcase />

        {/* Featured internships */}
        <section className="relative container mx-auto px-4 pb-16 section-listings">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-2xl font-bold">Featured Internships</h2>
            <Link to="/internships" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {loadingInternships
              ? Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
              : (featuredInternships ?? []).length === 0
              ? <p className="col-span-3 text-center text-muted-foreground py-8">No internships posted yet. Be the first!</p>
              : (featuredInternships ?? []).map((intern, i) => (
                <GlassCard key={intern.id} delay={i * 0.05}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <Link to={`/internships/${intern.id}`} className="font-heading font-semibold text-sm hover:text-primary transition-colors">{intern.title}</Link>
                      <p className="text-xs text-muted-foreground">{intern.company}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {intern.location}
                    </span>
                    <SkillTag label={intern.type} />
                    {intern.stipend && <SkillTag label={intern.stipend} />}
                  </div>
                  <Button asChild size="sm" className="w-full">
                    <Link to="/internships">View</Link>
                  </Button>
                </GlassCard>
              ))}
          </div>
        </section>

        {/* Featured students */}
        <section className="relative container mx-auto px-4 pb-16 section-students">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-2xl font-bold">Featured Students</h2>
            <Link to="/students" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {loadingStudents
              ? Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
              : (featuredStudents ?? []).length === 0
              ? <p className="col-span-3 text-center text-muted-foreground py-8">No students have joined yet.</p>
              : (featuredStudents ?? []).map((student, i) => (
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
                  <div className="flex flex-wrap gap-1.5">
                    {student.skills.map((s: string) => (
                      <SkillTag key={s} label={s} />
                    ))}
                  </div>
                </GlassCard>
              ))}
          </div>
        </section>

        <ContactForm />
      </PageTransition>
    </Layout>
  );
}
