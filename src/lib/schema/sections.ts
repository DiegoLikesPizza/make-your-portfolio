import { z } from "zod";
import { backgroundConfig } from "./background";

/**
 * The section catalog.
 *
 * THE RULE: every variant of a section type consumes the exact same `data`.
 * Switching Projects from `numbered-list` to `grid-3` to `table` never loses
 * content and never opens a migration dialog. A variant that cannot show a
 * field simply ignores it, and the editor says so. This is what lets the
 * variant catalog grow forever without the schema rotting.
 */

const id = z.string().min(1);
const richText = z.string().max(5000);
const shortText = z.string().max(300);

/** Icons come from a fixed lucide allowlist — never an arbitrary name. */
export const iconName = z.enum([
  "app-window", "wrench", "gauge", "code", "database", "cloud", "cpu",
  "palette", "pen-tool", "camera", "megaphone", "line-chart", "shield",
  "smartphone", "server", "sparkles", "zap", "users", "book-open", "terminal",
]);

export const link = z.object({
  id,
  label: shortText,
  href: z.string().max(2000),
  icon: iconName.or(z.enum(["github", "linkedin", "mail", "x", "globe", "instagram", "dribbble"])).optional(),
});

// ------------------------------------------------------------ section data

const aboutData = z.object({
  lead: richText,
  body: richText,
  footnote: shortText.optional(),
  imageAssetId: z.string().optional(),
  stats: z.array(z.object({ id, value: shortText, label: shortText })).max(6),
});

const capabilitiesData = z.object({
  headline: shortText.optional(),
  items: z.array(z.object({ id, icon: iconName, title: shortText, body: richText })).max(12),
  chips: z.array(z.object({ id, label: shortText })).max(40),
});

const project = z.object({
  id,
  title: shortText,
  summary: richText,
  tech: z.array(z.string().max(40)).max(12),
  year: z.string().max(20).optional(),
  status: z.enum(["live", "archived", "wip", "none"]),
  href: z.string().max(2000).optional(),
  linkLabel: shortText.optional(),
  coverAssetId: z.string().optional(),
  featured: z.boolean(),
});

const projectsData = z.object({ items: z.array(project).max(60) });

const experienceData = z.object({
  items: z.array(
    z.object({
      id,
      role: shortText,
      org: shortText,
      orgHref: z.string().max(2000).optional(),
      start: shortText,
      end: shortText.optional(),
      summary: richText.optional(),
      bullets: z.array(z.object({ id, text: shortText })).max(10),
      logoAssetId: z.string().optional(),
    }),
  ).max(40),
});

const educationData = z.object({
  items: z.array(
    z.object({
      id,
      qualification: shortText,
      institution: shortText,
      start: shortText,
      end: shortText.optional(),
      summary: richText.optional(),
    }),
  ).max(20),
});

const skillsData = z.object({
  groups: z.array(
    z.object({
      id,
      label: shortText,
      items: z.array(
        z.object({ id, label: shortText, icon: iconName.optional(), level: z.number().min(0).max(100).optional() }),
      ).max(40),
    }),
  ).max(10),
});

const galleryData = z.object({
  items: z.array(
    z.object({ id, assetId: z.string(), caption: shortText.optional(), href: z.string().max(2000).optional() }),
  ).max(60),
});

const testimonialsData = z.object({
  items: z.array(
    z.object({ id, quote: richText, author: shortText, role: shortText.optional(), avatarAssetId: z.string().optional() }),
  ).max(20),
});

const statsData = z.object({
  items: z.array(z.object({ id, value: shortText, label: shortText, suffix: shortText.optional() })).max(8),
});

const textData = z.object({ body: richText });

const contactData = z.object({
  headline: shortText.optional(),
  blurb: richText.optional(),
  channels: z.array(link).max(10),
});

// ------------------------------------------------------------ the catalog
//
// One `as const` variant list per section type. The render registry in
// src/variants/ must supply a component for every id here, and a test asserts
// that. Adding a variant is a one-word change in this file plus one component.

