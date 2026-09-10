import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { applyBrief, brief } from "@/lib/assist/brief";
import { portfolioDoc } from "@/lib/schema/portfolio";
import { starterDoc } from "@/lib/fixtures/starter";

/**
 * The half of "write it for me" that can be checked without spending money.
 *
 * Two things have to hold and neither needs the API:
 *
 *  1. The brief schema converts to a JSON schema that structured outputs will
 *     accept — every object closed, every property required. A schema that
 *     doesn't fails at request time, in production, on somebody's first try.
 *  2. Any valid brief folds into a document that passes `portfolioDoc`. That is
 *     the gate the editor and Publish both use; if applyBrief can produce
 *     something that fails it, the feature can write a draft nobody can open.
 *
 *   npm test
 */

let failures = 0;
const check = (label: string, ok: boolean, detail = "") => {
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS " : "FAIL "}assist ${label.padEnd(38)}${ok ? "" : `  ${detail}`}`);
};

// --- 1. the schema structured outputs will be handed ------------------------

const format = zodOutputFormat(brief) as unknown as Record<string, unknown>;
const schema = (format.schema ?? format) as Record<string, unknown>;

let objects = 0;
let open = 0;
let optional = 0;
const walk = (node: unknown) => {
  if (!node || typeof node !== "object") return;
  const value = node as Record<string, unknown>;
  if (value.type === "object") {
    objects += 1;
    if (value.additionalProperties !== false) open += 1;
    const required = new Set((value.required ?? []) as string[]);
    if (Object.keys((value.properties ?? {}) as object).some((key) => !required.has(key))) optional += 1;
  }
  for (const child of Object.values(value)) walk(child);
};
walk(schema);

check("schema has objects", objects > 0, "zodOutputFormat produced nothing object-shaped");
check("every object is closed", open === 0, `${open} without additionalProperties:false`);
check("every property is required", optional === 0, `${optional} objects have optional properties`);

// --- 2. a brief folds into a valid document ---------------------------------

const sample = brief.parse({
  pageTitle: "Ada Lovelace",
  pageDescription: "Analyst and programmer.",
  name: "Ada Lovelace",
  initials: "AL",
  eyebrow: "Analyst",
  headline: "I write ==programs== for engines that don't exist yet.",
  bio: "Working on the analytical engine.",
  location: null,
  sections: [
    { type: "about", title: "About", lead: "A lead.", body: "Body text." },
    {
      type: "projects",
      title: "Work",
      items: [{ title: "Note G", summary: "The first program.", tech: ["paper"], year: "1843", status: "live", href: null }],
    },
    {
      type: "experience",
      title: "Work",
      items: [{ role: "Analyst", org: "Engine Co", start: "1842", end: null, summary: null, bullets: ["Wrote Note G"] }],
    },
    { type: "skills", title: "Skills", groups: [{ label: "Maths", items: ["algebra"] }] },
    { type: "capabilities", title: "What I do", items: [{ icon: "code", title: "Programs", body: "For engines." }] },
    { type: "stats", title: "Numbers", items: [{ value: "1", suffix: "st", label: "programmer" }] },
    { type: "contact", title: "Contact", headline: "Say hello", blurb: null },
  ],
});

const doc = applyBrief(starterDoc("Ada Lovelace"), sample);
const parsed = portfolioDoc.safeParse(doc);
check("brief folds into a valid document", parsed.success, parsed.success ? "" : JSON.stringify(parsed.error.issues[0]));

const slugs = doc.sections.map((s) => s.slug);
check("slugs are unique", new Set(slugs).size === slugs.length, slugs.join(", "));
check("slugs are anchor-safe", slugs.every((s) => /^[a-z0-9-]+$/.test(s)), slugs.join(", "));

// The design layers belong to the user; writing the words must not touch them.
const before = starterDoc("Ada Lovelace");
check("design is left alone", JSON.stringify(doc.design) === JSON.stringify(before.design));
check("hero is left alone", JSON.stringify(doc.hero) === JSON.stringify(before.hero));

console.log(`\n${8 - failures}/8 assist checks passed`);
process.exit(failures ? 1 : 0);
