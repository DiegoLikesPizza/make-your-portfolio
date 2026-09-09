import type { PortfolioDoc } from "@/lib/schema/portfolio";
import { editorial } from "@/presets/editorial";

/**
 * lfdiego.xyz's content, expressed purely as a PortfolioDoc.
 *
 * This is the acceptance test for the whole render core: if the schema cannot
 * hold a real, finished portfolio without losing anything, the schema is wrong.
 * Every field here came from an existing component in that repo.
 */
export const diegoDoc: PortfolioDoc = {
  version: 1,
  meta: {
    title: "Diego Göttler — Developer & Co-Founder",
    description:
      "Developer and co-founder building fast, reliable web apps and custom software for businesses with Next.js, TypeScript and Tailwind.",
    noindex: false,
  },
  design: editorial,
  profile: {
    name: "Diego Göttler",
    initials: "DG",
    eyebrow: "Developer / Co-Founder — Denkendorf, DE",
    headline: "I build fast, ==reliable== web software for real businesses.",
    bio: "Developer and co-founder focused on Next.js and TypeScript — shipping custom software and fast websites for real businesses.",
    location: "Denkendorf, DE",
    email: "dg@lfdiego.xyz",
    ctas: [
      { id: "cta-work", label: "View work", target: "work", style: "solid" },
      { id: "cta-contact", label: "Get in touch", target: "contact", style: "text" },
    ],
    links: [
      { id: "l-gh", label: "GitHub", href: "https://github.com/DiegoLikesPizza", icon: "github" },
      { id: "l-li", label: "LinkedIn", href: "https://www.linkedin.com/in/diego-göttler-25bb0339b", icon: "linkedin" },
      { id: "l-mail", label: "Email", href: "mailto:dg@lfdiego.xyz", icon: "mail" },
    ],
  },
  hero: { variant: "split-left" },
  sections: [
    {
      id: "s-about",
      slug: "about",
      type: "about",
      variant: "two-col-index",
      title: "About",
      hidden: false,
      data: {
        lead: "I'm Diego Göttler — a developer and co-founder based near Denkendorf, Germany.",
        body: "I recently finished my Abitur (Class of 2026) and co-founded IT Service Hecker und Göttler, where I build custom software and fast websites for local and small businesses.\n\nI care about clean, maintainable code and software that actually gets real work done — not demos. Most of what I ship is built with Next.js, TypeScript and Tailwind.",
        footnote: "Open to freelance & collaboration",
        stats: [],
      },
    },
    {
      id: "s-stack",
      slug: "stack",
      type: "capabilities",
      variant: "cards",
      title: "Stack",
      hidden: false,
      data: {
        headline: "The tools I build with, day to day.",
        items: [
          { id: "c-1", icon: "app-window", title: "Web apps", body: "Production React/Next.js apps and internal tools, built to last." },
          { id: "c-2", icon: "wrench", title: "Custom software for SMBs", body: "Practical tools that fit how a small business actually works." },
          { id: "c-3", icon: "gauge", title: "Performance & SEO", body: "Fast, accessible, search-friendly sites that load instantly." },
        ],
        chips: [
          { id: "t-1", label: "Next.js" },
          { id: "t-2", label: "TypeScript" },
          { id: "t-3", label: "Tailwind CSS" },
          { id: "t-4", label: "React" },
          { id: "t-5", label: "Node.js" },
        ],
      },
    },
    {
      id: "s-work",
      slug: "work",
      type: "projects",
      variant: "numbered-list",
      title: "Work",
      hidden: false,
      data: {
        items: [
          {
            id: "p-1",
            title: "IT Service Hecker und Göttler",
            summary:
              "The site for our IT company — a fast, conversion-focused landing page for small and mid-sized businesses, built end to end.",
            tech: ["Next.js", "TypeScript", "Tailwind CSS"],
            year: "2025",
            status: "live",
            href: "https://it-service-hg.de",
            linkLabel: "Visit site",
            featured: true,
          },
          {
            id: "p-2",
            title: "CUTECAT",
            summary:
              "A Java desktop app that drives an Arduino-powered rover — camera, ultrasonic sensor and a ball launcher — over HTTP, with manual, semi-autonomous and fully autonomous modes. Built with a team of six.",
            tech: ["Java", "Arduino", "HTTP"],
            year: "2025",
            status: "archived",
            href: "https://github.com/DiegoLikesPizza/CUTECAT",
            linkLabel: "View source",
            featured: false,
          },
          {
            id: "p-3",
            title: "Jurassic Mahjong",
            summary: "A dinosaur-themed Mahjong solitaire game written in Rust — tile-matching with clean, minimal graphics.",
            tech: ["Rust"],
            year: "2026",
            status: "none",
            href: "https://github.com/DiegoLikesPizza/Jurassic-Mahjong-Rust",
            linkLabel: "View source",
            featured: false,
          },
          {
            id: "p-4",
            title: "Vokabeltrainer",
            summary: "A vocabulary trainer that turns a plain JSON file into custom study sets — built to make exam prep faster.",
            tech: ["Next.js", "JavaScript"],
            year: "2026",
            status: "none",
            href: "https://github.com/DiegoLikesPizza/vokabeltrainer",
            linkLabel: "View source",
            featured: false,
          },
          {
            id: "p-5",
            title: "Personal Portfolio v1",
            summary:
              "My first portfolio — an experimental dark, high-energy interface. Archived, kept on GitHub as a snapshot of where I started.",
            tech: ["React", "Framer Motion", "CSS"],
            year: "2024",
            status: "archived",
            href: "https://github.com/DiegoLikesPizza/lfdiego.xyz",
            linkLabel: "View source",
            featured: false,
          },
        ],
      },
    },
    {
      id: "s-contact",
      slug: "contact",
      type: "contact",
      variant: "channel-list",
      title: "Contact",
      hidden: false,
      data: {
        headline: "Let's work ==together.==",
        blurb: "Have a project or a role in mind? Email is the fastest way to reach me — I'll reply within a day or two.",
        channels: [
          { id: "ch-mail", label: "Email", href: "mailto:dg@lfdiego.xyz", icon: "mail" },
          { id: "ch-gh", label: "GitHub", href: "https://github.com/DiegoLikesPizza", icon: "github" },
          { id: "ch-li", label: "LinkedIn", href: "https://www.linkedin.com/in/diego-göttler-25bb0339b", icon: "linkedin" },
        ],
      },
    },
  ],
};
