import type { Section, VariantOptions } from "@/lib/schema/sections";

/**
 * Which settings each layout has, and what they default to.
 *
 * The three-layer model says tokens are site-wide and sections are content —
 * which left nowhere to put "this marquee should scroll the other way". That is
 * not a token (it applies to one section) and not content (switching layout
 * shouldn't lose it), so it is a third thing: a property of the *layout* as
 * used here.
 *
 * Only layouts with a genuine behavioural choice appear below. A grid has no
 * setting worth inventing, and a panel of controls that don't change anything
 * is worse than no panel.
 *
 * A key a layout ignores still stays in the document. Switch from marquee to
 * chips and back and your speed is still where you left it.
 */

export type OptionKey = keyof VariantOptions;

type Field =
  | { kind: "toggle"; label: string; hint?: string; fallback: boolean }
  | { kind: "enum"; label: string; hint?: string; values: readonly string[]; fallback: string };

export const OPTION_FIELDS: Record<OptionKey, Field> = {
  align: { kind: "enum", label: "Alignment", values: ["left", "center"], fallback: "left" },
  imageSide: { kind: "enum", label: "Image side", values: ["left", "right"], fallback: "left" },
  speed: { kind: "enum", label: "Speed", values: ["slow", "normal", "fast"], fallback: "normal" },
  direction: { kind: "enum", label: "Direction", values: ["left", "right"], fallback: "left" },
  autoplay: { kind: "toggle", label: "Advance on its own", fallback: false },
  tone: { kind: "enum", label: "Tone", values: ["neutral", "accent", "warning"], fallback: "accent" },
  columns: { kind: "enum", label: "Columns", values: ["2", "3", "4"], fallback: "3" },
  showYear: { kind: "toggle", label: "Show the year", fallback: true },
  showTech: { kind: "toggle", label: "Show the tech list", fallback: true },
  dividers: { kind: "toggle", label: "Rules between rows", fallback: true },
};

/** `type:variant` -> the settings that layout reads. */
const BY_VARIANT: Record<string, readonly OptionKey[]> = {
  "capabilities:marquee": ["speed", "direction"],
  "skills:marquee": ["speed", "direction"],
  "testimonials:marquee": ["speed", "direction"],
  "testimonials:slider": ["autoplay"],
  "gallery:carousel": ["autoplay"],
  "gallery:uniform-grid": ["columns"],
  "about:portrait-left": ["imageSide"],
  "text:callout": ["tone"],
  "projects:table": ["showYear", "showTech"],
  "projects:numbered-list": ["dividers", "showTech"],
  "stats:number-row": ["align"],
  "stats:inline-strip": ["align"],
};

export function optionsFor(type: string, variant: string): readonly OptionKey[] {
  return BY_VARIANT[`${type}:${variant}`] ?? [];
}

/**
 * One setting's value for this section, with the layout's default applied.
 *
 * Variants read settings through this rather than off `section.options`, so a
 * document written before the setting existed renders the same as one written
 * after it.
 */
export function option<K extends OptionKey>(section: Section, key: K): NonNullable<VariantOptions[K]> {
  const stored = section.options?.[key];
  if (stored !== undefined) return stored as NonNullable<VariantOptions[K]>;
  return OPTION_FIELDS[key].fallback as NonNullable<VariantOptions[K]>;
}

/** Marquee duration in seconds. Slower is a *longer* duration, hence inverted. */
export const MARQUEE_SECONDS = { slow: 60, normal: 35, fast: 18 } as const;
