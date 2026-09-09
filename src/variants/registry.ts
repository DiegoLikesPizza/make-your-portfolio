import type { ComponentType } from "react";
import type { SectionProps } from "@/render/context";
import { SECTION_VARIANTS, type SectionType } from "@/lib/schema/sections";

import AboutTwoColIndex from "./about/two-col-index";
import AboutCenteredNarrow from "./about/centered-narrow";
import AboutStatStrip from "./about/stat-strip";
import CapabilitiesCards from "./capabilities/cards";
import CapabilitiesIconGrid from "./capabilities/icon-grid";
import ProjectsNumberedList from "./projects/numbered-list";
import ProjectsGrid3 from "./projects/grid-3";
import ProjectsTable from "./projects/table";
import ProjectsCards from "./projects/cards";
import ProjectsGrid2 from "./projects/grid-2";
import ProjectsAlternatingShowcase from "./projects/alternating-showcase";
import ProjectsFeaturedPlusList from "./projects/featured-plus-list";
import ProjectsMasonry from "./projects/masonry";
import ContactChannelList from "./contact/channel-list";
import ContactBigCta from "./contact/big-cta";
import ContactCardGrid from "./contact/card-grid";
import ContactMergedFooter from "./contact/merged-footer";
import ContactSplitWithForm from "./contact/split-with-form";
import TextTwoColumn from "./text/two-column";
import TextCallout from "./text/callout";
import TextPullQuote from "./text/pull-quote";
import SkillsChips from "./skills/chips";
import SkillsGroupedColumns from "./skills/grouped-columns";
import SkillsIconGrid from "./skills/icon-grid";
import SkillsBars from "./skills/bars";
import SkillsMarquee from "./skills/marquee";
import AboutPortraitLeft from "./about/portrait-left";
import AboutCard from "./about/card";
import CapabilitiesChipsOnly from "./capabilities/chips-only";
import CapabilitiesGroupedColumns from "./capabilities/grouped-columns";
import CapabilitiesMarquee from "./capabilities/marquee";
import ExperienceTimeline from "./experience/timeline-vertical";
import ExperienceTwoCol from "./experience/two-col-list";
import ExperienceTable from "./experience/table";
import ExperienceCards from "./experience/cards";
import EducationTimeline from "./education/timeline-vertical";
import EducationTwoCol from "./education/two-col-list";
import EducationTable from "./education/table";
import EducationCards from "./education/cards";
import TextProseNarrow from "./text/prose-narrow";
import TestimonialsLargeQuote from "./testimonials/large-quote";
import TestimonialsCardsGrid from "./testimonials/cards-grid";
import TestimonialsMarquee from "./testimonials/marquee";
import TestimonialsSlider from "./testimonials/slider";
import StatsNumberRow from "./stats/number-row";
import StatsCards from "./stats/cards";
import StatsInlineStrip from "./stats/inline-strip";
import GalleryUniformGrid from "./gallery/uniform-grid";
import GalleryMasonry from "./gallery/masonry";
import GalleryCarousel from "./gallery/carousel";
import GallerySingleLarge from "./gallery/single-large";
import GalleryFullBleedStrip from "./gallery/full-bleed-strip";

