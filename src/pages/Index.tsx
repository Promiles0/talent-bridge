import { Layout } from "@/components/Layout";
import { PageTransition } from "@/components/PageTransition";
import { GlassCard } from "@/components/GlassCard";
import { SkillTag } from "@/components/SkillTag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Briefcase, Users, ArrowRight, MapPin, Building2, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";

const featuredInternships = [
  { id: 1, title: "Frontend Developer Intern", company: "Irembo", location: "Kigali", type: "Hybrid", stipend: "150,000 RWF/mo" },
  { id: 2, title: "Data Analyst Intern", company: "Bank of Kigali", location: "Kigali", type: "On-site", stipend: "200,000 RWF/mo" },
  { id: 3, title: "UI/UX Design Intern", company: "Andela", location: "Remote", type: "Remote", stipend: null },
];

const featuredStudents = [
  { id: 1, name: "Aline Uwase", headline: "Full-Stack Developer", university: "University of Rwanda", skills: ["React", "Node.js", "Python"] },
  { id: 2, name: "Jean Claude M.", headline: "Data Scientist", university: "CMU Africa", skills: ["Python", "SQL", "Machine Learning"] },
  { id: 3, name: "Grace Ingabire", headline: "Product Designer", university: "ALU", skills: ["Figma", "UI/UX", "Research"] },
];

const valueProps = [
  { icon: GraduationCap, title: "For Students", desc: "Showcase your skills, build your portfolio, and land your dream internship." },
  { icon: Building2, title: "For Employers", desc: "Access Rwanda's top student talent. Post internships and hire with confidence." },
  { icon: Users, title: "Community", desc: "Join a growing network of students and companies shaping Rwanda's future." },
];

export default function Index() {
  return (
    <Layout>
      <PageTransition>
        {/* Hero */}
        <section className="relative container mx-auto px-4 pt-20 pb-16 text-center section-hero">
          <h1 className="font-heading text-4xl md:text-6xl font-bold tracking-tight mb-4">
            Connect <span className="text-primary">Talent</span> with{" "}
            <span className="text-secondary">Opportunity</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Rwanda's career network for students and employers. Find internships, showcase your skills, and build your future.
          </p>

          {/* Dual search */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search internships..." className="pl-9 h-12 bg-card" />
            </div>
            <div className="relative flex-1">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search students..." className="pl-9 h-12 bg-card" />
            </div>
            <Button size="lg" className="h-12 px-6">
              <Search className="h-4 w-4 mr-2" /> Search
            </Button>
          </div>

          <div className="flex justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" variant="outline">
                Join as Student <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="lg" variant="outline" className="border-secondary/30 text-secondary hover:bg-secondary/10">
                Post an Internship <Briefcase className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
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

        {/* Featured internships */}
        <section className="relative container mx-auto px-4 pb-16 section-listings">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-2xl font-bold">Featured Internships</h2>
            <Link to="/internships" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {featuredInternships.map((intern, i) => (
              <GlassCard key={intern.id} delay={i * 0.05}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-sm">{intern.title}</h3>
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
                <Button size="sm" className="w-full">Apply</Button>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Featured students */}
        <section className="relative container mx-auto px-4 pb-20 section-students">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-2xl font-bold">Featured Students</h2>
            <Link to="/students" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {featuredStudents.map((student, i) => (
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
                  {student.skills.map((s) => (
                    <SkillTag key={s} label={s} />
                  ))}
                </div>
              </GlassCard>
            ))}
          </div>
        </section>
      </PageTransition>
    </Layout>
  );
}
