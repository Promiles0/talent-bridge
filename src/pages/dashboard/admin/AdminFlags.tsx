import { DashboardLayout } from "@/components/DashboardLayout";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { CheckCircle, Flag } from "lucide-react";

export default function AdminFlags() {
  const queryClient = useQueryClient();

  const { data: flags, isLoading } = useQuery({
    queryKey: ["admin-flags"],
    queryFn: async () => {
      const { data } = await supabase.from("flags").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("flags").update({ resolved: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Flag resolved");
      queryClient.invalidateQueries({ queryKey: ["admin-flags"] });
      queryClient.invalidateQueries({ queryKey: ["admin-counts"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <DashboardLayout sidebar={<AdminSidebar />} requiredRole="admin">
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">Flags</h1>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : !flags?.length ? (
          <Card><CardContent className="py-12 text-center">
            <Flag className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No flags to review.</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {flags.map((f) => (
              <Card key={f.id} className={f.resolved ? "opacity-60" : ""}>
                <CardContent className="py-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{f.target_type}: {f.target_id.slice(0, 8)}...</p>
                      <Badge className={f.resolved ? "bg-green-100 text-green-700" : "bg-destructive/10 text-destructive"}>
                        {f.resolved ? "Resolved" : "Open"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{f.reason}</p>
                    <p className="text-xs text-muted-foreground mt-1">{format(new Date(f.created_at), "MMM d, yyyy")}</p>
                  </div>
                  {!f.resolved && (
                    <Button size="sm" variant="outline" onClick={() => resolveMutation.mutate(f.id)}>
                      <CheckCircle className="h-4 w-4 mr-1" /> Resolve
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
