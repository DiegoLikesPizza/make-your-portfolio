import { Reveal } from "@/render/primitives/Reveal";
import { SectionIndex } from "@/render/primitives/Section";
import { Attribution } from "@/render/primitives/Attribution";
import type { SectionProps } from "@/render/context";

/** One oversized quote per row. The quietest, most confident testimonial layout. */
export default function TestimonialsLargeQuote({ section, index, ctx }: SectionProps<"testimonials">) {
  const m = ctx.doc.design.tokens.motion;
  return (
    <div>
      <Reveal motionStyle={m}>
        <SectionIndex index={index} label={section.title} show />
      </Reveal>
      <div className="mt-12 space-y-16">
        {section.data.items.map((t, i) => (
          <Reveal key={t.id} motionStyle={m} delay={i * 0.06}>
            <figure className="max-w-[46ch]">
              <blockquote
                className="font-[family-name:var(--font-heading)] font-medium leading-snug tracking-[-0.01em] text-[var(--foreground)]"
                style={{ fontSize: "calc(clamp(1.5rem, 3vw, 2.25rem) * var(--type-scale))" }}
              >
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <Attribution className="mt-6" name={t.author} role={t.role} avatarId={t.avatarAssetId} ctx={ctx} />
            </figure>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
