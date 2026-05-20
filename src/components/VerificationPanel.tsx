import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck, ShieldCheck, Loader2, AlertCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type Kind = "student" | "company";
type Verification = {
  id: string;
  status: "pending" | "approved" | "rejected";
  method: string;
  notes: string | null;
  created_at: string;
};

export function VerificationPanel({ kind, alreadyVerified }: { kind: Kind; alreadyVerified?: boolean }) {
  const { user } = useAuth();
  const [latest, setLatest] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // student inputs
  const [academicEmail, setAcademicEmail] = useState("");
  const [studentIdNumber, setStudentIdNumber] = useState("");
  const [university, setUniversity] = useState("");

  // company inputs
  const [rdbNumber, setRdbNumber] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [companyNotes, setCompanyNotes] = useState("");

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("verifications")
      .select("*")
      .eq("user_id", user.id)
      .eq("kind", kind)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setLatest((data as any) ?? null);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user, kind]);

  if (alreadyVerified) {
    return (
      <Card className="p-5 border-primary/30 bg-primary/5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/15"><BadgeCheck className="h-5 w-5 text-primary" /></div>
          <div>
            <h3 className="font-heading font-semibold flex items-center gap-2">Verified <Badge variant="secondary">Trusted</Badge></h3>
            <p className="text-xs text-muted-foreground">Your {kind === "company" ? "company" : "student"} account is verified.</p>
          </div>
        </div>
      </Card>
    );
  }

  const submitStudent = async (method: "email_domain" | "id_upload") => {
    if (!user) return;
    setSubmitting(true);
    try {
      if (method === "email_domain") {
        const email = academicEmail.trim().toLowerCase();
        if (!email.includes("@")) { toast.error("Enter a valid email"); return; }
        const domain = email.split("@")[1];
        const { data: domains } = await supabase
          .from("university_domains")
          .select("domain, university_name")
          .eq("domain", domain)
          .maybeSingle();
        if (!domains) {
          toast.error("This email domain is not on our recognized university list. Try ID upload instead.");
          return;
        }
        // auto-create AND auto-approve via insert; admin can still rotate later
        const { data: ver, error } = await supabase
          .from("verifications")
          .insert({
            user_id: user.id, kind: "student", method: "email_domain",
            evidence_data: { email, university: domains.university_name }, status: "pending",
          })
          .select().single();
        if (error) throw error;
        // try to auto-approve
        const { error: upErr } = await supabase
          .from("verifications")
          .update({ status: "approved", notes: "Auto-approved: recognized academic domain", reviewer_id: user.id })
          .eq("id", ver.id);
        if (upErr) { toast.success("Submitted for review"); } else { toast.success("Verified! Badge added to your profile."); }
      } else {
        if (!studentIdNumber.trim() || !university.trim()) { toast.error("Fill in your student ID and university"); return; }
        const { error } = await supabase.from("verifications").insert({
          user_id: user.id, kind: "student", method: "id_upload",
          evidence_data: { student_id_number: studentIdNumber, university },
        });
        if (error) throw error;
        toast.success("Submitted — admin will review shortly");
      }
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to submit");
    } finally { setSubmitting(false); }
  };

  const submitCompany = async () => {
    if (!user) return;
    if (!rdbNumber.trim() || !businessEmail.trim()) { toast.error("RDB number and business email are required"); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("verifications").insert({
        user_id: user.id, kind: "company", method: "rdb",
        evidence_data: { rdb_number: rdbNumber, business_email: businessEmail }, notes: companyNotes,
      });
      if (error) throw error;
      toast.success("Submitted — admin will review shortly");
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally { setSubmitting(false); }
  };

  if (loading) {
    return <Card className="p-5"><Loader2 className="h-4 w-4 animate-spin" /></Card>;
  }

  return (
    <Card className="p-5 border-primary/20 space-y-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-full bg-primary/10"><ShieldCheck className="h-5 w-5 text-primary" /></div>
        <div className="flex-1">
          <h3 className="font-heading font-semibold">Get verified</h3>
          <p className="text-xs text-muted-foreground">
            {kind === "student"
              ? "Verified students stand out to employers and rank higher in AI talent search."
              : "Verified employers gain student trust and unlock higher application rates."}
          </p>
        </div>
        {latest && (
          <Badge variant={latest.status === "approved" ? "default" : latest.status === "rejected" ? "destructive" : "secondary"}>
            {latest.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
            {latest.status === "rejected" && <AlertCircle className="h-3 w-3 mr-1" />}
            {latest.status}
          </Badge>
        )}
      </div>

      {latest?.status === "pending" && (
        <p className="text-xs bg-muted/50 p-2 rounded">Your submission is being reviewed. We'll notify you when there's an update.</p>
      )}

      {latest?.status === "rejected" && latest.notes && (
        <p className="text-xs bg-destructive/10 text-destructive p-2 rounded">{latest.notes}</p>
      )}

      {(!latest || latest.status === "rejected") && kind === "student" && (
        <div className="space-y-4">
          <div className="rounded-lg border p-3 space-y-2">
            <h4 className="text-sm font-semibold">Option 1 — Academic email</h4>
            <p className="text-xs text-muted-foreground">Instant verification if your email is from a recognized Rwandan university.</p>
            <div className="flex gap-2">
              <Input placeholder="you@ur.ac.rw" value={academicEmail} onChange={(e) => setAcademicEmail(e.target.value)} />
              <Button onClick={() => submitStudent("email_domain")} disabled={submitting}>Verify</Button>
            </div>
          </div>
          <div className="rounded-lg border p-3 space-y-2">
            <h4 className="text-sm font-semibold">Option 2 — Student ID details</h4>
            <p className="text-xs text-muted-foreground">Admin reviews within 24h.</p>
            <Input placeholder="Student ID number" value={studentIdNumber} onChange={(e) => setStudentIdNumber(e.target.value)} />
            <Input placeholder="University name" value={university} onChange={(e) => setUniversity(e.target.value)} />
            <Button variant="outline" onClick={() => submitStudent("id_upload")} disabled={submitting}>Submit for review</Button>
          </div>
        </div>
      )}

      {(!latest || latest.status === "rejected") && kind === "company" && (
        <div className="space-y-2 rounded-lg border p-3">
          <h4 className="text-sm font-semibold">Business verification</h4>
          <p className="text-xs text-muted-foreground">Provide your Rwanda Development Board (RDB) registration and business email.</p>
          <Input placeholder="RDB registration number" value={rdbNumber} onChange={(e) => setRdbNumber(e.target.value)} />
          <Input placeholder="Business email (matching your domain)" value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} />
          <Textarea rows={2} placeholder="Anything else admin should know? (optional)" value={companyNotes} onChange={(e) => setCompanyNotes(e.target.value)} />
          <Button onClick={submitCompany} disabled={submitting}>Submit for review</Button>
        </div>
      )}
    </Card>
  );
}
