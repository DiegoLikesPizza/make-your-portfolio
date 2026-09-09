import { cn } from "@/lib/utils";
import type { Project } from "@/lib/schema/sections";

const LABELS: Record<Project["status"], string | null> = {
  live: "Live",
  archived: "Archived",
  wip: "In progress",
  none: null,
};

export function StatusBadge({ status, className }: { status: Project["status"]; className?: string }) {
  const label = LABELS[status];
  if (!label) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-[family-name:var(--font-mono)] text-[0.65rem] uppercase tracking-[0.12em]",
        status === "live" ? "text-[var(--accent)]" : "text-[var(--foreground-subtle)]",
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", status === "live" ? "bg-[var(--accent)]" : "bg-[var(--foreground-subtle)]")} />
      {label}
    </span>
  );
}
