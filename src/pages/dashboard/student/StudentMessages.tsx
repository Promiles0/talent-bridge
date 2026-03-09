import { DashboardLayout } from "@/components/DashboardLayout";
import { StudentSidebar } from "@/components/StudentSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { MessageSquare, Send } from "lucide-react";
import { useState, useEffect } from "react";

export default function StudentMessages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

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

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("student-messages-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `receiver_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["student-messages"] })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `sender_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["student-messages"] })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const senderIds = [...new Set(messages?.filter(m => m.sender_id !== user?.id).map(m => m.sender_id) ?? [])];
  const { data: profiles } = useQuery({
    queryKey: ["sender-profiles", senderIds],
    queryFn: async () => {
      if (!senderIds.length) return [];
      const { data } = await supabase.from("profiles").select("id, full_name").in("id", senderIds);
      return data ?? [];
    },
    enabled: senderIds.length > 0,
  });

  const getProfileName = (id: string) => profiles?.find(p => p.id === id)?.full_name || "Unknown";

  const sendReply = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("messages").insert({
        sender_id: user!.id,
        receiver_id: replyTo!,
        content: replyContent,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setReplyContent("");
      setReplyTo(null);
    },
    onError: (err: any) => {
      import("sonner").then(({ toast }) => toast.error(err.message));
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("messages").update({ read: true }).eq("id", id);
    },
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
            {messages.map((msg: any) => {
              const isReceived = msg.receiver_id === user?.id;
              return (
                <Card
                  key={msg.id}
                  className={!msg.read && isReceived ? "border-primary/30" : ""}
                  onClick={() => {
                    if (!msg.read && isReceived) markRead.mutate(msg.id);
                  }}
                >
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">
                        {msg.sender_id === user?.id ? "You" : getProfileName(msg.sender_id)}
                      </p>
                      <div className="flex items-center gap-2">
                        {!msg.read && isReceived && (
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(msg.created_at), "MMM d, h:mm a")}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{msg.content}</p>
                    {isReceived && (
                      <div className="mt-2">
                        {replyTo === msg.sender_id ? (
                          <div className="flex gap-2 mt-1">
                            <Textarea
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder="Type your reply..."
                              rows={2}
                              className="flex-1"
                            />
                            <Button
                              size="sm"
                              onClick={() => sendReply.mutate()}
                              disabled={!replyContent.trim() || sendReply.isPending}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={() => setReplyTo(msg.sender_id)}
                          >
                            Reply
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
