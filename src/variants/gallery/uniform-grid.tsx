import { Reveal } from "@/render/primitives/Reveal";
import { SectionIndex } from "@/render/primitives/Section";
import { GalleryImage } from "@/render/primitives/GalleryImage";
import type { SectionProps } from "@/render/context";
import { option } from "@/lib/variant-options";

// Written out rather than interpolated: Tailwind scans source text for class
// names, and `lg:grid-cols-${n}` produces no CSS at all.
const COLUMNS = { "2": "lg:grid-cols-2", "3": "lg:grid-cols-3", "4": "lg:grid-cols-4" } as const;

export default function GalleryUniformGrid({ section, index, ctx }: SectionProps<"gallery">) {
  const m = ctx.doc.design.tokens.motion;
  return (
    <div>
      <Reveal motionStyle={m}>
        <SectionIndex index={index} label={section.title} show />
      </Reveal>
      <ul className={`mt-12 grid gap-4 sm:grid-cols-2 ${COLUMNS[option(section, "columns")]}`}>
        {section.data.items.map((item, i) => (
          <li key={item.id}>
            <Reveal motionStyle={m} delay={i * 0.04}>
              <GalleryImage item={item} ctx={ctx} aspect="1 / 1" />
            </Reveal>
          </li>
        ))}
      </ul>
    </div>
  );
}
