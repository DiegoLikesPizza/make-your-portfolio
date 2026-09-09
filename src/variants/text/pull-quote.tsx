import { Reveal } from "@/render/primitives/Reveal";
import { highlight } from "@/lib/text";
import type { SectionProps } from "@/render/context";

/** The body set as one oversized statement. Accent markup works here too. */
export default function TextPullQuote({ section, ctx }: SectionProps<"text">) {
  const m = ctx.doc.design.tokens.motion;
  return (
    <Reveal motionStyle={m}>
      <p
        className="mx-auto max-w-[24ch] text-center font-[family-name:var(--font-heading)] font-semibold leading-[1.05] tracking-[-0.02em] text-[var(--foreground)]"
        style={{ fontSize: "calc(clamp(2rem, 6vw, 4rem) * var(--type-scale))" }}
      >
        {highlight(section.data.body)}
      </p>
    </Reveal>
  );
}
