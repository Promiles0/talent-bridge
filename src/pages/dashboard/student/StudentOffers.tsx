import { DashboardLayout } from "@/components/DashboardLayout";
import { StudentSidebar } from "@/components/StudentSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { useState } from "react";
import { FileSignature, Check, X, Printer } from "lucide-react";
import { fireConfetti } from "@/lib/confetti";

export default function StudentOffers() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [signOpen, setSignOpen] = useState<{ id: string; terms: string } | null>(null);
  const [signature, setSignature] = useState("");

  const { data: student } = useQuery({
    queryKey: ["student-me", user?.id],
    queryFn: async () => (await supabase.from("students").select("id").eq("user_id", user!.id).maybeSingle()).data,
    enabled: !!user,
  });

  const { data: offers, isLoading } = useQuery({
    queryKey: ["student-offers", student?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("offers")
        .select("*, internships(title, companies(name, logo_url))")
        .eq("student_id", student!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!student,
  });

  const sign = useMutation({
    mutationFn: async () => {
      if (!signOpen || !signature.trim()) throw new Error("Type your full name to sign");
      const { error } = await supabase.from("offers").update({
        status: "accepted",
        signature_data: { name: signature, signed_at: new Date().toISOString() },
        signed_at: new Date().toISOString(),
      }).eq("id", signOpen.id);
      if (error) throw error;
    },
    onSuccess: () => { fireConfetti({ count: 180 }); toast.success("Offer accepted! 🎉"); setSignOpen(null); setSignature(""); qc.invalidateQueries({ queryKey: ["student-offers"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const decline = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("offers").update({ status: "declined" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Offer declined"); qc.invalidateQueries({ queryKey: ["student-offers"] }); },
  });

  const badge = (s: string) =>
    s === "accepted" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
    : s === "declined" || s === "withdrawn" ? "bg-destructive/10 text-destructive"
    : "bg-primary/10 text-primary";

  return (
    <DashboardLayout sidebar={<StudentSidebar />} requiredRole="student">
      <div className="space-y-6 pb-20 md:pb-0">
        <h1 className="font-heading text-2xl font-bold">My Offers</h1>

        {isLoading ? (
          <div className="flex items-center justify-center h-40"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
        ) : !offers?.length ? (
          <Card><CardContent className="py-12 text-center">
            <FileSignature className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-muted-foreground">No offers yet. Keep applying!</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {offers.map((o: any) => (
              <Card key={o.id} className="glass-card-themed">
                <CardContent className="py-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{o.internships?.title}</p>
                      <p className="text-sm text-muted-foreground">{o.internships?.companies?.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(o.start_date), "MMM d, yyyy")} – {format(new Date(o.end_date), "MMM d, yyyy")}
                        {o.stipend ? ` · ${o.stipend}` : ""}
                      </p>
                    </div>
                    <Badge className={badge(o.status)}>{o.status}</Badge>
                  </div>
                  <p className="text-sm whitespace-pre-line bg-muted/40 p-3 rounded-lg">{o.terms}</p>
                  {o.signature_data && (
                    <p className="text-xs text-muted-foreground italic">
                      Signed by {(o.signature_data as any).name} on {format(new Date(o.signed_at), "MMM d, yyyy")}
                    </p>
                  )}
                  <div className="flex gap-2">
                    {o.status === "sent" && (
                      <>
                        <Button size="sm" onClick={() => setSignOpen({ id: o.id, terms: o.terms })}>
                          <Check className="h-3 w-3 mr-1" /> Accept & Sign
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => decline.mutate(o.id)}>
                          <X className="h-3 w-3 mr-1" /> Decline
                        </Button>
                      </>
                    )}
                    <Button asChild size="sm" variant="outline">
                      <a href={`/offers/${o.id}/print`} target="_blank" rel="noreferrer">
                        <Printer className="h-3 w-3 mr-1" /> View / Print
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!signOpen} onOpenChange={(o) => !o && setSignOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Sign offer</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Type your full legal name as your digital signature.</p>
          <div>
            <Label>Signature</Label>
            <Input value={signature} onChange={(e) => setSignature(e.target.value)} className="font-heading text-lg italic" placeholder="Your full name" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSignOpen(null)}>Cancel</Button>
            <Button onClick={() => sign.mutate()} disabled={!signature.trim() || sign.isPending}>
              {sign.isPending ? "Signing…" : "Sign & Accept"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
