import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { FileSignature } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  applicationId: string;
  internshipId: string;
  studentId: string;
  internshipTitle?: string;
}

export function OfferBuilder({ open, onOpenChange, applicationId, internshipId, studentId, internshipTitle }: Props) {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [stipend, setStipend] = useState("");
  const [terms, setTerms] = useState(
    `We are pleased to offer you the ${internshipTitle ?? "internship"} position.\n\nResponsibilities, working hours, and any other terms agreed will apply throughout the duration.\n\nWe look forward to working with you.`
  );
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!startDate || !endDate || !terms.trim()) return toast.error("Fill all required fields");
    setSaving(true);
    const { error } = await supabase.from("offers").insert({
      application_id: applicationId,
      employer_id: user!.id,
      student_id: studentId,
      internship_id: internshipId,
      start_date: startDate,
      end_date: endDate,
      stipend: stipend || null,
      terms,
      status: "sent",
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Offer sent");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileSignature className="h-5 w-5" /> Send offer letter</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>End date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Stipend</Label>
            <Input placeholder="RWF 200,000 / month" value={stipend} onChange={(e) => setStipend(e.target.value)} />
          </div>
          <div>
            <Label>Terms</Label>
            <Textarea rows={8} value={terms} onChange={(e) => setTerms(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Sending…" : "Send offer"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
