import { nanoid } from "nanoid";
import type { Section, SectionType } from "@/lib/schema/sections";
import { defaultVariant } from "@/variants/registry";
import { SECTION_LABELS } from "./options";

/**
 * A new, empty section of a given type.
 *
 * Starts on the first *implemented* variant so an added section always renders.
 * Every branch must satisfy its type's data schema — an empty section still has
 * to be a valid document, because autosave validates on every keystroke.
 */
export function blankSection(type: SectionType, slug: string): Section {
  const id = nanoid(8);
  const base = { id, slug, title: SECTION_LABELS[type], hidden: false };

  switch (type) {
    case "about":
      return { ...base, type, variant: defaultVariant(type), data: { lead: "", body: "", stats: [] } };
    case "capabilities":
      return { ...base, type, variant: defaultVariant(type), data: { items: [], chips: [] } };
    case "projects":
      return { ...base, type, variant: defaultVariant(type), data: { items: [] } };
    case "experience":
      return { ...base, type, variant: defaultVariant(type), data: { items: [] } };
    case "education":
      return { ...base, type, variant: defaultVariant(type), data: { items: [] } };
    case "skills":
      return { ...base, type, variant: defaultVariant(type), data: { groups: [] } };
    case "gallery":
      return { ...base, type, variant: defaultVariant(type), data: { items: [] } };
    case "testimonials":
      return { ...base, type, variant: defaultVariant(type), data: { items: [] } };
    case "stats":
      return { ...base, type, variant: defaultVariant(type), data: { items: [] } };
    case "text":
      return { ...base, type, variant: defaultVariant(type), data: { body: "" } };
    case "contact":
      return { ...base, type, variant: defaultVariant(type), data: { channels: [] } };
  }
}
