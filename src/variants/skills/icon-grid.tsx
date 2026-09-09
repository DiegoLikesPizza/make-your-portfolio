import { Reveal } from "@/render/primitives/Reveal";
import { SectionIndex } from "@/render/primitives/Section";
import { LinkIcon } from "@/render/primitives/LinkIcon";
import type { SectionProps } from "@/render/context";

/** A dense tile grid. Items without an icon still get a tile, just text-only. */
export default function SkillsIconGrid({ section, index, ctx }: SectionProps<"skills">) {
  const m = ctx.doc.design.tokens.motion;
  return (
    <div>
      <Reveal motionStyle={m}>
        <SectionIndex index={index} label={section.title} show />
      </Reveal>
      <div className="mt-12 space-y-10">
        {section.data.groups.map((g, gi) => (
          <div key={g.id}>
            <h3 className="mb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
              {g.label}
            </h3>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {g.items.map((s, i) => (
                <li key={s.id}>
                  <Reveal motionStyle={m} delay={(gi * 4 + i) * 0.02}>
                    <div className="flex items-center gap-3 rounded-[var(--radius)] border border-[var(--border-color)] bg-[var(--surface)] px-4 py-3 transition-colors hover:border-[var(--accent)]">
                      <LinkIcon name={s.icon} className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                      <span className="truncate text-sm text-[var(--foreground)]">{s.label}</span>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
