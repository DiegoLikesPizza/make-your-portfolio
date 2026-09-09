import { Reveal } from "@/render/primitives/Reveal";
import { SectionIndex } from "@/render/primitives/Section";
import { GalleryImage } from "@/render/primitives/GalleryImage";
import type { SectionProps } from "@/render/context";

/** Scroll-snap carousel — native scrolling, no library, keyboard works. */
export default function GalleryCarousel({ section, index, ctx }: SectionProps<"gallery">) {
  const m = ctx.doc.design.tokens.motion;
  return (
    <div>
      <Reveal motionStyle={m}>
        <SectionIndex index={index} label={section.title} show />
      </Reveal>
      <ul className="mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
        {section.data.items.map((item) => (
          <li key={item.id} className="w-[min(80%,30rem)] shrink-0 snap-center">
            <GalleryImage item={item} ctx={ctx} aspect="4 / 3" />
          </li>
        ))}
      </ul>
    </div>
  );
}
