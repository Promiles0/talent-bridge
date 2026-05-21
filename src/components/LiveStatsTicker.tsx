import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMotionValue, useTransform, animate, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { Briefcase, Users, ShieldCheck, GraduationCap } from "lucide-react";

function Count({ value }: { value: number }) {
  const m = useMotionValue(0);
  const r = useTransform(m, (v) => Math.round(v).toLocaleString());
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const c = animate(m, value, { duration: 1.4, ease: "easeOut" });
    return c.stop;
  }, [value, m]);
  useEffect(() => r.on("change", (v) => { if (ref.current) ref.current.textContent = v; }), [r]);
  return <span ref={ref}>0</span>;
}

export function LiveStatsTicker() {
  const { data } = useQuery({
    queryKey: ["live-stats"],
    queryFn: async () => {
      const [int, stu, comp] = await Promise.all([
        supabase.from("internships").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("companies").select("id", { count: "exact", head: true }).eq("verified", true),
      ]);
      const { count: hired } = await supabase
        .from("applications").select("id", { count: "exact", head: true }).eq("status", "offered");
      return {
        internships: int.count ?? 0,
        students: stu.count ?? 0,
        verified: comp.count ?? 0,
        hired: hired ?? 0,
      };
    },
    refetchInterval: 60_000,
  });

  const items = [
    { icon: Briefcase, label: "open internships", value: data?.internships ?? 0, color: "text-primary" },
    { icon: GraduationCap, label: "students joined", value: data?.students ?? 0, color: "text-secondary" },
    { icon: Users, label: "successful hires", value: data?.hired ?? 0, color: "text-primary" },
    { icon: ShieldCheck, label: "verified employers", value: data?.verified ?? 0, color: "text-secondary" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
      {items.map((it, i) => (
        <motion.div
          key={it.label}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.08 }}
          className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-4 text-center"
        >
          <it.icon className={`h-5 w-5 mx-auto mb-2 ${it.color}`} />
          <p className="font-heading text-2xl font-bold tabular-nums">
            <Count value={it.value} />
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{it.label}</p>
        </motion.div>
      ))}
    </div>
  );
}
