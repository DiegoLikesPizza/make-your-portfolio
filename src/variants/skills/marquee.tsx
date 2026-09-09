import { Reveal } from "@/render/primitives/Reveal";
import { SectionIndex } from "@/render/primitives/Section";
import { Marquee } from "@/render/primitives/Marquee";
import type { SectionProps } from "@/render/context";

/** One scrolling row per group. Group labels sit to the left, static. */
export default function SkillsMarquee({ section, index, ctx }: SectionProps<"skills">) {
  const m = ctx.doc.design.tokens.motion;
  return (
    <div>
      <Reveal motionStyle={m}>
        <SectionIndex index={index} label={section.title} show />
      </Reveal>
      <div className="mt-12 space-y-8">
        {section.data.groups.map((g, i) => (
          <div key={g.id}>
            <h3 className="mb-3 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
              {g.label}
            </h3>
            <Marquee speed={30 + i * 6}>
              {g.items.map((s) => (
                <span
                  key={s.id}
                  className="whitespace-nowrap font-[family-name:var(--font-heading)] text-2xl font-medium text-[var(--foreground-muted)]"
                >
                  {s.label}
                </span>
              ))}
            </Marquee>
          </div>
        ))}
      </div>
    </div>
  );
}
