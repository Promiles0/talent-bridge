import { Layout } from "@/components/Layout";
import { PageTransition } from "@/components/PageTransition";
import { GlassCard } from "@/components/GlassCard";
import { SkillTag } from "@/components/SkillTag";
import { Input } from "@/components/ui/input";
import { Search, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const mockStudents = [
  { id: "1", name: "Aline Uwase", headline: "Full-Stack Developer", university: "University of Rwanda", skills: ["React", "Node.js", "Python"] },
  { id: "2", name: "Jean Claude Mugabo", headline: "Data Scientist", university: "CMU Africa", skills: ["Python", "SQL", "ML"] },
  { id: "3", name: "Grace Ingabire", headline: "Product Designer", university: "ALU", skills: ["Figma", "UI/UX", "Research"] },
  { id: "4", name: "Eric Habimana", headline: "Mobile Developer", university: "INES-Ruhengeri", skills: ["Flutter", "Dart", "Firebase"] },
  { id: "5", name: "Diane Mukamana", headline: "Backend Engineer", university: "University of Rwanda", skills: ["Java", "Spring", "PostgreSQL"] },
  { id: "6", name: "Patrick Niyonzima", headline: "DevOps Engineer", university: "CMU Africa", skills: ["Docker", "AWS", "CI/CD"] },
];

export default function Students() {
  const [query, setQuery] = useState("");
  const filtered = mockStudents.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.skills.some((sk) => sk.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <Layout>
      <PageTransition>
        <section className="container mx-auto px-4 py-12">
          <h1 className="font-heading text-3xl font-bold mb-2">Student Directory</h1>
          <p className="text-muted-foreground mb-8">Discover talented students from Rwanda's top universities.</p>

          <div className="relative max-w-md mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or skill..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((student, i) => (
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
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {student.skills.map((s) => (
                    <SkillTag key={s} label={s} />
                  ))}
                </div>
                <Button variant="outline" size="sm" className="w-full">View Profile</Button>
              </GlassCard>
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-12">No students found matching your search.</p>
          )}
        </section>
      </PageTransition>
    </Layout>
  );
}
