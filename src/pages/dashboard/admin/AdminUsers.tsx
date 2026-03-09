import { DashboardLayout } from "@/components/DashboardLayout";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

export default function AdminUsers() {
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id, role, created_at");
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, avatar_url, created_at");

      const merged = profiles?.map((p) => {
        const userRole = roles?.find((r) => r.user_id === p.id);
        return { ...p, role: userRole?.role ?? "unknown" };
      }) ?? [];

      return merged;
    },
  });

  const roleColor: Record<string, string> = {
    student: "bg-primary/10 text-primary",
    employer: "bg-secondary/10 text-secondary",
    admin: "bg-destructive/10 text-destructive",
  };

  return (
    <DashboardLayout sidebar={<AdminSidebar />} requiredRole="admin">
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">Users</h1>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                      <TableCell>
                        <Badge className={roleColor[u.role] ?? "bg-muted"}>
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(u.created_at), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
