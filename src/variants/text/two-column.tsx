import { Reveal } from "@/render/primitives/Reveal";
import { SectionIndex } from "@/render/primitives/Section";
import type { SectionProps } from "@/render/context";

/** Newspaper columns. Falls back to one column below `md`. */
export default function TextTwoColumn({ section, index, ctx }: SectionProps<"text">) {
  const m = ctx.doc.design.tokens.motion;
  return (
    <div>
      <Reveal motionStyle={m}>
        <SectionIndex index={index} label={section.title} show />
      </Reveal>
      <Reveal motionStyle={m} delay={0.08}>
        <div className="mt-10 space-y-5 leading-relaxed text-[var(--foreground-muted)] md:columns-2 md:gap-12 md:space-y-0">
          {section.data.body.split(/\n\n+/).map((p, i) => (
            <p key={i} className="mb-5 break-inside-avoid">
              {p}
            </p>
          ))}
        </div>
      </Reveal>
    </div>
  );
}
