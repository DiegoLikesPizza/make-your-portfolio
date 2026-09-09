import { Reveal } from "@/render/primitives/Reveal";
import { SectionIndex } from "@/render/primitives/Section";
import type { SectionProps } from "@/render/context";

export default function StatsNumberRow({ section, index, ctx }: SectionProps<"stats">) {
  const m = ctx.doc.design.tokens.motion;
  return (
    <div>
      <Reveal motionStyle={m}>
        <SectionIndex index={index} label={section.title} show />
      </Reveal>
      <dl className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {section.data.items.map((s, i) => (
          <Reveal key={s.id} motionStyle={m} delay={i * 0.05}>
            <dt
              className="font-[family-name:var(--font-heading)] font-semibold leading-none tracking-[-0.02em] text-[var(--foreground)]"
              style={{ fontSize: "calc(clamp(2.5rem, 5vw, 3.75rem) * var(--type-scale))" }}
            >
              {s.value}
              {s.suffix && <span className="text-[var(--accent)]">{s.suffix}</span>}
            </dt>
            <dd className="mt-3 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
              {s.label}
            </dd>
          </Reveal>
        ))}
      </dl>
    </div>
  );
}
