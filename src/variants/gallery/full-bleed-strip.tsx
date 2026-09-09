import { GalleryImage } from "@/render/primitives/GalleryImage";
import type { SectionProps } from "@/render/context";

/**
 * Edge-to-edge horizontal strip.
 *
 * The one layout that ignores the container width token, so it is registered as
 * a bleed variant and SectionFrame skips its wrapper.
 */
export default function GalleryFullBleedStrip({ section, ctx }: SectionProps<"gallery">) {
  return (
    <ul className="flex gap-2 overflow-x-auto px-2">
      {section.data.items.map((item) => (
        <li key={item.id} className="w-[min(70vw,26rem)] shrink-0">
          <GalleryImage item={item} ctx={ctx} aspect="3 / 4" className="!rounded-none" />
        </li>
      ))}
    </ul>
  );
}
