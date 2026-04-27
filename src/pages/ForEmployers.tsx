import { Layout } from "@/components/Layout";
import { PageTransition } from "@/components/PageTransition";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BarChart3, BriefcaseBusiness, Building2, CheckCircle2, LayoutDashboard, LineChart, SearchCheck, ShieldCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const reasons = [
  {
    icon: Users,
    title: "Reach student talent early",
    description: "Discover motivated candidates before they hit crowded job boards or disappear into generic applicant pools.",
  },
  {
    icon: ShieldCheck,
    title: "Hire with more context",
    description: "Review skills, projects, CVs, and public student profiles in one place instead of relying on resumes alone.",
  },
  {
    icon: BarChart3,
    title: "Track hiring momentum",
    description: "See internship performance, monitor pipeline activity, and improve how your opportunities convert.",
  },
];

const pipelineSteps = [
  "Set up a branded company profile that explains who you are and why students should care.",
  "Post internships with role details, stipend information, work type, and clear timelines.",
  "Review applicants, shortlist strong profiles, and move faster with better context.",
  "Manage messaging, applications, and analytics from the employer dashboard.",
];

const analyticsSignals = [
  "Views per internship",
  "Application volume over time",
  "Top-performing postings",
  "Student response and pipeline health",
];

export default function ForEmployers() {
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
              <Badge variant="secondary" className="mb-4 border border-secondary/20 bg-secondary/10 text-secondary">
                Built for modern internship hiring
              </Badge>
              <h1 className="font-heading text-4xl font-bold tracking-tight md:text-6xl">
                Hire student talent through a workflow built for clarity
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground md:text-xl">
                TalentBridge helps employers showcase their brand, post internships, review strong candidates, and manage hiring in one streamlined flow.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="px-6">
                  <Link to="/signup">
                    Create employer account <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="px-6">
                  <Link to="/internships">Explore live internships</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-16">
          <div className="grid gap-6 md:grid-cols-3">
            {reasons.map((reason, index) => (
              <GlassCard key={reason.title} delay={index * 0.05} hover={false}>
                <reason.icon className="mb-3 h-8 w-8 text-secondary" />
                <h2 className="font-heading text-xl font-semibold">{reason.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{reason.description}</p>
              </GlassCard>
            ))}
          </div>
        </section>

        <section className="container mx-auto grid gap-6 px-4 pb-16 lg:grid-cols-[1.1fr_0.9fr]">
          <GlassCard>
            <div className="mb-4 flex items-center gap-2">
              <SearchCheck className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-2xl font-bold">Talent pipeline overview</h2>
            </div>
            <div className="space-y-4">
              {pipelineSteps.map((step, index) => (
                <div key={step} className="flex items-start gap-3 rounded-xl border border-border/70 bg-background/40 p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-sm font-semibold text-secondary">
                    {index + 1}
                  </div>
                  <p className="text-sm text-muted-foreground">{step}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-2xl font-bold">Company profile + posting flow</h2>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="rounded-xl border border-border/70 bg-background/40 p-4">
                Add your logo, company description, and website so every listing feels credible.
              </div>
              <div className="rounded-xl border border-border/70 bg-background/40 p-4">
                Publish internships with stipend, work type, duration, and application deadlines.
              </div>
              <div className="rounded-xl border border-border/70 bg-background/40 p-4">
                Surface active roles through public discovery pages and your future employer-facing landing experience.
              </div>
            </div>
          </GlassCard>
        </section>

        <section className="container mx-auto grid gap-6 px-4 pb-16 lg:grid-cols-2">
          <GlassCard>
            <div className="mb-4 flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-2xl font-bold">Employer dashboard snapshot</h2>
            </div>
            <div className="space-y-3 rounded-2xl border border-border/70 bg-background/40 p-5">
              <div className="flex items-center justify-between rounded-lg bg-card p-3 text-sm">
                <span>Open internships</span>
                <Badge variant="secondary">Manage listings</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-card p-3 text-sm">
                <span>Applications in review</span>
                <Badge variant="secondary">Shortlist faster</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-card p-3 text-sm">
                <span>Messages and follow-up</span>
                <Badge variant="secondary">Keep candidates warm</Badge>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="mb-4 flex items-center gap-2">
              <LineChart className="h-5 w-5 text-secondary" />
              <h2 className="font-heading text-2xl font-bold">Analytics preview</h2>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">
              Use employer analytics to understand which postings attract the right candidates and where your process slows down.
            </p>
            <div className="space-y-3 rounded-2xl border border-border/70 bg-background/40 p-5">
              {analyticsSignals.map((signal) => (
                <div key={signal} className="flex items-center gap-3 rounded-lg bg-card p-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-secondary" />
                  <span>{signal}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </section>

        <section className="container mx-auto px-4 pb-20">
          <div className="rounded-3xl border border-secondary/20 bg-gradient-to-br from-secondary/10 via-background to-primary/10 px-6 py-10 text-center shadow-sm">
            <h2 className="font-heading text-3xl font-bold">Start posting internships with a stronger employer story</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Make it easier for talented students to trust your brand, understand your roles, and apply quickly.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/signup">
                  Post your first internship <BriefcaseBusiness className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/how-it-works">See the hiring flow</Link>
              </Button>
            </div>
          </div>
        </section>
      </PageTransition>
    </Layout>
  );
}
