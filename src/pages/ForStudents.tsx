import { Layout } from "@/components/Layout";
import { PageTransition } from "@/components/PageTransition";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Award, CheckCircle2, FileText, GraduationCap, LayoutTemplate, MessageSquareText, Rocket, Sparkles, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const benefits = [
  {
    icon: Target,
    title: "Stand out to employers",
    description: "Build a polished public profile with your headline, university background, projects, and core skills.",
  },
  {
    icon: LayoutTemplate,
    title: "Create faster with guided tools",
    description: "Use the built-in CV builder and profile prompts to turn your experience into a recruiter-ready story.",
  },
  {
    icon: Rocket,
    title: "Apply with confidence",
    description: "Track opportunities, save internships, and prepare for interviews inside the same workflow.",
  },
];

const profileSteps = [
  "Add your headline, university, field of study, and graduation year.",
  "Upload projects, portfolio links, and proof of work that shows real initiative.",
  "Tag your strongest skills so employers can discover you through the directory.",
  "Publish your profile and start applying to internships that match your goals.",
];

const successStories = [
  {
    name: "Aline, Software Engineering Student",
    outcome: "Turned a project-led profile into three interview requests in one month.",
  },
  {
    name: "Kevin, Data Science Student",
    outcome: "Used interview prep and a stronger CV to land a paid analytics internship.",
  },
  {
    name: "Diane, UI/UX Student",
    outcome: "Showcased portfolio work publicly and got discovered by a startup recruiter.",
  },
];

export default function ForStudents() {
  return (
    <Layout>
      <PageTransition>
        <section className="relative overflow-hidden">
          <div className="container mx-auto px-4 pt-20 pb-16">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mx-auto max-w-4xl text-center"
            >
              <Badge variant="secondary" className="mb-4 border border-primary/20 bg-primary/10 text-primary">
                Built for ambitious students in Rwanda
              </Badge>
              <h1 className="font-heading text-4xl font-bold tracking-tight md:text-6xl">
                Turn your potential into a profile employers can trust
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground md:text-xl">
                TalentBridge helps you package your skills, portfolio, and ambitions into a clear story that gets you noticed.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="px-6">
                  <Link to="/signup">
                    Create your student account <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="px-6">
                  <Link to="/students">Browse student profiles</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-16">
          <div className="grid gap-6 md:grid-cols-3">
            {benefits.map((benefit, index) => (
              <GlassCard key={benefit.title} delay={index * 0.05} hover={false}>
                <benefit.icon className="mb-3 h-8 w-8 text-primary" />
                <h2 className="font-heading text-xl font-semibold">{benefit.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{benefit.description}</p>
              </GlassCard>
            ))}
          </div>
        </section>

        <section className="container mx-auto grid gap-6 px-4 pb-16 lg:grid-cols-[1.2fr_0.8fr]">
          <GlassCard>
            <div className="mb-4 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-secondary" />
              <h2 className="font-heading text-2xl font-bold">How profile building works</h2>
            </div>
            <div className="space-y-4">
              {profileSteps.map((step, index) => (
                <div key={step} className="flex items-start gap-3 rounded-xl border border-border/70 bg-background/40 p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {index + 1}
                  </div>
                  <p className="text-sm text-muted-foreground">{step}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-2xl font-bold">What strong profiles include</h2>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="rounded-xl border border-border/70 bg-background/40 p-4">
                A focused headline that says what you do and what kind of internship you want.
              </div>
              <div className="rounded-xl border border-border/70 bg-background/40 p-4">
                Real projects with portfolio links, GitHub repos, and outcomes you can explain.
              </div>
              <div className="rounded-xl border border-border/70 bg-background/40 p-4">
                Skills that match employer demand across software, data, design, and business roles.
              </div>
            </div>
          </GlassCard>
        </section>

        <section className="container mx-auto grid gap-6 px-4 pb-16 lg:grid-cols-2">
          <GlassCard>
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-2xl font-bold">CV builder preview</h2>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">
              Draft a cleaner CV using the same profile data you already entered, instead of rewriting everything from scratch.
            </p>
            <div className="space-y-3 rounded-2xl border border-border/70 bg-background/40 p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Professional summary</span>
                <Badge variant="secondary">Auto-filled from profile</Badge>
              </div>
              <div className="rounded-lg bg-card p-3 text-sm text-muted-foreground">
                Skills, projects, and education are grouped into recruiter-friendly sections you can refine quickly.
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-card p-3 text-sm text-muted-foreground">Education + graduation year</div>
                <div className="rounded-lg bg-card p-3 text-sm text-muted-foreground">Projects + portfolio links</div>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="mb-4 flex items-center gap-2">
              <MessageSquareText className="h-5 w-5 text-secondary" />
              <h2 className="font-heading text-2xl font-bold">Interview prep preview</h2>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">
              Practice the questions that usually matter most: your projects, your motivation, and how you solve real problems.
            </p>
            <div className="space-y-3 rounded-2xl border border-border/70 bg-background/40 p-5">
              {[
                "Tell me about a project you are proud of.",
                "Why do you want this internship?",
                "What skills are you actively improving right now?",
              ].map((prompt) => (
                <div key={prompt} className="flex items-center gap-3 rounded-lg bg-card p-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-secondary" />
                  <span>{prompt}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </section>

        <section className="container mx-auto px-4 pb-16">
          <div className="mb-6 flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-2xl font-bold">Success stories</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {successStories.map((story, index) => (
              <GlassCard key={story.name} delay={index * 0.05}>
                <p className="font-heading text-lg font-semibold">{story.name}</p>
                <p className="mt-3 text-sm text-muted-foreground">{story.outcome}</p>
              </GlassCard>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 pb-20">
          <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-secondary/10 px-6 py-10 text-center shadow-sm">
            <h2 className="font-heading text-3xl font-bold">Build your profile before the next opportunity opens</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              The sooner your profile is complete, the easier it is for employers to discover you and for you to apply quickly.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/signup">
                  Start your profile <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/how-it-works">See the full student journey</Link>
              </Button>
            </div>
          </div>
        </section>
      </PageTransition>
    </Layout>
  );
}
