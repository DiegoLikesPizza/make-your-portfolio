import { nanoid } from "nanoid";
import type { PortfolioDoc } from "@/lib/schema/portfolio";
import { editorial } from "@/presets/editorial";

/**
 * The document a brand-new site starts from.
 *
 * Deliberately filled in rather than empty: a blank editor is a worse first
 * experience than one showing a real shape you can overwrite. Every string here
 * is meant to be replaced.
 */
export function starterDoc(name: string, email?: string | null): PortfolioDoc {
  const id = () => nanoid(8);

  return {
    version: 1,
    meta: { title: `${name} — Portfolio`, description: `The portfolio of ${name}.`, noindex: false },
    design: editorial,
    profile: {
      name,
      initials: name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "ME",
      eyebrow: "Your role — Your city",
      headline: "I build things that ==work==.",
      bio: "A sentence or two about what you do and who you do it for.",
      email: email ?? undefined,
      ctas: [
        { id: id(), label: "View work", target: "work", style: "solid" },
        { id: id(), label: "Get in touch", target: "contact", style: "text" },
      ],
      links: email ? [{ id: id(), label: "Email", href: `mailto:${email}`, icon: "mail" }] : [],
    },
    hero: { variant: "split-left" },
    sections: [
      {
        id: id(), slug: "about", type: "about", variant: "two-col-index", title: "About", hidden: false,
        data: {
          lead: "One line that says who you are.",
          body: "A paragraph about your background and what you care about.\n\nA second paragraph, if you want one.",
          footnote: "Open to work",
          stats: [],
        },
      },
      {
        id: id(), slug: "work", type: "projects", variant: "numbered-list", title: "Work", hidden: false,
        data: {
          items: [
            {
              id: id(),
              title: "Your first project",
              summary: "What it is, who it was for, and what you did on it.",
              tech: ["Add", "Your", "Stack"],
              year: String(new Date().getFullYear()),
              status: "live",
              href: "",
              linkLabel: "Visit site",
              featured: true,
            },
          ],
        },
      },
      {
        id: id(), slug: "contact", type: "contact", variant: "channel-list", title: "Contact", hidden: false,
        data: {
          headline: "Let's work ==together.==",
          blurb: "The best way to reach you, and how quickly you reply.",
          channels: email ? [{ id: id(), label: "Email", href: `mailto:${email}`, icon: "mail" }] : [],
        },
      },
    ],
  };
}
