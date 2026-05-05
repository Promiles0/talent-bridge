interface Props { active?: boolean; label?: string }

export function TypingIndicator({ active, label = "typing" }: Props) {
  if (!active) return null;
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-3 py-1">
      <span className="flex gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "120ms" }} />
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "240ms" }} />
      </span>
      <span>{label}…</span>
    </div>
  );
}
