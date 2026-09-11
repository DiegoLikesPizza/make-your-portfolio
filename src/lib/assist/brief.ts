import { z } from "zod";
import { nanoid } from "nanoid";
import type { PortfolioDoc } from "@/lib/schema/portfolio";
import type { Section } from "@/lib/schema/sections";
import { iconName, isSafeHref } from "@/lib/schema/sections";
import { defaultVariant } from "@/variants/registry";

/**
 * The shape the model is asked for — deliberately not the storage schema.
 *
 * A PortfolioDoc carries ids, slugs, variant names, tokens and a palette. None
 * of that is a writing decision, and asking a model to invent it means every
 * generation can produce a document that fails validation for reasons that have
 * nothing to do with the words. So the model is asked only for the content, and
 * `applyBrief` supplies the machinery: ids, unique slugs, the default variant
 * for each type, and — importantly — the user's existing design untouched.
 *
 * Every optional field is `.nullable()` rather than `.optional()`: structured
 * outputs requires each property to be present, so "no value" has to be
 * expressible as a value.
 */

const text = (max: number) => z.string().max(max);
const nullableText = (max: number) => z.string().max(max).nullable();

const projectBrief = z.object({
  title: text(120),
  summary: text(600),
  tech: z.array(text(40)).max(12),
  year: nullableText(20),
  status: z.enum(["live", "wip", "archived", "none"]),
  href: nullableText(2000),
});

const roleBrief = z.object({
  role: text(120),
  org: text(120),
  start: text(40),
  end: nullableText(40),
  summary: nullableText(600),
  bullets: z.array(text(300)).max(8),
});

const studyBrief = z.object({
  qualification: text(160),
  institution: text(160),
  start: text(40),
  end: nullableText(40),
  summary: nullableText(600),
});

const sectionBrief = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("about"),
    title: text(60),
    lead: text(400),
    body: text(3000),
  }),
  z.object({
    type: z.literal("projects"),
    title: text(60),
    items: z.array(projectBrief).max(12),
  }),
  z.object({
    type: z.literal("experience"),
    title: text(60),
    items: z.array(roleBrief).max(12),
  }),
  z.object({
    type: z.literal("education"),
    title: text(60),
    items: z.array(studyBrief).max(8),
  }),
  z.object({
    type: z.literal("skills"),
    title: text(60),
    groups: z.array(z.object({ label: text(60), items: z.array(text(40)).max(20) })).max(6),
  }),
  z.object({
    type: z.literal("capabilities"),
    title: text(60),
    items: z.array(z.object({ icon: iconName, title: text(80), body: text(400) })).max(8),
  }),
  z.object({
    type: z.literal("stats"),
    title: text(60),
    items: z.array(z.object({ value: text(20), suffix: nullableText(8), label: text(60) })).max(6),
  }),
  z.object({
    type: z.literal("text"),
    title: text(60),
    body: text(3000),
  }),
  z.object({
    type: z.literal("contact"),
    title: text(60),
    headline: nullableText(200),
    blurb: nullableText(600),
  }),
]);

export const brief = z.object({
  pageTitle: text(120),
  pageDescription: text(300),
  name: text(120),
  initials: text(4),
  eyebrow: text(160),
  /** Supports ==accent== spans, which is why the prompt explains them. */
  headline: text(300),
  bio: text(1000),
  location: nullableText(120),
  sections: z.array(sectionBrief).max(7),
});

export type Brief = z.infer<typeof brief>;

/** `null` is how the model says "nothing here"; the document says it with absence. */
const some = (value: string | null | undefined) => (value?.trim() ? value : undefined);

/**
 * A link from the model, or nothing if the schema would refuse its scheme.
 * One bad link is dropped rather than failing the whole generation.
 */
const safeLink = (value: string | null) => (value?.trim() && isSafeHref(value) ? value : undefined);

/** `Senior Engineer` -> `senior-engineer`, made unique against what's taken. */
function slugFor(title: string, taken: Set<string>) {
  const base =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "section";

  let slug = base;
  let n = 2;
  while (taken.has(slug)) slug = `${base}-${n++}`;
  taken.add(slug);
  return slug;
}

/**
 * Fold a brief into an existing document.
 *
 * Content is replaced; `design` and `hero` are carried over verbatim. The three
 * design layers are the user's — a preset they picked, a palette they tuned —
 * and a request to write the words is not a request to restyle the page.
 */
export function applyBrief(doc: PortfolioDoc, value: Brief): PortfolioDoc {
  const taken = new Set<string>();

  const sections: Section[] = value.sections.map((s) => {
    const base = { id: nanoid(8), slug: slugFor(s.title, taken), title: s.title, hidden: false };

    switch (s.type) {
      case "about":
        return { ...base, type: "about", variant: defaultVariant("about"), data: { lead: s.lead, body: s.body, stats: [] } };
      case "projects":
        return {
          ...base,
          type: "projects",
          variant: defaultVariant("projects"),
          data: {
            items: s.items.map((p) => ({
              id: nanoid(8),
              title: p.title,
              summary: p.summary,
              tech: p.tech,
              year: some(p.year),
              status: p.status,
              href: safeLink(p.href),
              featured: false,
            })),
          },
        };
      case "experience":
        return {
          ...base,
          type: "experience",
          variant: defaultVariant("experience"),
          data: {
            items: s.items.map((r) => ({
              id: nanoid(8),
              role: r.role,
              org: r.org,
              start: r.start,
              end: some(r.end),
              summary: some(r.summary),
              bullets: r.bullets.map((t) => ({ id: nanoid(8), text: t })),
            })),
          },
        };
      case "education":
        return {
          ...base,
          type: "education",
          variant: defaultVariant("education"),
          data: {
            items: s.items.map((e) => ({
              id: nanoid(8),
              qualification: e.qualification,
              institution: e.institution,
              start: e.start,
              end: some(e.end),
              summary: some(e.summary),
            })),
          },
        };
      case "skills":
        return {
          ...base,
          type: "skills",
          variant: defaultVariant("skills"),
          data: {
            groups: s.groups.map((g) => ({
              id: nanoid(8),
              label: g.label,
              items: g.items.map((label) => ({ id: nanoid(8), label })),
            })),
          },
        };
      case "capabilities":
        return {
          ...base,
          type: "capabilities",
          variant: defaultVariant("capabilities"),
          data: {
            items: s.items.map((i) => ({ id: nanoid(8), icon: i.icon, title: i.title, body: i.body })),
            chips: [],
          },
        };
      case "stats":
        return {
          ...base,
          type: "stats",
          variant: defaultVariant("stats"),
          data: {
            items: s.items.map((i) => ({ id: nanoid(8), value: i.value, suffix: some(i.suffix), label: i.label })),
          },
        };
      case "text":
        return { ...base, type: "text", variant: defaultVariant("text"), data: { body: s.body } };
      case "contact":
        return {
          ...base,
          type: "contact",
          variant: defaultVariant("contact"),
          // Channels are addresses, not prose. Carrying the ones already on the
          // profile over is right; inventing an email address is not.
          data: { headline: some(s.headline), blurb: some(s.blurb), channels: doc.profile.links },
        };
    }
  });

  return {
    ...doc,
    meta: { ...doc.meta, title: value.pageTitle, description: value.pageDescription },
    profile: {
      ...doc.profile,
      name: value.name,
      initials: value.initials,
      eyebrow: value.eyebrow,
      headline: value.headline,
      bio: value.bio,
      location: some(value.location),
    },
    sections,
  };
}
