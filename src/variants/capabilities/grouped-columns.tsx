import { Reveal } from "@/render/primitives/Reveal";
import { SectionIndex } from "@/render/primitives/Section";
import { LinkIcon } from "@/render/primitives/LinkIcon";
import type { SectionProps } from "@/render/context";

/** Numbered columns, no cards — closer to a table of contents than a grid. */
export default function CapabilitiesGroupedColumns({ section, index, ctx }: SectionProps<"capabilities">) {
  const m = ctx.doc.design.tokens.motion;
  const { headline, items, chips } = section.data;
  return (
    <div>
      <Reveal motionStyle={m}>
        <SectionIndex index={index} label={section.title} show />
        {headline && (
          <h2 className="mt-8 max-w-[22ch] font-[family-name:var(--font-heading)] text-3xl font-semibold text-[var(--foreground)]">
            {headline}
          </h2>
        )}
      </Reveal>
      <div className="mt-12 grid gap-10 border-t border-[var(--border-color)] pt-10 md:grid-cols-3">
        {items.map((item, i) => (
          <Reveal key={item.id} motionStyle={m} delay={i * 0.06}>
            <div className="flex items-baseline gap-3">
              <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--foreground-subtle)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <LinkIcon name={item.icon} className="h-4 w-4 text-[var(--accent)]" />
            </div>
            <h3 className="mt-3 font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--foreground)]">
              {item.title}
            </h3>
            <p className="mt-2 leading-relaxed text-[var(--foreground-muted)]">{item.body}</p>
          </Reveal>
        ))}
      </div>
      {chips.length > 0 && (
        <ul className="mt-10 flex flex-wrap gap-x-5 gap-y-2">
          {chips.map((c) => (
            <li key={c.id} className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
              {c.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
