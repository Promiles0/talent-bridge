import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type PresenceStatus = "online" | "away" | "offline";

export interface PresenceRow {
  user_id: string;
  last_seen_at: string;
  status: PresenceStatus;
}

/** Heartbeat the current user as online + subscribe to all presence rows. */
export function usePresenceHeartbeat() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    const beat = async () => {
      await supabase.from("presence").upsert({
        user_id: user.id,
        last_seen_at: new Date().toISOString(),
        status: "online",
      });
    };
    beat();
    const id = setInterval(beat, 30_000);
    const onLeave = async () => {
      await supabase.from("presence").upsert({
        user_id: user.id,
        last_seen_at: new Date().toISOString(),
        status: "offline",
      });
    };
    window.addEventListener("beforeunload", onLeave);
    return () => {
      clearInterval(id);
      window.removeEventListener("beforeunload", onLeave);
    };
  }, [user]);
}

/** Read presence statuses for a list of user ids and stay live. */
export function usePresenceFor(userIds: string[]) {
  const [map, setMap] = useState<Record<string, PresenceStatus>>({});
  const key = userIds.slice().sort().join(",");

  useEffect(() => {
    if (!userIds.length) return;
    let active = true;
    const load = async () => {
      const { data } = await supabase
        .from("presence")
        .select("user_id,last_seen_at,status")
        .in("user_id", userIds);
      if (!active || !data) return;
      const now = Date.now();
      const next: Record<string, PresenceStatus> = {};
      for (const row of data as PresenceRow[]) {
        const seen = new Date(row.last_seen_at).getTime();
        const stale = now - seen > 90_000;
        next[row.user_id] = stale ? "offline" : row.status;
      }
      setMap(next);
    };
    load();
    const ch = supabase
      .channel(`presence-${key}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "presence" },
        () => load()
      )
      .subscribe();
    const refresh = setInterval(load, 60_000);
    return () => {
      active = false;
      supabase.removeChannel(ch);
      clearInterval(refresh);
    };
  }, [key]);

  return map;
}

/** Typing indicator helper for a 1:1 conversation. */
export function useTypingIndicator(otherUserId?: string) {
  const { user } = useAuth();
  const [othersTyping, setOthersTyping] = useState(false);
  const last = useRef(0);

  const conversationKey =
    user && otherUserId
      ? [user.id, otherUserId].sort().join("|")
      : null;

  const ping = useCallback(async () => {
    if (!user || !conversationKey) return;
    const now = Date.now();
    if (now - last.current < 1500) return;
    last.current = now;
    await supabase.from("typing_indicators").upsert({
      conversation_key: conversationKey,
      user_id: user.id,
      updated_at: new Date().toISOString(),
    });
  }, [user, conversationKey]);

  useEffect(() => {
    if (!conversationKey || !user) return;
    const ch = supabase
      .channel(`typing-${conversationKey}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "typing_indicators", filter: `conversation_key=eq.${conversationKey}` },
        async () => {
          const { data } = await supabase
            .from("typing_indicators")
            .select("user_id,updated_at")
            .eq("conversation_key", conversationKey);
          const now = Date.now();
          const someoneElse = (data ?? []).some(
            (r) => r.user_id !== user.id && now - new Date(r.updated_at).getTime() < 4000
          );
          setOthersTyping(someoneElse);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [conversationKey, user]);

  return { othersTyping, ping };
}
