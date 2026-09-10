import { Reveal } from "@/render/primitives/Reveal";
import { SectionIndex } from "@/render/primitives/Section";
import type { SectionProps } from "@/render/context";
import { highlight } from "@/lib/text";

/** About inside a raised surface — reads well against a busy background. */
export default function AboutCard({ section, index, ctx }: SectionProps<"about">) {
  const m = ctx.doc.design.tokens.motion;
  const { lead, body, footnote, stats } = section.data;

  return (
    <Reveal motionStyle={m}>
      <div className="rounded-[var(--radius)] border border-[var(--border-color)] bg-[var(--surface)] p-8 shadow-[var(--shadow)] md:p-12">
        <SectionIndex index={index} label={section.title} show />
        <p className="mt-8 max-w-[46ch] font-[family-name:var(--font-heading)] text-2xl font-medium leading-snug text-[var(--foreground)]">
          {highlight(lead)}
        </p>
        <div className="mt-6 max-w-[62ch] space-y-5 leading-relaxed text-[var(--foreground-muted)]">
          {body.split(/\n\n+/).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        {stats.length > 0 && (
          <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-5">
            {stats.map((s) => (
              <div key={s.id}>
                <dt className="font-[family-name:var(--font-heading)] text-3xl font-semibold text-[var(--foreground)]">{s.value}</dt>
                <dd className="mt-1 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
                  {s.label}
                </dd>
              </div>
            ))}
          </dl>
        )}
        {footnote && (
          <p className="mt-8 border-t border-[var(--border-color)] pt-5 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
            {footnote}
          </p>
        )}
      </div>
    </Reveal>
  );
}