/**
 * Variant id -> component.
 *
 * The schema lists every *planned* variant; this registry lists the ones that
 * actually exist. `implementedVariants()` is what the editor offers, so a user
 * can never select a layout that has no component — and the gap between the two
 * lists is the catalog backlog, reported by a test rather than hidden.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyVariant = ComponentType<SectionProps<any>>;

export const REGISTRY: Partial<Record<SectionType, Record<string, AnyVariant>>> = {
  about: {
    "two-col-index": AboutTwoColIndex,
    "centered-narrow": AboutCenteredNarrow,
    "stat-strip": AboutStatStrip,
    "portrait-left": AboutPortraitLeft,
    card: AboutCard,
  },
  capabilities: {
    cards: CapabilitiesCards,
    "icon-grid": CapabilitiesIconGrid,
    "chips-only": CapabilitiesChipsOnly,
    "grouped-columns": CapabilitiesGroupedColumns,
    marquee: CapabilitiesMarquee,
  },
  projects: {
    "numbered-list": ProjectsNumberedList,
    "grid-2": ProjectsGrid2,
    "grid-3": ProjectsGrid3,
    cards: ProjectsCards,
    table: ProjectsTable,
    "alternating-showcase": ProjectsAlternatingShowcase,
    masonry: ProjectsMasonry,
    "featured-plus-list": ProjectsFeaturedPlusList,
  },
  contact: {
    "channel-list": ContactChannelList,
    "big-cta": ContactBigCta,
    "split-with-form": ContactSplitWithForm,
    "card-grid": ContactCardGrid,
    "merged-footer": ContactMergedFooter,
  },
  skills: {
    chips: SkillsChips,
    "grouped-columns": SkillsGroupedColumns,
    "icon-grid": SkillsIconGrid,
    bars: SkillsBars,
    marquee: SkillsMarquee,
  },
  experience: {
    "timeline-vertical": ExperienceTimeline,
    "two-col-list": ExperienceTwoCol,
    table: ExperienceTable,
    cards: ExperienceCards,
  },
  education: {
    "timeline-vertical": EducationTimeline,
    "two-col-list": EducationTwoCol,
    table: EducationTable,
    cards: EducationCards,
  },
  text: {
    "prose-narrow": TextProseNarrow,
    "two-column": TextTwoColumn,
    callout: TextCallout,
    "pull-quote": TextPullQuote,
  },
  testimonials: {
    "large-quote": TestimonialsLargeQuote,
    "cards-grid": TestimonialsCardsGrid,
    marquee: TestimonialsMarquee,
    slider: TestimonialsSlider,
  },
  stats: {
    "number-row": StatsNumberRow,
    cards: StatsCards,
    "inline-strip": StatsInlineStrip,
  },
  gallery: {
    masonry: GalleryMasonry,
    "uniform-grid": GalleryUniformGrid,
    carousel: GalleryCarousel,
    "full-bleed-strip": GalleryFullBleedStrip,
    "single-large": GallerySingleLarge,
  },
};

/** Variant ids of `type` that have a component, typed to that type's own union. */
export type VariantOf<T extends SectionType> = (typeof SECTION_VARIANTS)[T][number];

export function implementedVariants<T extends SectionType>(type: T): VariantOf<T>[] {
  const built = new Set(Object.keys(REGISTRY[type] ?? {}));
  return SECTION_VARIANTS[type].filter((v) => built.has(v)) as VariantOf<T>[];
}

/**
 * The variant a new section of this type should start on.
 *
 * Falls back to the first *planned* variant when nothing is built yet, so this
 * never returns undefined and callers need no guard.
 */
export function defaultVariant<T extends SectionType>(type: T): VariantOf<T> {
  return implementedVariants(type)[0] ?? (SECTION_VARIANTS[type][0] as VariantOf<T>);
}

/**
 * Resolve a section to its component.
 *
 * A document can legitimately name a variant we have not built yet — the schema
 * allows it and a preset may ship before its layout does. Rather than crash a
 * published page, fall back to the first implemented variant for that type.
 */
export function resolveVariant(type: SectionType, variant: string): AnyVariant | undefined {
  const forType = REGISTRY[type];
  if (!forType) return undefined;
  return forType[variant] ?? Object.values(forType)[0];
}

/**
 * Variants that render edge to edge.
 *
 * SectionFrame skips its max-width wrapper for these; everything else stays
 * inside the container token.
 */
const BLEED = new Set(["gallery:full-bleed-strip"]);

export function isBleed(type: SectionType, variant: string): boolean {
  return BLEED.has(`${type}:${variant}`);
}
