import { z } from "zod";
import { tokens } from "./tokens";
import { backgroundConfig } from "./background";
import { link, section } from "./sections";

/**
 * The one definition of what a portfolio is.
 *
 * Forms, live preview, the public renderer and API validation all derive from
 * this. Sites are one-pagers: `sections` is the page, top to bottom, and nav
 * links are anchors into it.
 */

export const CURRENT_VERSION = 1;

/** Nav is a site-level choice, independent of preset — every preset supports all of these. */
export const navVariant = z.enum([
  "top-fixed",
  "top-static",
  "side-left-rail",
  "side-floating-pill",
  "bottom-dock",
  "dot-rail",
  "hamburger-overlay",
  "none",
]);

/** What a horizontal nav does once its links stop fitting the viewport. */
export const navMobileBehavior = z.enum(["hamburger", "scroll", "wrap", "hide"]);

export const navConfig = z.object({
  variant: navVariant,
  labelStyle: z.enum(["text", "numbered", "icon", "dot"]),
  showLogo: z.boolean(),
  showThemeToggle: z.boolean(),
  blurOnScroll: z.boolean(),
  /**
   * Which edge the vertical navs (rail, floating pill, dot rail) sit on.
   *
   * Defaulted rather than required: these two fields arrived after documents
   * were already stored, and `migrate` re-parses every one of them on read, so
   * a default here is the migration.
   */
  side: z.enum(["left", "right"]).default("left"),
  mobileBehavior: navMobileBehavior.default("hamburger"),
});

export const cta = z.object({
  id: z.string().min(1),
  label: z.string().max(60),
  /** A section slug, an external URL, or a mailto:. */
  target: z.string().max(2000),
  style: z.enum(["solid", "outline", "text"]),
});

export const design = z.object({
  /** Which preset was loaded. Informational — the user may have changed anything since. */
  preset: z.string().max(60),
  tokens,
  nav: navConfig,
  background: backgroundConfig,
  colorScheme: z.enum(["light", "dark", "auto"]),
  footer: z.enum(["minimal", "columns", "oversized-type", "none"]),
});

export const profile = z.object({
  name: z.string().max(120),
  /** Drives the monogram logo when no logo asset is set. */
  initials: z.string().max(4).optional(),
  eyebrow: z.string().max(160).optional(),
  /** Supports ==accent== spans. Never raw HTML. */
  headline: z.string().max(400),
  bio: z.string().max(2000),
  avatarAssetId: z.string().optional(),
  logoAssetId: z.string().optional(),
  location: z.string().max(120).optional(),
  email: z.string().max(200).optional(),
  ctas: z.array(cta).max(2),
  links: z.array(link).max(10),
});

export const heroVariant = z.enum([
  "split-left",
  "centered-stack",
  "full-bleed-background",
  "portrait-side",
  "oversized-type",
  "terminal-prompt",
  "image-right-split",
  "minimal-line",
]);

export const meta = z.object({
  title: z.string().max(200),
  description: z.string().max(400),
  ogAssetId: z.string().optional(),
  noindex: z.boolean(),
});

export const portfolioDoc = z.object({
  version: z.literal(CURRENT_VERSION),
  meta,
  design,
  profile,
  /** The hero is always present and always first, so it lives outside `sections`. */
  hero: z.object({ variant: heroVariant, background: backgroundConfig.optional() }),
  sections: z.array(section).max(30),
});

export type PortfolioDoc = z.infer<typeof portfolioDoc>;
export type Design = z.infer<typeof design>;
export type Profile = z.infer<typeof profile>;
export type NavConfig = z.infer<typeof navConfig>;
export type NavMobileBehavior = z.infer<typeof navMobileBehavior>;
export type Cta = z.infer<typeof cta>;

/**
 * Upgrade a stored document to the current version.
 *
 * Documents are persisted as JSON blobs, so this — not a database migration —
 * is how the shape evolves. Called on every read; unknown/older shapes are
 * repaired here rather than crashing the renderer.
 */
export function migrate(raw: unknown): PortfolioDoc {
  const doc = raw as { version?: number };
  if (typeof doc?.version !== "number") {
    throw new Error("Not a portfolio document: missing version");
  }
  // v1 is current; future versions add `if (doc.version === 1) { ...; doc.version = 2 }`
  return portfolioDoc.parse(raw);
}

/** Parse without throwing, for surfaces that must degrade rather than 500. */
export function safeParseDoc(raw: unknown) {
  return portfolioDoc.safeParse(raw);
}
