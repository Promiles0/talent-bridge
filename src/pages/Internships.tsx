import { Layout } from "@/components/Layout";
import { PageTransition } from "@/components/PageTransition";
import { GlassCard } from "@/components/GlassCard";
import { SkillTag } from "@/components/SkillTag";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Building2 } from "lucide-react";
import { useState } from "react";

const mockInternships = [
  { id: "1", title: "Frontend Developer Intern", company: "Irembo", location: "Kigali", type: "Hybrid", stipend: "150,000 RWF/mo", duration: "3 months" },
  { id: "2", title: "Data Analyst Intern", company: "Bank of Kigali", location: "Kigali", type: "On-site", stipend: "200,000 RWF/mo", duration: "6 months" },
  { id: "3", title: "UI/UX Design Intern", company: "Andela", location: "Remote", type: "Remote", stipend: null, duration: "3 months" },
  { id: "4", title: "Backend Engineer Intern", company: "Klab", location: "Kigali", type: "On-site", stipend: "120,000 RWF/mo", duration: "4 months" },
  { id: "5", title: "Marketing Intern", company: "Tigo Rwanda", location: "Kigali", type: "Hybrid", stipend: "100,000 RWF/mo", duration: "3 months" },
  { id: "6", title: "Mobile Dev Intern", company: "Exuus", location: "Kigali", type: "On-site", stipend: "180,000 RWF/mo", duration: "6 months" },
];

export default function Internships() {
  const [query, setQuery] = useState("");
  const filtered = mockInternships.filter(
    (i) =>
      i.title.toLowerCase().includes(query.toLowerCase()) ||
      i.company.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Layout>
      <PageTransition>
        <section className="container mx-auto px-4 py-12">
          <h1 className="font-heading text-3xl font-bold mb-2">Internship Board</h1>
          <p className="text-muted-foreground mb-8">Find your next opportunity at Rwanda's leading companies.</p>

          <div className="relative max-w-md mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or company..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((intern, i) => (
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
                  <SkillTag label={intern.duration} />
                  {intern.stipend && <SkillTag label={intern.stipend} />}
                </div>
                <Button size="sm" className="w-full">View & Apply</Button>
              </GlassCard>
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-12">No internships found matching your search.</p>
          )}
        </section>
      </PageTransition>
    </Layout>
  );
}
