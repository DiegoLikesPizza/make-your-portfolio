import { Reveal } from "@/render/primitives/Reveal";
import { SectionIndex } from "@/render/primitives/Section";
import { GalleryImage } from "@/render/primitives/GalleryImage";
import type { SectionProps } from "@/render/context";

/** Columns masonry; images keep their own aspect ratio. */
export default function GalleryMasonry({ section, index, ctx }: SectionProps<"gallery">) {
  const m = ctx.doc.design.tokens.motion;
  return (
    <div>
      <Reveal motionStyle={m}>
        <SectionIndex index={index} label={section.title} show />
      </Reveal>
      <div className="mt-12 gap-4 sm:columns-2 lg:columns-3">
        {section.data.items.map((item, i) => (
          <div key={item.id} className="mb-4 break-inside-avoid">
            <Reveal motionStyle={m} delay={i * 0.03}>
              <GalleryImage item={item} ctx={ctx} />
            </Reveal>
          </div>
        ))}
      </div>
    </div>
  );
}
