import { Layout } from "@/components/Layout";
import { PageTransition } from "@/components/PageTransition";
import { GlassCard } from "@/components/GlassCard";
import { SkillTag } from "@/components/SkillTag";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Search, MapPin, Building2, Filter, Clock, Loader2, Bookmark } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";

const PAGE_SIZE = 9;

export default function Internships() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [applyDialog, setApplyDialog] = useState<{ open: boolean; internshipId: string; title: string }>({ open: false, internshipId: "", title: "" });
  const [coverLetter, setCoverLetter] = useState("");
  const [applying, setApplying] = useState(false);

  const { data: internships, isLoading } = useQuery({
    queryKey: ["public-internships"],
    queryFn: async () => {
      const { data } = await supabase
        .from("internships")
        .select("*, companies(name, location, logo_url)")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: studentProfile } = useQuery({
    queryKey: ["student-for-apply", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("students").select("id").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: savedIds, refetch: refetchSaved } = useQuery({
    queryKey: ["saved-internships-ids", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("saved_internships").select("internship_id").eq("student_id", user!.id);
      return new Set((data ?? []).map((s: any) => s.internship_id));
    },
    enabled: !!user,
  });

  const toggleSave = async (internshipId: string) => {
    if (!user) { toast.error("Log in to save internships"); return; }
    const isSaved = savedIds?.has(internshipId);
    if (isSaved) {
      await supabase.from("saved_internships").delete().eq("student_id", user.id).eq("internship_id", internshipId);
    } else {
      await supabase.from("saved_internships").insert({ student_id: user.id, internship_id: internshipId });
    }
    refetchSaved();
  };

  const locations = [...new Set(internships?.map(i => i.location).filter(Boolean) ?? [])];

  const filtered = (internships ?? []).filter((i: any) => {
    const matchesQuery =
      i.title.toLowerCase().includes(query.toLowerCase()) ||
      i.companies?.name?.toLowerCase().includes(query.toLowerCase());
    const matchesLocation = locationFilter === "all" || i.location === locationFilter;
    const matchesType = typeFilter === "all" || i.work_type === typeFilter;
    return matchesQuery && matchesLocation && matchesType;
  });

  // Reset page when filters change
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleApply = async () => {
    if (!user) { toast.error("Please log in to apply"); return; }
    if (!studentProfile) { toast.error("Only students can apply for internships"); return; }
    setApplying(true);
    const { error } = await supabase.from("applications").insert({
      student_id: studentProfile.id,
      internship_id: applyDialog.internshipId,
      cover_letter: coverLetter || null,
    });
    setApplying(false);
    if (error) {
      if (error.code === "23505") toast.error("You've already applied to this internship");
      else toast.error(error.message);
    } else {
      toast.success("Application submitted!");
      setApplyDialog({ open: false, internshipId: "", title: "" });
      setCoverLetter("");
    }
  };

  return (
    <Layout>
      <PageTransition>
        <section className="container mx-auto px-4 py-12">
          <h1 className="font-heading text-3xl font-bold mb-2">Internship Board</h1>
          <p className="text-muted-foreground mb-8">Find your next opportunity at Rwanda's leading companies.</p>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or company..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                className="pl-9 bg-card"
              />
            </div>
            <Select value={locationFilter} onValueChange={(v) => { setLocationFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[160px] bg-card">
                <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map(loc => (
                  <SelectItem key={loc} value={loc!}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[160px] bg-card">
                <Filter className="h-4 w-4 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Work Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="remote">Remote</SelectItem>
                <SelectItem value="on-site">On-site</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results count */}
          {!isLoading && filtered.length > 0 && (
            <p className="text-sm text-muted-foreground mb-4">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} internship{filtered.length !== 1 ? "s" : ""}
            </p>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginated.map((intern: any, i: number) => (
                  <GlassCard key={intern.id} delay={i * 0.05}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link to={`/internships/${intern.id}`} className="font-heading font-semibold text-sm hover:text-primary transition-colors">{intern.title}</Link>
                        <p className="text-xs text-muted-foreground">{intern.companies?.name}</p>
                      </div>
                      {user && (
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleSave(intern.id); }}
                          className="shrink-0 p-1 rounded hover:bg-primary/10 transition-colors"
                          title={savedIds?.has(intern.id) ? "Unsave" : "Save"}
                        >
                          <Bookmark className={`h-4 w-4 ${savedIds?.has(intern.id) ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                        </button>
                      )}
                    </div>
                    {intern.description && (
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{intern.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {intern.location || "N/A"}
                      </span>
                      <SkillTag label={intern.work_type} />
                      {intern.duration && <SkillTag label={intern.duration} />}
                      {intern.stipend && <SkillTag label={intern.stipend} />}
                      {intern.spots && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" /> {intern.spots} spot{intern.spots > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => setApplyDialog({ open: true, internshipId: intern.id, title: intern.title })}
                    >
                      View & Apply
                    </Button>
                  </GlassCard>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <PaginationItem key={p}>
                          <PaginationLink
                            isActive={p === currentPage}
                            onClick={() => setPage(p)}
                            className="cursor-pointer"
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
          {!isLoading && filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-12">No internships found matching your search.</p>
          )}
        </section>
      </PageTransition>

      {/* Apply Dialog */}
      <Dialog open={applyDialog.open} onOpenChange={(o) => setApplyDialog({ ...applyDialog, open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for {applyDialog.title}</DialogTitle>
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
