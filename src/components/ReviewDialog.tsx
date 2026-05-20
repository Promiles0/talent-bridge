import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ReviewStars } from "./ReviewStars";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  applicationId: string;
  subjectId: string;
  subjectRole: "student" | "employer";
  subjectName?: string;
  onSubmitted?: () => void;
};

export function ReviewDialog({ open, onOpenChange, applicationId, subjectId, subjectRole, subjectName, onSubmitted }: Props) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!user || rating < 1) { toast.error("Please pick a rating"); return; }
    setBusy(true);
    const { error } = await supabase.from("reviews").insert({
      application_id: applicationId,
      author_id: user.id,
      subject_id: subjectId,
      subject_role: subjectRole,
      rating,
      comment: comment.trim() || null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Review submitted — thank you!");
    onOpenChange(false);
    onSubmitted?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review {subjectName ?? (subjectRole === "employer" ? "this employer" : "this student")}</DialogTitle>
          <DialogDescription>Your review helps the community build trust. Be honest and constructive.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Overall rating</span>
            <ReviewStars value={rating} onChange={setRating} size="lg" />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Comment (optional)</span>
            <Textarea rows={4} maxLength={500} value={comment} onChange={(e) => setComment(e.target.value)}
              placeholder={subjectRole === "employer" ? "How was the work environment, mentorship, communication?" : "How did this student perform — skills, attitude, reliability?"} />
            <span className="text-[10px] text-muted-foreground self-end">{comment.length}/500</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={busy || rating < 1}>Submit review</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
