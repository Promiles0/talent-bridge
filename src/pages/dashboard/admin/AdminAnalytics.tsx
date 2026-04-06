import { DashboardLayout } from "@/components/DashboardLayout";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminAnalytics() {
  const { data: applicationsByStatus } = useQuery({
    queryKey: ["admin-analytics-apps"],
    queryFn: async () => {
      const { data } = await supabase.from("applications").select("status");
      const counts: Record<string, number> = {};
      data?.forEach((a) => { counts[a.status] = (counts[a.status] ?? 0) + 1; });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    },
  });

  const { data: internshipsByType } = useQuery({
    queryKey: ["admin-analytics-internships"],
    queryFn: async () => {
      const { data } = await supabase.from("internships").select("work_type");
      const counts: Record<string, number> = {};
      data?.forEach((i) => { counts[i.work_type] = (counts[i.work_type] ?? 0) + 1; });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    },
  });

  return (
    <DashboardLayout sidebar={<AdminSidebar />} requiredRole="admin">
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">Analytics</h1>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Applications by Status</CardTitle></CardHeader>
            <CardContent>
              {applicationsByStatus?.length ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={applicationsByStatus}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(160, 84%, 39%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Internships by Work Type</CardTitle></CardHeader>
            <CardContent>
              {internshipsByType?.length ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={internshipsByType}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(168, 76%, 50%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
