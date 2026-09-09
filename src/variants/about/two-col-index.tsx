import { Reveal } from "@/render/primitives/Reveal";
import { SectionIndex } from "@/render/primitives/Section";
import type { SectionProps } from "@/render/context";

/** lfdiego.xyz's About: index label and monogram left, bio right. */
export default function AboutTwoColIndex({ section, index, ctx }: SectionProps<"about">) {
  const m = ctx.doc.design.tokens.motion;
  const { lead, body, footnote } = section.data;

  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
      <div className="lg:col-span-4">
        <Reveal motionStyle={m}>
          <SectionIndex index={index} label={section.title} show />
          <div className="mt-10">
            <span className="font-[family-name:var(--font-heading)] text-5xl font-semibold tracking-tight text-[var(--foreground)]">
              {ctx.doc.profile.initials}
            </span>
            {footnote && (
              <p className="mt-5 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
                {footnote}
              </p>
            )}
          </div>
        </Reveal>
      </div>

      <div className="lg:col-span-8">
        <Reveal motionStyle={m} delay={0.08}>
          <p className="max-w-[46ch] font-[family-name:var(--font-heading)] text-2xl font-medium leading-snug tracking-[-0.01em] text-[var(--foreground)] md:text-[1.75rem]">
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
      </div>
    </div>
  );
}
