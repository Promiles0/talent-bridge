import { type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, actionHref, onAction }: EmptyStateProps) {
  return (
    <Card className="glass-card-themed overflow-hidden relative">
      <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-secondary/10 blur-3xl" />
      <CardContent className="py-14 text-center relative">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 180, damping: 14 }}
          className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center"
        >
          <motion.span
            className="absolute inset-0 rounded-full bg-primary/15"
            animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2.4, repeat: Infinity }}
          />
          <span className="absolute inset-2 rounded-full bg-primary/10" />
          <Icon className="h-9 w-9 text-primary relative z-10" />
        </motion.div>
        <motion.h3
          initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
          className="font-heading text-lg font-semibold mb-1"
        >{title}</motion.h3>
        <motion.p
          initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}
          className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto"
        >{description}</motion.p>
        {actionLabel && actionHref && (
          <Button asChild size="sm" className="hover-scale">
            <Link to={actionHref}>{actionLabel}</Link>
          </Button>
        )}
        {actionLabel && onAction && !actionHref && (
          <Button size="sm" onClick={onAction} className="hover-scale">{actionLabel}</Button>
        )}
      </CardContent>
    </Card>
  );
}
