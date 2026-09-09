import { TimelineVertical } from "../history/layouts";
import { fromEducation } from "../history/shared";
import type { SectionProps } from "@/render/context";

export default function Variant({ section, index, ctx }: SectionProps<"education">) {
  return (
    <TimelineVertical
      rows={fromEducation(section)}
      index={index}
      title={section.title}
      motion={ctx.doc.design.tokens.motion}
    />
  );
}
