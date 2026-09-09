import { SECTION_VARIANTS, type SectionType } from "@/lib/schema/sections";
import { implementedVariants } from "@/variants/registry";

/**
 * Human-facing descriptions of the catalog, for the layout browser.
 *
 * Kept as data next to the schema rather than inside components so the browser,
 * the editor's pickers and the marketing page all describe a layout the same way.
 */

export const SECTION_INFO: Record<SectionType, { label: string; blurb: string }> = {
  about: { label: "About", blurb: "Who you are, in a paragraph or two." },
  capabilities: { label: "Capabilities", blurb: "What you do, as a short set of cards or columns." },
  projects: { label: "Projects", blurb: "Your work. The section most people scroll straight to." },
  experience: { label: "Experience", blurb: "Roles and dates, as a timeline, list or table." },
  education: { label: "Education", blurb: "Qualifications, in the same four shapes as experience." },
  skills: { label: "Skills", blurb: "Grouped tools and technologies." },
  gallery: { label: "Gallery", blurb: "Images. Needs uploads, which are not built yet." },
  testimonials: { label: "Testimonials", blurb: "What other people say about working with you." },
  stats: { label: "Stats", blurb: "A few numbers worth stating plainly." },
  text: { label: "Text", blurb: "Free prose, a callout, or one oversized statement." },
  contact: { label: "Contact", blurb: "How to reach you, and how to end the page." },
};

/** Variants that need an uploaded image to show their real shape. */
const NEEDS_IMAGES = new Set([
  "projects:grid-2", "projects:grid-3", "projects:cards", "projects:masonry",
  "projects:alternating-showcase", "projects:featured-plus-list",
  "about:portrait-left",
  "gallery:masonry", "gallery:uniform-grid", "gallery:carousel",
  "gallery:full-bleed-strip", "gallery:single-large",
]);

export function variantLabel(id: string): string {
  return id.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
}

export function needsImages(type: SectionType, variant: string): boolean {
  return NEEDS_IMAGES.has(`${type}:${variant}`);
}

export const SECTION_TYPES_IN_ORDER = Object.keys(SECTION_INFO) as SectionType[];

export function builtCount(type: SectionType) {
  return { built: implementedVariants(type).length, planned: SECTION_VARIANTS[type].length };
}

export const TOTAL_VARIANTS = SECTION_TYPES_IN_ORDER.reduce(
  (n, t) => n + implementedVariants(t).length,
  0,
);

export const NAV_VARIANTS = [
  "top-fixed", "top-static", "side-left-rail", "side-floating-pill",
  "bottom-dock", "dot-rail", "hamburger-overlay", "none",
] as const;

export const HERO_VARIANTS = [
  "split-left", "centered-stack", "full-bleed-background", "portrait-side",
  "oversized-type", "terminal-prompt", "image-right-split", "minimal-line",
] as const;
