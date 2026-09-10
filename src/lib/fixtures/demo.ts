import { nanoid } from "nanoid";
import type { PortfolioDoc } from "@/lib/schema/portfolio";
import type { Section } from "@/lib/schema/sections";
import { PRESETS } from "@/presets";

/**
 * The public demo portfolios — one per preset, published so anyone can see a
 * real page before signing up.
 *
 * Deliberately *not* the reference document. `diego.ts` is a real person's real
 * CV, and publishing six copies of it under six handles would put their
 * employers, dates and contact details on pages nobody is claiming to own. The
 * demos use an invented practice instead: plausible enough to show the layouts
 * doing their job, obviously not a person you could email.
 *
 * Each preset gets its own *shape* as well as its own tokens — a different hero
 * and a different layout per section. A preset already bundles nav, tokens and
 * background; six pages identical except for colour would undersell that, and
 * would make the demos worse at the one job they have.
 */

const id = () => nanoid(8);

type Shape = {
  hero: PortfolioDoc["hero"]["variant"];
  about: string;
  capabilities: string;
  projects: string;
  experience: string;
  contact: string;
};

/** Chosen so no two demos read the same way, and every choice suits its preset. */
const SHAPES: Record<string, Shape> = {
  editorial: {
    hero: "split-left",
    about: "two-col-index",
    capabilities: "cards",
    projects: "numbered-list",
    experience: "timeline-vertical",
    contact: "channel-list",
  },
  minimal: {
    hero: "centered-stack",
    about: "centered-narrow",
    capabilities: "chips-only",
    projects: "grid-2",
    experience: "two-col-list",
    contact: "big-cta",
  },
  serif: {
    hero: "minimal-line",
    about: "portrait-left",
    capabilities: "grouped-columns",
    projects: "alternating-showcase",
    experience: "table",
    contact: "split-with-form",
  },
  gradient: {
    hero: "image-right-split",
    about: "card",
    capabilities: "icon-grid",
    projects: "cards",
    experience: "cards",
    contact: "card-grid",
  },
  terminal: {
    hero: "terminal-prompt",
    about: "stat-strip",
    capabilities: "marquee",
    projects: "table",
    experience: "two-col-list",
    contact: "merged-footer",
  },
  brutalist: {
    hero: "oversized-type",
    about: "centered-narrow",
    capabilities: "cards",
    projects: "masonry",
    experience: "timeline-vertical",
    contact: "big-cta",
  },
};

