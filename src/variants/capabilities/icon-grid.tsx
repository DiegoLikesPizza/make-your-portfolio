import { Reveal } from "@/render/primitives/Reveal";
import { SectionIndex } from "@/render/primitives/Section";
import { LinkIcon } from "@/render/primitives/LinkIcon";
import type { SectionProps } from "@/render/context";

export default function CapabilitiesIconGrid({ section, index, ctx }: SectionProps<"capabilities">) {
  const m = ctx.doc.design.tokens.motion;
  const { headline, items, chips } = section.data;

  return (
    <div>
      <Reveal motionStyle={m}>
        <SectionIndex index={index} label={section.title} show />
        {headline && (
          <h2 className="mt-8 max-w-[24ch] font-[family-name:var(--font-heading)] text-3xl font-semibold text-[var(--foreground)]">
            {headline}
          </h2>
        )}
      </Reveal>
      <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, i) => (
          <Reveal key={item.id} motionStyle={m} delay={i * 0.04}>
            <LinkIcon name={item.icon} className="h-6 w-6 text-[var(--accent)]" />
            <h3 className="mt-4 font-[family-name:var(--font-heading)] font-semibold text-[var(--foreground)]">
              {item.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">{item.body}</p>
          </Reveal>
        ))}
      </div>
      {chips.length > 0 && (
        <ul className="mt-12 flex flex-wrap gap-x-5 gap-y-2 border-t border-[var(--border-color)] pt-8">
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
