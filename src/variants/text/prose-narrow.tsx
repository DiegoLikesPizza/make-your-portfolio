import { Reveal } from "@/render/primitives/Reveal";
import { SectionIndex } from "@/render/primitives/Section";
import type { SectionProps } from "@/render/context";

export default function TextProseNarrow({ section, index, ctx }: SectionProps<"text">) {
  const m = ctx.doc.design.tokens.motion;

  return (
    <div className="max-w-[68ch]">
      <Reveal motionStyle={m}>
        <SectionIndex index={index} label={section.title} show />
      </Reveal>
      <Reveal motionStyle={m} delay={0.08}>
        <div className="mt-10 space-y-5 text-lg leading-relaxed text-[var(--foreground-muted)]">
          {section.data.body.split(/\n\n+/).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </Reveal>
    </div>
  );
}
