import { Layout } from "@/components/Layout";
import { PageTransition } from "@/components/PageTransition";
import { GlassCard } from "@/components/GlassCard";
import { UserPlus, FileText, Search, Send, Building2, ClipboardList, Users, CheckCircle } from "lucide-react";

const studentSteps = [
  { icon: UserPlus, title: "Create Your Profile", desc: "Sign up, add your skills, education, and portfolio projects." },
  { icon: FileText, title: "Upload Your CV", desc: "Add your resume and let employers discover you." },
  { icon: Search, title: "Browse Internships", desc: "Search and filter opportunities that match your interests." },
  { icon: Send, title: "Apply", desc: "Submit applications and track your progress." },
];

const employerSteps = [
  { icon: Building2, title: "Set Up Company", desc: "Create your company profile with details and branding." },
  { icon: ClipboardList, title: "Post Internships", desc: "Publish opportunities with requirements and details." },
  { icon: Users, title: "Review Applicants", desc: "Browse applications, shortlist candidates, and download CVs." },
  { icon: CheckCircle, title: "Hire Talent", desc: "Connect with the best candidates and make offers." },
];

export default function HowItWorks() {
  return (
    <Layout>
      <PageTransition>
        <section className="container mx-auto px-4 py-20 max-w-4xl">
          <h1 className="font-heading text-4xl font-bold mb-4 text-center">How It Works</h1>
          <p className="text-muted-foreground text-center text-lg mb-16">
            Whether you're a student or employer, getting started is simple.
          </p>

          <h2 className="font-heading text-2xl font-bold mb-6 text-center">For Students</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
            {studentSteps.map((step, i) => (
              <GlassCard key={step.title} delay={i * 0.05} hover={false}>
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold text-sm mb-1">{step.title}</h3>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </div>
              </GlassCard>
            ))}
          </div>

          <h2 className="font-heading text-2xl font-bold mb-6 text-center">For Employers</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {employerSteps.map((step, i) => (
              <GlassCard key={step.title} delay={i * 0.05} hover={false}>
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center mb-3">
                    <step.icon className="h-6 w-6 text-secondary" />
                  </div>
                  <h3 className="font-heading font-semibold text-sm mb-1">{step.title}</h3>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>
      </PageTransition>
    </Layout>
  );
}
