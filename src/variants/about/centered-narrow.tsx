import { Reveal } from "@/render/primitives/Reveal";
import { SectionIndex } from "@/render/primitives/Section";
import type { SectionProps } from "@/render/context";
import { highlight } from "@/lib/text";

export default function AboutCenteredNarrow({ section, index, ctx }: SectionProps<"about">) {
  const m = ctx.doc.design.tokens.motion;
  const { lead, body, footnote } = section.data;

  return (
    <div className="mx-auto max-w-[62ch] text-center">
      <Reveal motionStyle={m}>
        <div className="flex justify-center">
          <SectionIndex index={index} label={section.title} show />
        </div>
      </Reveal>
      <Reveal motionStyle={m} delay={0.08}>
        <p className="mt-10 font-[family-name:var(--font-heading)] text-2xl font-medium leading-snug text-[var(--foreground)] md:text-[1.75rem]">
          {highlight(lead)}
        </p>
      </Reveal>
      <Reveal motionStyle={m} delay={0.14}>
        <div className="mt-8 space-y-5 text-lg leading-relaxed text-[var(--foreground-muted)]">
          {body.split(/\n\n+/).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </Reveal>
      {footnote && (
        <p className="mt-10 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
          {footnote}
        </p>
      )}
    </div>
  );
}
