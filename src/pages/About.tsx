import { Layout } from "@/components/Layout";
import { PageTransition } from "@/components/PageTransition";
import { GlassCard } from "@/components/GlassCard";
import { Heart, Globe, Zap } from "lucide-react";

export default function About() {
  return (
    <Layout>
      <PageTransition>
        <section className="container mx-auto px-4 py-20 max-w-3xl">
          <h1 className="font-heading text-4xl font-bold mb-4 text-center">About TalentBridge</h1>
          <p className="text-muted-foreground text-center text-lg mb-12">
            We're on a mission to bridge the gap between Rwanda's talented students and the employers who need them.
          </p>
          <div className="grid gap-6">
            {[
              { icon: Heart, title: "Our Mission", desc: "To empower every Rwandan student with access to meaningful career opportunities, and help employers discover exceptional talent." },
              { icon: Globe, title: "Why Rwanda", desc: "Rwanda is home to a rapidly growing tech ecosystem and world-class universities. TalentBridge makes it easy to connect this talent with opportunity." },
              { icon: Zap, title: "How We're Different", desc: "We combine student portfolios, skill verification, and direct employer connections — all in one modern platform." },
            ].map((item, i) => (
              <GlassCard key={item.title} delay={i * 0.05} hover={false}>
                <div className="flex items-start gap-4">
                  <item.icon className="h-6 w-6 text-primary mt-1 shrink-0" />
                  <div>
                    <h2 className="font-heading text-lg font-semibold mb-1">{item.title}</h2>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>
      </PageTransition>
    </Layout>
  );
}
