import { Reveal } from "@/render/primitives/Reveal";
import { SectionIndex } from "@/render/primitives/Section";
import type { SectionProps } from "@/render/context";

export default function StatsCards({ section, index, ctx }: SectionProps<"stats">) {
  const m = ctx.doc.design.tokens.motion;
  return (
    <div>
      <Reveal motionStyle={m}>
        <SectionIndex index={index} label={section.title} show />
      </Reveal>
      <dl className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {section.data.items.map((s, i) => (
          <Reveal key={s.id} motionStyle={m} delay={i * 0.05}>
            <div className="h-full rounded-[var(--radius)] border border-[var(--border-color)] bg-[var(--surface)] p-6">
              <dt className="font-[family-name:var(--font-heading)] text-4xl font-semibold text-[var(--foreground)]">
                {s.value}
                {s.suffix && <span className="text-[var(--accent)]">{s.suffix}</span>}
              </dt>
              <dd className="mt-2 text-sm text-[var(--foreground-muted)]">{s.label}</dd>
            </div>
          </Reveal>
        ))}
      </dl>
    </div>
  );
}
