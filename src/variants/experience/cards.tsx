import { HistoryCards } from "../history/layouts";
import { fromExperience } from "../history/shared";
import type { SectionProps } from "@/render/context";

export default function Variant({ section, index, ctx }: SectionProps<"experience">) {
  return (
    <HistoryCards
      rows={fromExperience(section)}
      index={index}
      title={section.title}
      motion={ctx.doc.design.tokens.motion}
    />
  );
}
