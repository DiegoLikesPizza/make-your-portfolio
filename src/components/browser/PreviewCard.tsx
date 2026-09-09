import type { ReactNode } from "react";

/**
 * One layout, rendered live and labelled.
 *
 * The preview is the real component with real tokens, not a screenshot — so it
 * cannot drift from what publishing actually produces.
 */
export function PreviewCard({
  title, subtitle, note, children,
}: {
  title: string;
  subtitle?: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <h3 className="font-medium text-neutral-900 dark:text-white">{title}</h3>
        {subtitle && <code className="text-xs text-neutral-400">{subtitle}</code>}
        {note && (
          <p className="w-full text-xs text-amber-700 dark:text-amber-400">{note}</p>
        )}
      </header>

      {/* The preview scrolls inside its own box; a wide layout must never make
          the page itself scroll sideways. */}
      <div className="overflow-x-auto">
        <div className="min-w-[320px]">{children}</div>
      </div>
    </section>
  );
}
