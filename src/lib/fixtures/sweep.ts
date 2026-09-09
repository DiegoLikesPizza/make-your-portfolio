import { nanoid } from "nanoid";
import type { PortfolioDoc } from "@/lib/schema/portfolio";
import { SECTION_VARIANTS, type SectionType } from "@/lib/schema/sections";
import { blankSection } from "@/components/editor/blank";
import type { Section } from "@/lib/schema/sections";

/**
 * A document containing every section type at every variant, with enough real
 * content that empty-state rendering isn't what gets tested.
 */

const id = () => nanoid(8);

function fill(section: Section): Section {
  switch (section.type) {
    case "about":
      return { ...section, data: {
        lead: "Lead sentence that introduces the person.",
        body: "First paragraph of the about text.\n\nSecond paragraph, to prove splitting works.",
        footnote: "Open to work",
        stats: [{ id: id(), value: "6", label: "Years" }, { id: id(), value: "40+", label: "Projects" }],
      } };
    case "capabilities":
      return { ...section, data: {
        headline: "The tools I build with.",
        items: [1, 2, 3].map((n) => ({ id: id(), icon: "code" as const, title: `Capability ${n}`, body: "What this capability covers." })),
        chips: ["Next.js", "TypeScript", "Tailwind"].map((label) => ({ id: id(), label })),
      } };
    case "projects":
      return { ...section, data: {
        items: [1, 2, 3].map((n) => ({
          id: id(), title: `Project ${n}`, summary: "A short description of the project and what it does.",
          tech: ["Rust", "WASM"], year: "2026", status: (n === 1 ? "live" : "archived") as "live" | "archived",
          href: "https://example.com", linkLabel: "Visit", featured: n === 1,
        })),
      } };
    case "experience":
      return { ...section, data: {
        items: [1, 2].map((n) => ({
          id: id(), role: `Role ${n}`, org: "Some Company", start: "2024", end: n === 1 ? undefined : "2025",
          summary: "What the role involved.", bullets: [{ id: id(), text: "Shipped a thing." }],
        })),
      } };
    case "education":
      return { ...section, data: {
        items: [{ id: id(), qualification: "Abitur", institution: "A School", start: "2018", end: "2026", summary: "Focus on maths." }],
      } };
    case "skills":
      return { ...section, data: {
        groups: [1, 2].map((n) => ({
          id: id(), label: `Group ${n}`,
          items: ["One", "Two", "Three"].map((label) => ({ id: id(), label, icon: "zap" as const, level: 70 })),
        })),
      } };
    case "gallery":
      return { ...section, data: { items: [1, 2, 3].map((n) => ({ id: id(), assetId: `fake-${n}`, caption: `Image ${n}` })) } };
    case "testimonials":
      return { ...section, data: {
        items: [1, 2].map((n) => ({ id: id(), quote: "They were a pleasure to work with.", author: `Person ${n}`, role: "CTO" })),
      } };
    case "stats":
      return { ...section, data: { items: [1, 2, 3].map((n) => ({ id: id(), value: `${n}0`, label: `Metric ${n}`, suffix: "+" })) } };
    case "text":
      return { ...section, data: { body: "A paragraph of body copy.\n\nAnd a ==highlighted== second one." } };
    case "contact":
      return { ...section, data: {
        headline: "Let's work ==together.==",
        blurb: "Email is the fastest way to reach me.",
        channels: [
          { id: id(), label: "Email", href: "mailto:a@example.com", icon: "mail" as const },
          { id: id(), label: "GitHub", href: "https://github.com/x", icon: "github" as const },
        ],
      } };
  }
}

/**
 * @param only  Restrict to one section type. The schema caps a document at 30
 *              sections and the full catalog is larger, so the sweep runs a
 *              type at a time rather than the cap being loosened for a test.
 */
export function everyVariantDoc(design: PortfolioDoc["design"], only?: SectionType): PortfolioDoc {
  const sections: Section[] = [];
  const types = only ? [only] : (Object.keys(SECTION_VARIANTS) as SectionType[]);
  for (const type of types) {
    for (const variant of SECTION_VARIANTS[type]) {
      const base = blankSection(type, `${type}-${variant}`);
      sections.push({ ...fill(base), variant, title: `${type} ${variant}` } as Section);
    }
  }

  return {
    version: 1,
    meta: { title: "Variant sweep", description: "Every section variant on one page.", noindex: true },
    design,
    profile: {
      name: "Sweep Tester", initials: "ST", eyebrow: "Every layout at once",
      headline: "Rendering ==every== variant.",
      bio: "If this page renders, the catalog is sound.",
      email: "a@example.com",
      ctas: [{ id: id(), label: "View work", target: "projects-numbered-list", style: "solid" as const }],
      links: [{ id: id(), label: "GitHub", href: "https://github.com/x", icon: "github" as const }],
    },
    hero: { variant: "split-left" },
    sections,
  };
}
