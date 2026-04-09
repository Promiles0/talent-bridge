import { DashboardLayout } from "@/components/DashboardLayout";
import { StudentSidebar } from "@/components/StudentSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { MessageSquare, Send, ChevronLeft } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function StudentMessages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["student-messages", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`)
        .order("created_at", { ascending: true });
      return data ?? [];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("student-messages-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `receiver_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["student-messages"] })
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `sender_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["student-messages"] })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const contactIds = useMemo(() => {
    if (!messages || !user) return [];
    const ids = new Set<string>();
    messages.forEach((m: any) => {
      if (m.sender_id !== user.id) ids.add(m.sender_id);
      if (m.receiver_id !== user.id) ids.add(m.receiver_id);
    });
    return [...ids];
  }, [messages, user]);

  const { data: profiles } = useQuery({
    queryKey: ["msg-profiles", contactIds],
    queryFn: async () => {
      if (!contactIds.length) return [];
      const { data } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", contactIds);
      return data ?? [];
    },
    enabled: contactIds.length > 0,
  });

  const getProfile = (id: string) => profiles?.find((p: any) => p.id === id);
  const getName = (id: string) => getProfile(id)?.full_name || "User";
  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const conversations = useMemo(() => {
    if (!messages || !user) return [];
    const map = new Map<string, any[]>();
    messages.forEach((m: any) => {
      const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
      if (!map.has(otherId)) map.set(otherId, []);
      map.get(otherId)!.push(m);
    });
    return [...map.entries()].map(([contactId, msgs]) => ({
      contactId,
      messages: msgs,
      lastMessage: msgs[msgs.length - 1],
      unreadCount: msgs.filter((m: any) => m.receiver_id === user.id && !m.read).length,
    })).sort((a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime());
  }, [messages, user]);

  const activeConversation = conversations.find(c => c.contactId === selectedContact);

  const markRead = useMutation({
    mutationFn: async (contactId: string) => {
      await supabase.from("messages").update({ read: true })
        .eq("sender_id", contactId).eq("receiver_id", user!.id).eq("read", false);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["student-messages"] }),
  });

  const sendReply = useMutation({
    mutationFn: async () => {
      setIsSending(true);
      const { error } = await supabase.from("messages").insert({
        sender_id: user!.id,
        receiver_id: selectedContact!,
        content: replyContent,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setReplyContent("");
      setIsSending(false);
      queryClient.invalidateQueries({ queryKey: ["student-messages"] });
    },
    onError: () => setIsSending(false),
  });

  useEffect(() => {
    if (selectedContact) {
      markRead.mutate(selectedContact);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedContact, activeConversation?.messages.length]);

  return (
    <DashboardLayout sidebar={<StudentSidebar />} requiredRole="student">
      <div className="space-y-4">
        <h1 className="font-heading text-2xl font-bold">Messages</h1>
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : !conversations.length ? (
          <Card><CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No messages yet.</p>
          </CardContent></Card>
        ) : (
          <div className="grid md:grid-cols-[300px_1fr] gap-4 min-h-[500px]">
            {/* Contact list */}
            <div className={`space-y-1 border rounded-lg p-2 overflow-y-auto max-h-[600px] ${selectedContact ? "hidden md:block" : ""}`}>
              {conversations.map((conv) => (
                <motion.button
                  key={conv.contactId}
                  onClick={() => setSelectedContact(conv.contactId)}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                    selectedContact === conv.contactId ? "bg-primary/10" : "hover:bg-muted"
                  }`}
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {getInitials(getName(conv.contactId))}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">{getName(conv.contactId)}</p>
                      {conv.unreadCount > 0 && (
                        <motion.span
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="h-5 min-w-5 px-1.5 text-[10px] rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                        >
                          {conv.unreadCount}
                        </motion.span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{conv.lastMessage.content}</p>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Conversation thread */}
            <div className={`border rounded-lg flex flex-col ${!selectedContact ? "hidden md:flex" : ""}`}>
              {selectedContact ? (
                <>
                  <div className="flex items-center gap-2 p-3 border-b">
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedContact(null)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {getInitials(getName(selectedContact))}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-medium text-sm">{getName(selectedContact)}</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[400px]">
                    <AnimatePresence initial={false}>
                      {activeConversation?.messages.map((msg: any) => {
                        const isMe = msg.sender_id === user?.id;
                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                          >
                            <div className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                              isMe ? "bg-primary text-primary-foreground" : "bg-muted"
                            }`}>
                              <p>{msg.content}</p>
                              <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                {format(new Date(msg.created_at), "h:mm a")}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                    {/* Typing indicator */}
                    {isSending && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-end"
                      >
                        <div className="flex gap-1 items-center px-3 py-2 rounded-xl bg-primary/20">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="h-1.5 w-1.5 rounded-full bg-primary"
                              animate={{ y: [0, -4, 0] }}
                              transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="flex gap-2 p-3 border-t">
                    <Textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Type a message..."
                      rows={1}
                      className="flex-1 min-h-[40px]"
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && replyContent.trim()) { e.preventDefault(); sendReply.mutate(); } }}
                    />
                    <Button size="icon" onClick={() => sendReply.mutate()} disabled={!replyContent.trim() || sendReply.isPending}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                  Select a conversation to start messaging
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
