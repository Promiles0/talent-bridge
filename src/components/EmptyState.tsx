import { type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

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
    <Card>
      <CardContent className="py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-heading text-lg font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">{description}</p>
        {actionLabel && actionHref && (
          <Button asChild size="sm">
            <Link to={actionHref}>{actionLabel}</Link>
          </Button>
        )}
        {actionLabel && onAction && !actionHref && (
          <Button size="sm" onClick={onAction}>{actionLabel}</Button>
        )}
      </CardContent>
    </Card>
  );
}
