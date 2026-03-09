import { DashboardLayout } from "@/components/DashboardLayout";
import { StudentSidebar } from "@/components/StudentSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { MessageSquare } from "lucide-react";

export default function StudentMessages() {
  const { user } = useAuth();

  const { data: messages, isLoading } = useQuery({
    queryKey: ["student-messages", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  return (
    <DashboardLayout sidebar={<StudentSidebar />} requiredRole="student">
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">Messages</h1>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : !messages?.length ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No messages yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {messages.map((msg: any) => (
              <Card key={msg.id} className={!msg.read && msg.receiver_id === user?.id ? "border-primary/30" : ""}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">
                      {msg.sender_id === user?.id ? "You" : (msg.profiles?.full_name || "Unknown")}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(msg.created_at), "MMM d, h:mm a")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{msg.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
