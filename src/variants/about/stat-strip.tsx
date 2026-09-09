import { Reveal } from "@/render/primitives/Reveal";
import { SectionIndex } from "@/render/primitives/Section";
import type { SectionProps } from "@/render/context";

/**
 * Same data as every other About variant — this one simply also surfaces
 * `stats`, which `two-col-index` ignores. The editor flags that difference.
 */
export default function AboutStatStrip({ section, index, ctx }: SectionProps<"about">) {
  const m = ctx.doc.design.tokens.motion;
  const { lead, body, stats } = section.data;

  return (
    <div>
      <Reveal motionStyle={m}>
        <SectionIndex index={index} label={section.title} show />
      </Reveal>
      <Reveal motionStyle={m} delay={0.08}>
        <p className="mt-10 max-w-[46ch] font-[family-name:var(--font-heading)] text-2xl font-medium leading-snug text-[var(--foreground)] md:text-[1.75rem]">
          {lead}
        </p>
      </Reveal>
      <Reveal motionStyle={m} delay={0.14}>
        <div className="mt-8 max-w-[60ch] space-y-5 text-lg leading-relaxed text-[var(--foreground-muted)]">
          {body.split(/\n\n+/).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </Reveal>
      {stats.length > 0 && (
        <Reveal motionStyle={m} delay={0.2}>
          <dl className="mt-14 grid gap-6 border-t border-[var(--border-color)] pt-10 sm:grid-cols-3">
            {stats.map((s) => (
              <div key={s.id}>
                <dt className="font-[family-name:var(--font-heading)] text-4xl font-semibold text-[var(--foreground)]">
                  {s.value}
                </dt>
                <dd className="mt-2 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
                  {s.label}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      )}
    </div>
  );
}
