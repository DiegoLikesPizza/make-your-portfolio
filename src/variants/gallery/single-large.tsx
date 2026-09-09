import { Reveal } from "@/render/primitives/Reveal";
import { SectionIndex } from "@/render/primitives/Section";
import { GalleryImage } from "@/render/primitives/GalleryImage";
import type { SectionProps } from "@/render/context";

/** One image per row, full container width. */
export default function GallerySingleLarge({ section, index, ctx }: SectionProps<"gallery">) {
  const m = ctx.doc.design.tokens.motion;
  return (
    <div>
      <Reveal motionStyle={m}>
        <SectionIndex index={index} label={section.title} show />
      </Reveal>
      <ul className="mt-12 space-y-10">
        {section.data.items.map((item) => (
          <li key={item.id}>
            <Reveal motionStyle={m}>
              <GalleryImage item={item} ctx={ctx} aspect="16 / 9" />
            </Reveal>
          </li>
        ))}
      </ul>
    </div>
  );
}
