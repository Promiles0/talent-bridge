import { DashboardLayout } from "@/components/DashboardLayout";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Users, Briefcase, Building2, Flag } from "lucide-react";

export default function AdminOverview() {
  const { data: counts } = useQuery({
    queryKey: ["admin-counts"],
    queryFn: async () => {
      const [students, companies, internships, flags] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("companies").select("id", { count: "exact", head: true }),
        supabase.from("internships").select("id", { count: "exact", head: true }),
        supabase.from("flags").select("id", { count: "exact", head: true }).eq("resolved", false),
      ]);
      return {
        students: students.count ?? 0,
        companies: companies.count ?? 0,
        internships: internships.count ?? 0,
        flags: flags.count ?? 0,
      };
    },
  });

  const stats = [
    { label: "Students", value: counts?.students ?? 0, icon: Users, color: "text-primary" },
    { label: "Companies", value: counts?.companies ?? 0, icon: Building2, color: "text-secondary" },
    { label: "Internships", value: counts?.internships ?? 0, icon: Briefcase, color: "text-primary" },
    { label: "Open Flags", value: counts?.flags ?? 0, icon: Flag, color: "text-destructive" },
  ];

  return (
    <DashboardLayout sidebar={<AdminSidebar />} requiredRole="admin">
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">Admin Dashboard</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <s.icon className={`h-8 w-8 ${s.color}`} />
                  <div>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