const ABOUT_VARIANTS = ["two-col-index", "centered-narrow", "portrait-left", "stat-strip", "card"] as const;
const CAPABILITIES_VARIANTS = ["cards", "chips-only", "grouped-columns", "icon-grid", "marquee"] as const;
const PROJECTS_VARIANTS = [
  "numbered-list", "grid-2", "grid-3", "cards", "table",
  "alternating-showcase", "masonry", "featured-plus-list",
] as const;
const HISTORY_VARIANTS = ["timeline-vertical", "two-col-list", "table", "cards"] as const;
const SKILLS_VARIANTS = ["chips", "grouped-columns", "icon-grid", "bars", "marquee"] as const;
const GALLERY_VARIANTS = ["masonry", "uniform-grid", "carousel", "full-bleed-strip", "single-large"] as const;
const TESTIMONIALS_VARIANTS = ["large-quote", "cards-grid", "marquee", "slider"] as const;
const STATS_VARIANTS = ["number-row", "cards", "inline-strip"] as const;
const TEXT_VARIANTS = ["prose-narrow", "two-column", "callout", "pull-quote"] as const;
const CONTACT_VARIANTS = ["channel-list", "big-cta", "split-with-form", "card-grid", "merged-footer"] as const;

/** Common fields every section carries, whatever its type. */
const sectionBase = {
  id,
  /** Anchor target for nav links. Unique within a document. */
  slug: z.string().regex(/^[a-z0-9-]+$/).max(40),
  title: shortText.optional(),
  background: backgroundConfig.optional(),
  hidden: z.boolean(),
};

/**
 * Written out per type rather than generated in a loop: a loop over
 * Object.entries erases the discriminated union, and then `section.data` is
 * `unknown` everywhere downstream. Explicit is worth the eleven lines.
 */
function sectionFor<
  T extends string,
  V extends readonly [string, ...string[]],
  D extends z.ZodTypeAny,
>(type: T, variants: V, data: D) {
  return z.object({
    ...sectionBase,
    type: z.literal(type),
    variant: z.enum(variants),
    data,
  });
}

export const section = z.discriminatedUnion("type", [
  sectionFor("about", ABOUT_VARIANTS, aboutData),
  sectionFor("capabilities", CAPABILITIES_VARIANTS, capabilitiesData),
  sectionFor("projects", PROJECTS_VARIANTS, projectsData),
  sectionFor("experience", HISTORY_VARIANTS, experienceData),
  sectionFor("education", HISTORY_VARIANTS, educationData),
  sectionFor("skills", SKILLS_VARIANTS, skillsData),
  sectionFor("gallery", GALLERY_VARIANTS, galleryData),
  sectionFor("testimonials", TESTIMONIALS_VARIANTS, testimonialsData),
  sectionFor("stats", STATS_VARIANTS, statsData),
  sectionFor("text", TEXT_VARIANTS, textData),
  sectionFor("contact", CONTACT_VARIANTS, contactData),
]);

/**
 * The same catalog as plain data, for the editor's "add section" menu and for
 * the registry completeness test. Kept next to the union so the two cannot
 * drift without a test failing.
 */
export const SECTION_VARIANTS = {
  about: ABOUT_VARIANTS,
  capabilities: CAPABILITIES_VARIANTS,
  projects: PROJECTS_VARIANTS,
  experience: HISTORY_VARIANTS,
  education: HISTORY_VARIANTS,
  skills: SKILLS_VARIANTS,
  gallery: GALLERY_VARIANTS,
  testimonials: TESTIMONIALS_VARIANTS,
  stats: STATS_VARIANTS,
  text: TEXT_VARIANTS,
  contact: CONTACT_VARIANTS,
} as const;

export type SectionType = keyof typeof SECTION_VARIANTS;
export const SECTION_TYPE_IDS = Object.keys(SECTION_VARIANTS) as SectionType[];

export type Section = z.infer<typeof section>;
export type SectionOf<T extends SectionType> = Extract<Section, { type: T }>;
export type Project = z.infer<typeof project>;
export type Link = z.infer<typeof link>;