function sections(shape: Shape): Section[] {
  return [
    {
      id: id(),
      slug: "about",
      title: "About",
      hidden: false,
      type: "about",
      variant: shape.about as never,
      data: {
        lead: "A two-person studio building **software that has to work on a Monday morning** — internal tools, booking systems, the unglamorous middle of a business.",
        body:
          "We take on the jobs that sit between a spreadsheet and a real system: the rota that three people maintain by hand, the order form that lives in an inbox, the report somebody rebuilds every month.\n\nMost of it is Next.js and Postgres, most of it is boring on purpose, and all of it is handed over with the documentation to run it without us.",
        footnote: "Taking work from March",
        stats: [
          { id: id(), value: "40+", label: "Systems shipped" },
          { id: id(), value: "9", label: "Years running" },
          { id: id(), value: "2", label: "People" },
        ],
      },
    },
    {
      id: id(),
      slug: "services",
      title: "What we do",
      hidden: false,
      type: "capabilities",
      variant: shape.capabilities as never,
      data: {
        headline: "Four things, done properly.",
        items: [
          { id: id(), icon: "app-window", title: "Internal tools", body: "The system that replaces the spreadsheet three people are afraid to touch." },
          { id: id(), icon: "database", title: "Data plumbing", body: "Imports, exports and the nightly job that reconciles the two." },
          { id: id(), icon: "gauge", title: "Rescue work", body: "Inherited a codebase nobody understands? We have done this before." },
          { id: id(), icon: "book-open", title: "Handover", body: "Documentation your next developer can actually work from." },
        ],
        chips: ["Next.js", "TypeScript", "Postgres", "Prisma", "Tailwind", "Playwright", "Docker", "Hetzner"].map(
          (label) => ({ id: id(), label }),
        ),
      },
    },
    {
      id: id(),
      slug: "work",
      title: "Work",
      hidden: false,
      type: "projects",
      variant: shape.projects as never,
      data: {
        items: [
          {
            id: id(),
            title: "Rota for a 40-bed care home",
            summary: "Replaced a shared spreadsheet that took a manager six hours a week. Handles leave, qualifications and the rules about who may cover whom.",
            tech: ["Next.js", "Postgres", "Prisma"],
            year: "2026",
            status: "live",
            href: "https://example.com",
            linkLabel: "Case study",
            featured: true,
          },
          {
            id: id(),
            title: "Order intake for a joinery",
            summary: "Quotes, measurements and photographs from a phone on site, straight into the workshop's schedule. Works with no signal and syncs later.",
            tech: ["Next.js", "SQLite", "Service Workers"],
            year: "2025",
            status: "live",
            href: "https://example.com",
            linkLabel: "Case study",
            featured: false,
          },
          {
            id: id(),
            title: "Stock reconciliation",
            summary: "A nightly job that compares the till, the warehouse and the supplier feed, and emails one page describing only what disagrees.",
            tech: ["TypeScript", "Postgres", "Cron"],
            year: "2025",
            status: "archived",
            featured: false,
          },
          {
            id: id(),
            title: "Booking system rescue",
            summary: "Inherited from a developer who had left. Tested, documented, and cut its hosting bill by two thirds without a rewrite.",
            tech: ["Node", "MySQL", "Docker"],
            year: "2024",
            status: "wip",
            featured: false,
          },
        ],
      },
    },
    {
      id: id(),
      slug: "history",
      title: "History",
      hidden: false,
      type: "experience",
      variant: shape.experience as never,
      data: {
        items: [
          {
            id: id(),
            role: "Partner",
            org: "Cartwright & Vale",
            start: "2019",
            summary: "Two developers, no account managers, no sales team.",
            bullets: [
              { id: id(), text: "Shipped 40+ systems for businesses between 5 and 200 people" },
              { id: id(), text: "Every project handed over with runbooks and a named owner" },
              { id: id(), text: "No client has ever needed us to keep the lights on" },
            ],
          },
          {
            id: id(),
            role: "Senior Developer",
            org: "Hartwell Logistics",
            start: "2015",
            end: "2019",
            summary: "Warehouse and routing software for a regional haulier.",
            bullets: [
              { id: id(), text: "Rebuilt the routing engine; average drop time down 18%" },
              { id: id(), text: "Ran the on-call rota for four years" },
            ],
          },
        ],
      },
    },
    {
      id: id(),
      slug: "contact",
      title: "Contact",
      hidden: false,
      type: "contact",
      variant: shape.contact as never,
      data: {
        headline: "Got something ==unglamorous== that needs to work?",
        blurb: "Tell us what the current process is and where it hurts. We will say honestly whether it is worth building.",
        channels: [
          { id: id(), label: "Email", href: "mailto:hello@example.com", icon: "mail" },
          { id: id(), label: "GitHub", href: "https://github.com/example", icon: "github" },
          { id: id(), label: "LinkedIn", href: "https://www.linkedin.com/company/example", icon: "linkedin" },
        ],
      },
    },
  ];
}

/**
 * A published demo document for one preset.
 *
 * `noindex` on purpose: six pages of near-identical copy is thin duplicate
 * content, and the indexed marketing surface is `/layouts`, which describes the
 * catalog rather than repeating it. The demos are for people who followed a
 * link, not for search.
 */
export function demoDoc(presetId: string): PortfolioDoc {
  const preset = PRESETS[presetId];
  if (!preset) throw new Error(`Unknown preset: ${presetId}`);

  const shape = SHAPES[presetId];
  if (!shape) throw new Error(`No demo shape for preset: ${presetId}`);

  return {
    version: 1,
    meta: {
      title: `Cartwright & Vale — ${preset.label} demo`,
      description: `A live example portfolio built with the ${preset.label} preset. ${preset.description}`,
      noindex: true,
    },
    design: structuredClone(preset.design),
    profile: {
      name: "Cartwright & Vale",
      initials: "CV",
      eyebrow: "Software studio — Bristol, UK",
      headline: "We build the ==unglamorous middle== of a business, and then hand it over.",
      bio: "Two developers building internal tools, booking systems and data plumbing for businesses between five and two hundred people.",
      location: "Bristol, UK",
      email: "hello@example.com",
      ctas: [
        { id: id(), label: "See the work", target: "work", style: "solid" },
        { id: id(), label: "Get in touch", target: "contact", style: "text" },
      ],
      links: [
        { id: id(), label: "GitHub", href: "https://github.com/example", icon: "github" },
        { id: id(), label: "LinkedIn", href: "https://www.linkedin.com/company/example", icon: "linkedin" },
        { id: id(), label: "Email", href: "mailto:hello@example.com", icon: "mail" },
      ],
    },
    hero: { variant: shape.hero },
    sections: sections(shape),
  };
}

/** The handles the demos are published under — one per preset. */
export const DEMO_HANDLES = Object.keys(SHAPES);
