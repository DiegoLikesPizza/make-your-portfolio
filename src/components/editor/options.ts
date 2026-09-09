import { ICON_IDS } from "@/render/primitives/LinkIcon";
import type { SectionType } from "@/lib/schema/sections";
import { implementedVariants } from "@/variants/registry";

/** Shared option lists and helpers for the editor forms. */

export const ICON_OPTIONS = ICON_IDS.map((id) => ({ value: id, label: id.replace(/-/g, " ") }));

export const STATUS_OPTIONS = [
  { value: "none", label: "None" },
  { value: "live", label: "Live" },
  { value: "wip", label: "In progress" },
  { value: "archived", label: "Archived" },
] as const;

export const SECTION_LABELS: Record<SectionType, string> = {
  about: "About",
  capabilities: "Capabilities",
  projects: "Projects",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  gallery: "Gallery",
  testimonials: "Testimonials",
  stats: "Stats",
  text: "Text",
  contact: "Contact",
};

/** Move an item within an array, returning the same array for convenience. */
export function move<T>(items: T[], from: number, to: number): T[] {
  const [item] = items.splice(from, 1);
  items.splice(to, 0, item);
  return items;
}

/**
 * Variants offered for a type: only those with a component.
 *
 * The schema lists planned variants too, but offering one the registry cannot
 * render would let a user pick a layout that silently falls back to another.
 */
export function variantOptions(type: SectionType) {
  return implementedVariants(type).map((v) => ({ value: v as string, label: v.replace(/-/g, " ") }));
}

/** Section types the editor can actually add today. */
export function addableTypes(): SectionType[] {
  return (Object.keys(SECTION_LABELS) as SectionType[]).filter((t) => implementedVariants(t).length > 0);
}
