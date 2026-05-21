import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { CalendarClock, Plus, Trash2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  applicationId: string;
  internshipId: string;
}

interface Slot { start: string; end: string }

export function InterviewScheduler({ open, onOpenChange, applicationId, internshipId }: Props) {
  const { user } = useAuth();
  const [slots, setSlots] = useState<Slot[]>([{ start: "", end: "" }, { start: "", end: "" }, { start: "", end: "" }]);
  const [location, setLocation] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const update = (i: number, k: keyof Slot, v: string) => {
    setSlots((p) => p.map((s, idx) => (idx === i ? { ...s, [k]: v } : s)));
  };

  const submit = async () => {
    const valid = slots.filter((s) => s.start && s.end);
    if (!valid.length) return toast.error("Add at least one time slot");
    setSaving(true);
    const rows = valid.map((s) => ({
      application_id: applicationId,
      internship_id: internshipId,
      employer_id: user!.id,
      start_at: new Date(s.start).toISOString(),
      end_at: new Date(s.end).toISOString(),
      location: location || null,
      meeting_url: meetingUrl || null,
      notes: notes || null,
      status: "proposed",
    }));
    const { error } = await supabase.from("interview_slots").insert(rows);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Interview slots proposed");
    await supabase.from("applications").update({ status: "interview" as any }).eq("id", applicationId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5" /> Propose interview times</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Suggested time slots</Label>
            {slots.map((s, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input type="datetime-local" value={s.start} onChange={(e) => update(i, "start", e.target.value)} />
                <span className="text-muted-foreground text-xs">to</span>
                <Input type="datetime-local" value={s.end} onChange={(e) => update(i, "end", e.target.value)} />
                {slots.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => setSlots((p) => p.filter((_, idx) => idx !== i))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setSlots((p) => [...p, { start: "", end: "" }])}>
              <Plus className="h-3 w-3 mr-1" /> Add slot
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Location</Label>
              <Input placeholder="Office / Kigali" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div>
              <Label>Meeting URL</Label>
              <Input placeholder="https://meet…" value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What to prepare, who they'll meet…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Sending…" : "Send to candidate"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
