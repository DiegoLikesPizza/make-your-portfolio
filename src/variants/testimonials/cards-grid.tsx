import { Reveal } from "@/render/primitives/Reveal";
import { SectionIndex } from "@/render/primitives/Section";
import { Attribution } from "@/render/primitives/Attribution";
import type { SectionProps } from "@/render/context";

export default function TestimonialsCardsGrid({ section, index, ctx }: SectionProps<"testimonials">) {
  const m = ctx.doc.design.tokens.motion;
  return (
    <div>
      <Reveal motionStyle={m}>
        <SectionIndex index={index} label={section.title} show />
      </Reveal>
      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {section.data.items.map((t, i) => (
          <Reveal key={t.id} motionStyle={m} delay={i * 0.05}>
            <figure className="flex h-full flex-col rounded-[var(--radius)] border border-[var(--border-color)] bg-[var(--surface)] p-6">
              <blockquote className="flex-1 leading-relaxed text-[var(--foreground-muted)]">&ldquo;{t.quote}&rdquo;</blockquote>
              <Attribution className="mt-6" name={t.author} role={t.role} avatarId={t.avatarAssetId} ctx={ctx} />
            </figure>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
