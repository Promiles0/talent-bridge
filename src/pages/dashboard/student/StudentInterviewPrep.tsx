import { DashboardLayout } from "@/components/DashboardLayout";
import { StudentSidebar } from "@/components/StudentSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import { Brain, Sparkles, ChevronDown, ChevronUp, Loader2, Lightbulb, Target, Users, Code2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { StaggerContainer, StaggerItem } from "@/components/StaggerContainer";

const categories = [
  { key: "behavioral", label: "Behavioral", icon: Users, color: "text-primary" },
  { key: "technical", label: "Technical", icon: Code2, color: "text-secondary" },
  { key: "situational", label: "Situational", icon: Target, color: "text-primary" },
];

const tips = [
  { title: "Use the STAR Method", desc: "Structure answers with Situation, Task, Action, and Result to give clear, concise responses." },
  { title: "Research the Company", desc: "Know their mission, products, and recent news. Show genuine interest in the organization." },
  { title: "Prepare Questions", desc: "Ask thoughtful questions about the role, team, and growth opportunities to stand out." },
  { title: "Practice Out Loud", desc: "Rehearse with a friend or record yourself. Hearing your answers helps refine them." },
  { title: "Be Specific", desc: "Give concrete examples with numbers and outcomes rather than vague generalities." },
];

export default function StudentInterviewPrep() {
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState<{ category: string; question: string; answer: string }[]>([]);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: student } = useQuery({
    queryKey: ["student-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("students").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: applications } = useQuery({
    queryKey: ["student-applications-for-prep", student?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("applications")
        .select("internships(title, description, requirements)")
        .eq("student_id", student!.id)
        .in("status", ["applied", "shortlisted", "interview"])
        .limit(5);
      return data ?? [];
    },
    enabled: !!student,
  });

  const { data: skills } = useQuery({
    queryKey: ["student-skills-prep", student?.id],
    queryFn: async () => {
      const { data } = await supabase.from("student_skills").select("skills(name)").eq("student_id", student!.id);
      return data?.map((s: any) => s.skills?.name).filter(Boolean) ?? [];
    },
    enabled: !!student,
  });

  const generateQuestions = async () => {
    setGenerating(true);
    setRevealed(new Set());
    try {
      const internshipContext = applications?.map((a: any) => ({
        title: a.internships?.title,
        requirements: a.internships?.requirements,
      })).filter(Boolean) ?? [];

      const { data, error } = await supabase.functions.invoke("ai-career-chat", {
        body: {
          messages: [{
            role: "user",
            content: `Generate 9 mock interview questions (3 behavioral, 3 technical, 3 situational) for a student with skills: ${(skills as string[])?.join(", ")}. They applied to: ${internshipContext.map((i: any) => i.title).join(", ")}. For each question, provide a suggested answer framework. Return ONLY a JSON array with objects: { "category": "behavioral|technical|situational", "question": "...", "answer": "..." }`
          }]
        }
      });
      if (error) throw error;

      const text = data?.reply || data?.response || "";
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setQuestions(parsed);
        toast.success("Questions generated!");
      } else {
        throw new Error("Could not parse AI response");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to generate questions");
    } finally {
      setGenerating(false);
    }
  };

  const toggleReveal = (idx: number) => {
    setRevealed(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const filteredQuestions = activeCategory === "all" ? questions : questions.filter(q => q.category === activeCategory);

  return (
    <DashboardLayout sidebar={<StudentSidebar />} requiredRole="student">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <h1 className="font-heading text-2xl font-bold">Interview Prep</h1>
          </div>
          <Button onClick={generateQuestions} disabled={generating} className="gap-2 btn-ripple">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {generating ? "Generating..." : "Generate Questions"}
          </Button>
        </div>

        {/* Tips */}
        <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tips.slice(0, 3).map((tip, i) => (
            <StaggerItem key={i}>
              <Card className="glass-card-themed card-hover h-full">
                <CardContent className="pt-5">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Lightbulb className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{tip.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{tip.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Category filter */}
        {questions.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activeCategory === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              All ({questions.length})
            </button>
            {categories.map((cat) => {
              const count = questions.filter(q => q.category === cat.key).length;
              if (!count) return null;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    activeCategory === cat.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {cat.label} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Questions */}
        {questions.length > 0 ? (
          <div className="space-y-3">
            {filteredQuestions.map((q, i) => {
              const globalIdx = questions.indexOf(q);
              const isRevealed = revealed.has(globalIdx);
              const catDef = categories.find(c => c.key === q.category);
              return (
                <motion.div
                  key={globalIdx}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Card className="glass-card-themed">
                    <CardContent className="py-4">
                      <div className="flex items-start gap-3">
                        <div className="shrink-0">
                          {catDef && <catDef.icon className={`h-5 w-5 ${catDef.color}`} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-[10px] capitalize">{q.category}</Badge>
                          </div>
                          <p className="text-sm font-medium">{q.question}</p>
                          <AnimatePresence>
                            {isRevealed && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                                  <p className="text-xs font-semibold text-primary mb-1">Suggested Framework</p>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{q.answer}</p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 text-xs gap-1"
                            onClick={() => toggleReveal(globalIdx)}
                          >
                            {isRevealed ? <><ChevronUp className="h-3 w-3" /> Hide Answer</> : <><ChevronDown className="h-3 w-3" /> Show Answer</>}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <Card className="glass-card-themed">
            <CardContent className="py-12 text-center">
              <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                <Brain className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              </motion.div>
              <p className="text-muted-foreground mb-3">Click "Generate Questions" to get AI-powered mock interview questions based on your skills and applications.</p>
              <Button onClick={generateQuestions} disabled={generating} className="gap-2">
                <Sparkles className="h-4 w-4" /> Generate Questions
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
