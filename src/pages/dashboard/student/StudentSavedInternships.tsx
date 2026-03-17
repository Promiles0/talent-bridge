import { DashboardLayout } from "@/components/DashboardLayout";
import { StudentSidebar } from "@/components/StudentSidebar";
import { GlassCard } from "@/components/GlassCard";
import { SkillTag } from "@/components/SkillTag";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Bookmark, BookmarkCheck, MapPin, Building2, Clock } from "lucide-react";

export default function StudentSavedInternships() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: saved, isLoading } = useQuery({
    queryKey: ["saved-internships", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("saved_internships")
        .select("id, internship_id, internships(id, title, location, work_type, stipend, duration, status, companies(name, logo_url))")
        .eq("student_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const unsave = useMutation({
    mutationFn: async (internshipId: string) => {
      await supabase.from("saved_internships").delete()
        .eq("student_id", user!.id).eq("internship_id", internshipId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-internships"] });
      toast.success("Removed from saved");
    },
  });

  return (
    <DashboardLayout sidebar={<StudentSidebar />} requiredRole="student">
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">Saved Internships</h1>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : !saved?.length ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bookmark className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground mb-3">No saved internships yet. Bookmark listings to find them here.</p>
              <Button asChild size="sm"><Link to="/internships">Browse Internships</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {saved.map((s: any) => {
              const intern = s.internships;
              if (!intern) return null;
              return (
                <GlassCard key={s.id}>
                  <div className="relative">
                    <button
                      onClick={() => unsave.mutate(intern.id)}
                      className="absolute -top-2 -right-2 p-1.5 rounded-full bg-card border border-border hover:bg-muted transition-colors"
                      title="Remove from saved"
                    >
                      <BookmarkCheck className="h-4 w-4 text-primary" />
                    </button>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <Link to={`/internships/${intern.id}`} className="font-heading font-semibold text-sm hover:text-primary transition-colors">
                          {intern.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">{intern.companies?.name}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {intern.location && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {intern.location}
                        </span>
                      )}
                      <SkillTag label={intern.work_type} />
                      {intern.stipend && <SkillTag label={intern.stipend} />}
                    </div>
                    <Button asChild size="sm" className="w-full">
                      <Link to={`/internships/${intern.id}`}>View Details</Link>
                    </Button>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
