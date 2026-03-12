import { DashboardLayout } from "@/components/DashboardLayout";
import { StudentSidebar } from "@/components/StudentSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2, Download, GraduationCap, Briefcase, Globe, Mail, Phone, MapPin } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface Education {
  institution: string;
  degree: string;
  field: string;
  startYear: string;
  endYear: string;
}

interface Experience {
  company: string;
  role: string;
  description: string;
  startDate: string;
  endDate: string;
}

interface CVData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  education: Education[];
  experience: Experience[];
  skills: string[];
  languages: string[];
  portfolioUrl: string;
  linkedinUrl: string;
  githubUrl: string;
}

const emptyEducation: Education = { institution: "", degree: "", field: "", startYear: "", endYear: "" };
const emptyExperience: Experience = { company: "", role: "", description: "", startDate: "", endDate: "" };

export default function StudentCVBuilder() {
  const { user } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: student } = useQuery({
    queryKey: ["student-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("students").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: studentSkills } = useQuery({
    queryKey: ["student-skills", student?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("student_skills")
        .select("skills(name)")
        .eq("student_id", student!.id);
      return data?.map((s: any) => s.skills?.name).filter(Boolean) ?? [];
    },
    enabled: !!student,
  });

  const [cv, setCv] = useState<CVData>({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    summary: "",
    education: [{ ...emptyEducation }],
    experience: [{ ...emptyExperience }],
    skills: [],
    languages: ["English"],
    portfolioUrl: "",
    linkedinUrl: "",
    githubUrl: "",
  });

  const [newSkill, setNewSkill] = useState("");
  const [newLang, setNewLang] = useState("");

  // Auto-fill from profile data
  useEffect(() => {
    if (profile || student || studentSkills) {
      setCv((prev) => ({
        ...prev,
        fullName: prev.fullName || profile?.full_name || "",
        email: prev.email || user?.email || "",
        location: prev.location || "",
        summary: prev.summary || student?.bio || "",
        portfolioUrl: prev.portfolioUrl || student?.portfolio_url || "",
        linkedinUrl: prev.linkedinUrl || student?.linkedin_url || "",
        githubUrl: prev.githubUrl || student?.github_url || "",
        skills: prev.skills.length ? prev.skills : (studentSkills as string[]) || [],
        education: prev.education[0]?.institution
          ? prev.education
          : student?.university
          ? [{ institution: student.university, degree: "", field: student.field_of_study || "", startYear: "", endYear: student.graduation_year?.toString() || "" }]
          : prev.education,
      }));
    }
  }, [profile, student, studentSkills, user]);

  const update = (field: keyof CVData, value: any) => setCv((p) => ({ ...p, [field]: value }));

  const updateEducation = (i: number, field: keyof Education, value: string) => {
    const edu = [...cv.education];
    edu[i] = { ...edu[i], [field]: value };
    update("education", edu);
  };

  const updateExperience = (i: number, field: keyof Experience, value: string) => {
    const exp = [...cv.experience];
    exp[i] = { ...exp[i], [field]: value };
    update("experience", exp);
  };

  const handlePrint = () => {
    const el = printRef.current;
    if (!el) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>${cv.fullName} - CV</title>
      <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1a1a1a; line-height: 1.5; padding: 40px 50px; max-width: 800px; margin: 0 auto; }
        h1 { font-size: 28px; font-weight: 700; margin-bottom: 4px; color: #c67c1a; }
        h2 { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #c67c1a; border-bottom: 2px solid #c67c1a; padding-bottom: 4px; margin: 24px 0 12px; }
        h3 { font-size: 15px; font-weight: 600; }
        .contact { display: flex; flex-wrap: wrap; gap: 12px; font-size: 13px; color: #555; margin-bottom: 8px; }
        .contact a { color: #c67c1a; text-decoration: none; }
        .summary { font-size: 14px; color: #444; margin-bottom: 4px; }
        .entry { margin-bottom: 12px; }
        .entry-header { display: flex; justify-content: space-between; align-items: baseline; }
        .entry-sub { font-size: 13px; color: #666; }
        .entry-desc { font-size: 13px; color: #444; margin-top: 4px; }
        .skills { display: flex; flex-wrap: wrap; gap: 6px; }
        .skill-tag { background: #f5efe8; color: #c67c1a; padding: 3px 10px; border-radius: 4px; font-size: 12px; font-weight: 500; }
        .langs { font-size: 13px; color: #444; }
        @media print { body { padding: 20px 30px; } }
      </style></head><body>${el.innerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => { w.print(); w.close(); }, 300);
  };

  return (
    <DashboardLayout sidebar={<StudentSidebar />} requiredRole="student">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">CV Builder</h1>
            <p className="text-sm text-muted-foreground">Build your professional CV and download as PDF.</p>
          </div>
          <Button onClick={handlePrint} className="gap-2">
            <Download className="h-4 w-4" /> Download PDF
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="space-y-4">
            {/* Personal Info */}
            <Card>
              <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Full Name" value={cv.fullName} onChange={(e) => update("fullName", e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Email" value={cv.email} onChange={(e) => update("email", e.target.value)} />
                  <Input placeholder="Phone" value={cv.phone} onChange={(e) => update("phone", e.target.value)} />
                </div>
                <Input placeholder="Location (e.g. Kigali, Rwanda)" value={cv.location} onChange={(e) => update("location", e.target.value)} />
                <div className="grid grid-cols-3 gap-3">
                  <Input placeholder="Portfolio URL" value={cv.portfolioUrl} onChange={(e) => update("portfolioUrl", e.target.value)} />
                  <Input placeholder="LinkedIn URL" value={cv.linkedinUrl} onChange={(e) => update("linkedinUrl", e.target.value)} />
                  <Input placeholder="GitHub URL" value={cv.githubUrl} onChange={(e) => update("githubUrl", e.target.value)} />
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader><CardTitle className="text-base">Summary / Objective</CardTitle></CardHeader>
              <CardContent>
                <Textarea placeholder="Brief professional summary..." value={cv.summary} onChange={(e) => update("summary", e.target.value)} rows={3} />
              </CardContent>
            </Card>

            {/* Education */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Education</CardTitle>
                <Button variant="outline" size="sm" onClick={() => update("education", [...cv.education, { ...emptyEducation }])}>
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {cv.education.map((edu, i) => (
                  <div key={i} className="space-y-2 p-3 border border-border rounded-lg relative">
                    {cv.education.length > 1 && (
                      <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-6 w-6 p-0" onClick={() => update("education", cv.education.filter((_, j) => j !== i))}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                    <Input placeholder="Institution" value={edu.institution} onChange={(e) => updateEducation(i, "institution", e.target.value)} />
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Degree" value={edu.degree} onChange={(e) => updateEducation(i, "degree", e.target.value)} />
                      <Input placeholder="Field of Study" value={edu.field} onChange={(e) => updateEducation(i, "field", e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Start Year" value={edu.startYear} onChange={(e) => updateEducation(i, "startYear", e.target.value)} />
                      <Input placeholder="End Year" value={edu.endYear} onChange={(e) => updateEducation(i, "endYear", e.target.value)} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Experience */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Work Experience</CardTitle>
                <Button variant="outline" size="sm" onClick={() => update("experience", [...cv.experience, { ...emptyExperience }])}>
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {cv.experience.map((exp, i) => (
                  <div key={i} className="space-y-2 p-3 border border-border rounded-lg relative">
                    {cv.experience.length > 1 && (
                      <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-6 w-6 p-0" onClick={() => update("experience", cv.experience.filter((_, j) => j !== i))}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Company" value={exp.company} onChange={(e) => updateExperience(i, "company", e.target.value)} />
                      <Input placeholder="Role / Title" value={exp.role} onChange={(e) => updateExperience(i, "role", e.target.value)} />
                    </div>
                    <Textarea placeholder="Description of responsibilities..." value={exp.description} onChange={(e) => updateExperience(i, "description", e.target.value)} rows={2} />
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Start Date" value={exp.startDate} onChange={(e) => updateExperience(i, "startDate", e.target.value)} />
                      <Input placeholder="End Date (or Present)" value={exp.endDate} onChange={(e) => updateExperience(i, "endDate", e.target.value)} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader><CardTitle className="text-base">Skills</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-3">
                  {cv.skills.map((s, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                      {s}
                      <button onClick={() => update("skills", cv.skills.filter((_, j) => j !== i))} className="hover:text-destructive">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Add a skill..." value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && newSkill.trim()) { update("skills", [...cv.skills, newSkill.trim()]); setNewSkill(""); } }} />
                  <Button variant="outline" size="sm" onClick={() => { if (newSkill.trim()) { update("skills", [...cv.skills, newSkill.trim()]); setNewSkill(""); } }}>Add</Button>
                </div>
              </CardContent>
            </Card>

            {/* Languages */}
            <Card>
              <CardHeader><CardTitle className="text-base">Languages</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-3">
                  {cv.languages.map((l, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary/10 text-secondary text-xs font-medium">
                      {l}
                      <button onClick={() => update("languages", cv.languages.filter((_, j) => j !== i))} className="hover:text-destructive">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Add a language..." value={newLang} onChange={(e) => setNewLang(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && newLang.trim()) { update("languages", [...cv.languages, newLang.trim()]); setNewLang(""); } }} />
                  <Button variant="outline" size="sm" onClick={() => { if (newLang.trim()) { update("languages", [...cv.languages, newLang.trim()]); setNewLang(""); } }}>Add</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Preview */}
          <div className="lg:sticky lg:top-4 h-fit">
            <Card className="overflow-hidden">
              <CardHeader className="bg-muted/50">
                <CardTitle className="text-base">Live Preview</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div ref={printRef} className="text-foreground">
                  {/* Name */}
                  <h1 style={{ fontSize: 22, fontWeight: 700, color: "hsl(34, 90%, 44%)", marginBottom: 2 }}>
                    {cv.fullName || "Your Name"}
                  </h1>

                  {/* Contact */}
                  <div className="contact" style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: 12, color: "#666", marginBottom: 12 }}>
                    {cv.email && <span>{cv.email}</span>}
                    {cv.phone && <span>• {cv.phone}</span>}
                    {cv.location && <span>• {cv.location}</span>}
                    {cv.portfolioUrl && <span>• <a href={cv.portfolioUrl} style={{ color: "hsl(34,90%,44%)" }}>Portfolio</a></span>}
                    {cv.linkedinUrl && <span>• <a href={cv.linkedinUrl} style={{ color: "hsl(34,90%,44%)" }}>LinkedIn</a></span>}
                    {cv.githubUrl && <span>• <a href={cv.githubUrl} style={{ color: "hsl(34,90%,44%)" }}>GitHub</a></span>}
                  </div>

                  {/* Summary */}
                  {cv.summary && (
                    <>
                      <h2 style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, color: "hsl(34,90%,44%)", borderBottom: "2px solid hsl(34,90%,44%)", paddingBottom: 3, marginBottom: 8 }}>
                        Summary
                      </h2>
                      <p style={{ fontSize: 13, color: "#444", marginBottom: 16 }}>{cv.summary}</p>
                    </>
                  )}

                  {/* Education */}
                  {cv.education.some((e) => e.institution) && (
                    <>
                      <h2 style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, color: "hsl(34,90%,44%)", borderBottom: "2px solid hsl(34,90%,44%)", paddingBottom: 3, marginBottom: 8 }}>
                        Education
                      </h2>
                      {cv.education.filter((e) => e.institution).map((edu, i) => (
                        <div key={i} style={{ marginBottom: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <strong style={{ fontSize: 14 }}>{edu.institution}</strong>
                            <span style={{ fontSize: 12, color: "#888" }}>{edu.startYear}{edu.endYear ? ` – ${edu.endYear}` : ""}</span>
                          </div>
                          <p style={{ fontSize: 13, color: "#666" }}>{[edu.degree, edu.field].filter(Boolean).join(" in ")}</p>
                        </div>
                      ))}
                    </>
                  )}

                  {/* Experience */}
                  {cv.experience.some((e) => e.company) && (
                    <>
                      <h2 style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, color: "hsl(34,90%,44%)", borderBottom: "2px solid hsl(34,90%,44%)", paddingBottom: 3, marginBottom: 8, marginTop: 16 }}>
                        Experience
                      </h2>
                      {cv.experience.filter((e) => e.company).map((exp, i) => (
                        <div key={i} style={{ marginBottom: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <strong style={{ fontSize: 14 }}>{exp.role}{exp.company ? ` at ${exp.company}` : ""}</strong>
                            <span style={{ fontSize: 12, color: "#888" }}>{exp.startDate}{exp.endDate ? ` – ${exp.endDate}` : ""}</span>
                          </div>
                          {exp.description && <p style={{ fontSize: 13, color: "#444", marginTop: 2 }}>{exp.description}</p>}
                        </div>
                      ))}
                    </>
                  )}

                  {/* Skills */}
                  {cv.skills.length > 0 && (
                    <>
                      <h2 style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, color: "hsl(34,90%,44%)", borderBottom: "2px solid hsl(34,90%,44%)", paddingBottom: 3, marginBottom: 8, marginTop: 16 }}>
                        Skills
                      </h2>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {cv.skills.map((s, i) => (
                          <span key={i} className="skill-tag" style={{ background: "#f5efe8", color: "hsl(34,90%,44%)", padding: "2px 10px", borderRadius: 4, fontSize: 12, fontWeight: 500 }}>{s}</span>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Languages */}
                  {cv.languages.length > 0 && (
                    <>
                      <h2 style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, color: "hsl(34,90%,44%)", borderBottom: "2px solid hsl(34,90%,44%)", paddingBottom: 3, marginBottom: 8, marginTop: 16 }}>
                        Languages
                      </h2>
                      <p style={{ fontSize: 13, color: "#444" }}>{cv.languages.join(" • ")}</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
