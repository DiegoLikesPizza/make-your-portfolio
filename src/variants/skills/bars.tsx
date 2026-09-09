import { Reveal } from "@/render/primitives/Reveal";
import { SectionIndex } from "@/render/primitives/Section";
import type { SectionProps } from "@/render/context";

/**
 * The only skills layout that reads `level`. Items without one render as a
 * plain row rather than an empty bar — a missing level is not zero skill.
 */
export default function SkillsBars({ section, index, ctx }: SectionProps<"skills">) {
  const m = ctx.doc.design.tokens.motion;
  return (
    <div>
      <Reveal motionStyle={m}>
        <SectionIndex index={index} label={section.title} show />
      </Reveal>
      <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-x-16">
        {section.data.groups.map((g, i) => (
          <Reveal key={g.id} motionStyle={m} delay={i * 0.05}>
            <h3 className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
              {g.label}
            </h3>
            <ul className="mt-4 space-y-3.5">
              {g.items.map((s) => (
                <li key={s.id}>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-sm text-[var(--foreground)]">{s.label}</span>
                    {s.level !== undefined && (
                      <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--foreground-subtle)]">{s.level}%</span>
                    )}
                  </div>
                  {s.level !== undefined && (
                    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[var(--background-secondary)]">
                      <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${s.level}%` }} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
