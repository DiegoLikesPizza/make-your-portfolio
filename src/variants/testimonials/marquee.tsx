import { Reveal } from "@/render/primitives/Reveal";
import { SectionIndex } from "@/render/primitives/Section";
import { Attribution } from "@/render/primitives/Attribution";
import { Marquee } from "@/render/primitives/Marquee";
import type { SectionProps } from "@/render/context";

export default function TestimonialsMarquee({ section, index, ctx }: SectionProps<"testimonials">) {
  const m = ctx.doc.design.tokens.motion;
  return (
    <div>
      <Reveal motionStyle={m}>
        <SectionIndex index={index} label={section.title} show />
      </Reveal>
      <div className="mt-12">
        <Marquee speed={50}>
          {section.data.items.map((t) => (
            <figure
              key={t.id}
              className="w-[22rem] shrink-0 rounded-[var(--radius)] border border-[var(--border-color)] bg-[var(--surface)] p-6"
            >
              <blockquote className="text-sm leading-relaxed text-[var(--foreground-muted)]">&ldquo;{t.quote}&rdquo;</blockquote>
              <Attribution className="mt-5" name={t.author} role={t.role} avatarId={t.avatarAssetId} ctx={ctx} />
            </figure>
          ))}
        </Marquee>
      </div>
    </div>
  );
}
