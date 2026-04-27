import { Layout } from "@/components/Layout";
import { PageTransition } from "@/components/PageTransition";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BookOpenText, BriefcaseBusiness, FileText, MessageSquareText, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const resourceCollections = [
  {
    title: "Student growth guides",
    icon: FileText,
    description: "Practical advice for profiles, CVs, portfolios, and internship applications.",
    links: ["Build a stronger student profile", "Turn projects into proof of skill", "Prepare for internship interviews"],
  },
  {
    title: "Employer hiring playbooks",
    icon: BriefcaseBusiness,
    description: "Tips for writing clearer internships, attracting better-fit talent, and responding faster.",
    links: ["Write internship briefs students understand", "Review portfolios beyond the CV", "Create a faster shortlist flow"],
  },
  {
    title: "Platform walkthroughs",
    icon: MessageSquareText,
    description: "A growing set of short guides to help both sides make better use of TalentBridge.",
    links: ["How TalentBridge works", "Make your dashboard work harder", "Know what to improve next"],
  },
];

export default function Resources() {
  return (
    <Layout>
      <PageTransition>
        <section className="container mx-auto px-4 pt-20 pb-16">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4 border border-primary/20 bg-primary/10 text-primary">
              Resources for students and employers
            </Badge>
            <h1 className="font-heading text-4xl font-bold tracking-tight md:text-5xl">
              Learn how to make the most of TalentBridge
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
              This resource hub is the home for practical guides, platform tips, and better internship workflow habits.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-16">
          <div className="grid gap-6 md:grid-cols-3">
            {resourceCollections.map((collection, index) => (
              <GlassCard key={collection.title} delay={index * 0.05}>
                <collection.icon className="mb-3 h-8 w-8 text-primary" />
                <h2 className="font-heading text-xl font-semibold">{collection.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{collection.description}</p>
                <div className="mt-5 space-y-2">
                  {collection.links.map((link) => (
                    <div key={link} className="rounded-lg border border-border/70 bg-background/40 px-3 py-2 text-sm text-muted-foreground">
                      {link}
                    </div>
                  ))}
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 pb-20">
          <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-secondary/10 px-6 py-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <BookOpenText className="h-6 w-6 text-primary" />
            </div>
            <h2 className="font-heading text-3xl font-bold">Use the public pages as your starting point</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Browse opportunities, study how profiles are presented, and then create your own account when you’re ready to participate.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/for-students">
                  Explore student guidance <Sparkles className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/employers">
                  Explore employer guidance <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </PageTransition>
    </Layout>
  );
}
