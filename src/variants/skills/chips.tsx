import { Reveal } from "@/render/primitives/Reveal";
import { SectionIndex } from "@/render/primitives/Section";
import type { SectionProps } from "@/render/context";

export default function SkillsChips({ section, index, ctx }: SectionProps<"skills">) {
  const m = ctx.doc.design.tokens.motion;

  return (
    <div>
      <Reveal motionStyle={m}>
        <SectionIndex index={index} label={section.title} show />
      </Reveal>
      <div className="mt-12 space-y-8">
        {section.data.groups.map((g, i) => (
          <Reveal key={g.id} motionStyle={m} delay={i * 0.05}>
            <h3 className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
              {g.label}
            </h3>
            <ul className="mt-3 flex flex-wrap gap-2.5">
              {g.items.map((s) => (
                <li
                  key={s.id}
                  className="rounded-full border border-[var(--border-color)] bg-[var(--surface)] px-3.5 py-1.5 font-[family-name:var(--font-mono)] text-xs text-[var(--foreground-muted)]"
                >
                  {s.label}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
