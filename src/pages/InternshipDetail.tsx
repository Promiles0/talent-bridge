import { Layout } from "@/components/Layout";
import { PageTransition } from "@/components/PageTransition";
import { ScrollProgressBar } from "@/components/ScrollProgressBar";
import { SkillTag } from "@/components/SkillTag";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, MapPin, Building2, Clock, Briefcase, Share2, Bookmark, BookmarkCheck,
  CheckCircle, Loader2, ExternalLink, Globe
} from "lucide-react";

export default function InternshipDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [applyOpen, setApplyOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [applying, setApplying] = useState(false);

  const { data: internship, isLoading } = useQuery({
    queryKey: ["internship-detail", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("internships")
        .select("*, companies(id, name, location, logo_url, website, verified, description)")
        .eq("id", id!)
        .maybeSingle();
      return data;
    },
    enabled: !!id,
  });

  const { data: studentProfile } = useQuery({
    queryKey: ["student-for-apply", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("students").select("id").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user && role === "student",
  });

  const { data: isSaved } = useQuery({
    queryKey: ["saved-check", id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("saved_internships")
        .select("id")
        .eq("student_id", user!.id)
        .eq("internship_id", id!)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && role === "student" && !!id,
  });

  const { data: hasApplied } = useQuery({
    queryKey: ["applied-check", id, studentProfile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("applications")
        .select("id")
        .eq("student_id", studentProfile!.id)
        .eq("internship_id", id!)
        .maybeSingle();
      return !!data;
    },
    enabled: !!studentProfile && !!id,
  });

  const toggleSave = useMutation({
    mutationFn: async () => {
      if (isSaved) {
        await supabase.from("saved_internships").delete()
          .eq("student_id", user!.id).eq("internship_id", id!);
      } else {
        await supabase.from("saved_internships").insert({
          student_id: user!.id, internship_id: id!,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-check", id] });
      queryClient.invalidateQueries({ queryKey: ["saved-internships"] });
      toast.success(isSaved ? "Removed from saved" : "Saved!");
    },
  });

  const handleApply = async () => {
    if (!user) { toast.error("Please log in to apply"); return; }
    if (!studentProfile) { toast.error("Only students can apply"); return; }
    setApplying(true);
    const { error } = await supabase.from("applications").insert({
      student_id: studentProfile.id,
      internship_id: id!,
      cover_letter: coverLetter || null,
    });
    setApplying(false);
    if (error) {
      if (error.code === "23505") toast.error("You've already applied");
      else toast.error(error.message);
    } else {
      toast.success("Application submitted!");
      setApplyOpen(false);
      setCoverLetter("");
      queryClient.invalidateQueries({ queryKey: ["applied-check", id] });
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied!");
  };

  const company = internship?.companies as any;
  const isActive = internship?.status === "active";

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 max-w-4xl space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-12 w-full max-w-md" />
          <div className="flex gap-2"><Skeleton className="h-6 w-20" /><Skeleton className="h-6 w-20" /><Skeleton className="h-6 w-20" /></div>
          <Skeleton className="h-40 w-full" />
        </div>
      </Layout>
    );
  }

  if (!internship) {
    return (
      <Layout>
        <PageTransition>
          <section className="container mx-auto px-4 py-20 text-center">
            <h1 className="font-heading text-2xl font-bold mb-2">Internship Not Found</h1>
            <p className="text-muted-foreground mb-4">This listing doesn't exist or has been removed.</p>
            <Button asChild variant="outline"><Link to="/internships"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link></Button>
          </section>
        </PageTransition>
      </Layout>
    );
  }

  return (
    <Layout>
      <ScrollProgressBar />
      <PageTransition>
        <section className="container mx-auto px-4 py-12 max-w-4xl">
          <Button asChild variant="ghost" size="sm" className="mb-6">
            <Link to="/internships"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Internships</Link>
          </Button>

          {!isActive && (
            <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-center text-sm text-destructive">
              This internship is no longer accepting applications.
            </div>
          )}

          <div className="grid lg:grid-cols-[1fr_300px] gap-8">
            {/* Main content */}
            <div className="space-y-6">
              {/* Header */}
              <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, ease: [0, 0, 0.2, 1] }}>
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm text-muted-foreground">{company?.name}</p>
                      {company?.verified && <CheckCircle className="h-4 w-4 text-primary" />}
                    </div>
                    <h1 className="font-heading text-2xl md:text-3xl font-bold">{internship.title}</h1>
                    {company?.location && (
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {company.location}
                      </p>
                    )}
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <SkillTag label={internship.work_type} />
                  {internship.location && <SkillTag label={internship.location} />}
                  {internship.duration && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      <Clock className="h-3 w-3" /> {internship.duration}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    <Briefcase className="h-3 w-3" /> {internship.stipend || "Unpaid"}
                  </span>
                  {internship.spots && (
                    <span className="text-xs text-muted-foreground">{internship.spots} spot{internship.spots > 1 ? "s" : ""}</span>
                  )}
                </div>
              </motion.div>

              {/* Action buttons */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex flex-wrap gap-3">
                {isActive && (
                  hasApplied ? (
                    <Button disabled className="gap-2">
                      <CheckCircle className="h-4 w-4" /> Already Applied
                    </Button>
                  ) : (
                    <Button onClick={() => setApplyOpen(true)} className="gap-2">
                      <Briefcase className="h-4 w-4" /> Apply Now
                    </Button>
                  )
                )}
                {user && role === "student" && (
                  <Button variant="outline" onClick={() => toggleSave.mutate()} className="gap-2">
                    {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                    {isSaved ? "Saved" : "Save"}
                  </Button>
                )}
                <Button variant="outline" onClick={handleShare} className="gap-2">
                  <Share2 className="h-4 w-4" /> Share
                </Button>
              </motion.div>

              {/* Description */}
              {internship.description && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <Card>
                    <CardContent className="py-5">
                      <h2 className="font-heading font-semibold mb-3">Description</h2>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{internship.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Requirements */}
              {internship.requirements && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <Card>
                    <CardContent className="py-5">
                      <h2 className="font-heading font-semibold mb-3">Requirements</h2>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{internship.requirements}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>

            {/* Sidebar — desktop only, below on mobile */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.15, ease: [0, 0, 0.2, 1] }}
              className="space-y-4"
            >
              <Card className="glass-card-themed">
                <CardContent className="py-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-heading font-semibold text-sm">{company?.name}</p>
                      {company?.verified && (
                        <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20 mt-0.5">Verified</Badge>
                      )}
                    </div>
                  </div>
                  {company?.description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-3">{company.description}</p>
                  )}
                  {company?.location && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                      <MapPin className="h-3 w-3" /> {company.location}
                    </p>
                  )}
                  {company?.website && (
                    <Button asChild variant="outline" size="sm" className="w-full gap-1 text-xs">
                      <a href={company.website} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-3 w-3" /> Visit Website
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>

              {internship.deadline && (
                <Card>
                  <CardContent className="py-4">
                    <p className="text-xs text-muted-foreground">Deadline</p>
                    <p className="font-medium text-sm">{new Date(internship.deadline).toLocaleDateString()}</p>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </div>
        </section>
      </PageTransition>

      {/* Apply Dialog */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for {internship.title}</DialogTitle>
          </DialogHeader>
          {!user ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-3">You need to be logged in as a student to apply.</p>
              <Button asChild><Link to="/login">Log in</Link></Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Write a brief cover letter (optional)..."
                rows={5}
              />
              <Button onClick={handleApply} disabled={applying} className="w-full">
                {applying && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Submit Application
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
