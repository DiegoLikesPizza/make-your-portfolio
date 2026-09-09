import { Reveal } from "@/render/primitives/Reveal";
import { SectionIndex } from "@/render/primitives/Section";
import type { SectionProps } from "@/render/context";

export default function SkillsGroupedColumns({ section, index, ctx }: SectionProps<"skills">) {
  const m = ctx.doc.design.tokens.motion;
  return (
    <div>
      <Reveal motionStyle={m}>
        <SectionIndex index={index} label={section.title} show />
      </Reveal>
      <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {section.data.groups.map((g, i) => (
          <Reveal key={g.id} motionStyle={m} delay={i * 0.05}>
            <h3 className="border-b border-[var(--border-color)] pb-2 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
              {g.label}
            </h3>
            <ul className="mt-4 space-y-2">
              {g.items.map((s) => (
                <li key={s.id} className="text-[var(--foreground-muted)]">{s.label}</li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
