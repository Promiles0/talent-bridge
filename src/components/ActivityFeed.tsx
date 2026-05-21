import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Briefcase, CheckCircle2, FileSignature, MessageSquare, Trophy, Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

interface Item {
  id: string;
  icon: any;
  text: string;
  at: string;
  color: string;
  href?: string;
}

const typeIcon: Record<string, { icon: any; color: string }> = {
  application_status: { icon: Briefcase, color: "text-primary" },
  message: { icon: MessageSquare, color: "text-secondary" },
  offer: { icon: FileSignature, color: "text-green-500" },
  interview: { icon: CheckCircle2, color: "text-primary" },
  verification: { icon: CheckCircle2, color: "text-green-500" },
  achievement: { icon: Trophy, color: "text-yellow-500" },
};

export function ActivityFeed({ limit = 8 }: { limit?: number }) {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["activity-feed", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id, type, title, body, link, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(limit);
      return (data ?? []).map<Item>((n: any) => ({
        id: n.id,
        icon: typeIcon[n.type]?.icon ?? Bell,
        color: typeIcon[n.type]?.color ?? "text-muted-foreground",
        text: n.body ?? n.title,
        at: n.created_at,
        href: n.link,
      }));
    },
    enabled: !!user,
    refetchInterval: 30_000,
  });

  return (
    <Card className="glass-card-themed">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" /> Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!data?.length ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No activity yet — start applying to see updates here.</p>
        ) : (
          <ol className="relative space-y-3 pl-4">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
            {data.map((it, i) => {
              const Inner = (
                <motion.li
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="relative flex items-start gap-3"
                >
                  <span className={`relative z-10 -ml-4 mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-background border-2 border-border`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${it.color.replace("text-", "bg-")}`} />
                  </span>
                  <div className="flex-1 min-w-0 pl-2">
                    <p className="text-sm leading-snug flex items-start gap-2">
                      <it.icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${it.color}`} />
                      <span className="break-words">{it.text}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(it.at), { addSuffix: true })}
                    </p>
                  </div>
                </motion.li>
              );
              return it.href ? (
                <Link key={it.id} to={it.href} className="block hover:bg-muted/30 -mx-2 px-2 py-1 rounded-md transition-colors">{Inner}</Link>
              ) : (
                <div key={it.id}>{Inner}</div>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
