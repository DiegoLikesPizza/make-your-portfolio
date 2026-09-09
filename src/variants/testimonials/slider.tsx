import { Reveal } from "@/render/primitives/Reveal";
import { SectionIndex } from "@/render/primitives/Section";
import { Attribution } from "@/render/primitives/Attribution";
import type { SectionProps } from "@/render/context";

/**
 * A scroll-snap slider — no JS, no carousel library.
 *
 * Native overflow scrolling keeps keyboard and touch behaviour correct for
 * free, which a hand-rolled carousel almost never manages.
 */
export default function TestimonialsSlider({ section, index, ctx }: SectionProps<"testimonials">) {
  const m = ctx.doc.design.tokens.motion;
  return (
    <div>
      <Reveal motionStyle={m}>
        <SectionIndex index={index} label={section.title} show />
      </Reveal>
      <ul className="mt-12 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4">
        {section.data.items.map((t) => (
          <li key={t.id} className="w-[min(90%,34rem)] shrink-0 snap-center">
            <figure className="h-full rounded-[var(--radius)] border border-[var(--border-color)] bg-[var(--surface)] p-8">
              <blockquote className="font-[family-name:var(--font-heading)] text-xl leading-snug text-[var(--foreground)]">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <Attribution className="mt-6" name={t.author} role={t.role} avatarId={t.avatarAssetId} ctx={ctx} />
            </figure>
          </li>
        ))}
      </ul>
    </div>
  );
}
