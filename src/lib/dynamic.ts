import type { PortfolioDoc } from "@/lib/schema/portfolio";
import type { Section } from "@/lib/schema/sections";
import { formatDate } from "@/lib/dates";

/**
 * Dynamic values — `{{...}}` placeholders that any text in a document may use
 * and that are worked out when the page is rendered rather than when it was
 * written.
 *
 * The point is the strings that go stale silently. "Seven years building X" is
 * wrong a year after it was typed, and nobody edits a portfolio to fix it;
 * `{{years since=2019-01-01}}` is right forever. Same for "shipped 12
 * projects" against a Projects section that now has fourteen.
 *
 * Deliberately a closed vocabulary of pure functions of (document, clock), for
 * the same reason `variantOptions` is a closed enum: a document is untrusted
 * input, and the moment a placeholder can name an arbitrary URL or an
 * arbitrary property, resolving one becomes a request the server makes on a
 * stranger's behalf. Everything here reads the document it is in and the
 * calendar, and nothing else.
 *
 * Everything formats in UTC, for the reason set out in dates.ts: a value that
 * reads the runtime's time zone renders differently on the server and in the
 * browser, and the editor preview renders in both.
 *
 * An unknown name, a bad argument or a malformed date leaves the placeholder
 * standing in the output. Silently rendering nothing would make a typo look
 * like an empty field; leaving `{{yaers since=2019}}` on the page is how the
 * author finds out.
 */

const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * `{{name}}` or `{{name arg=value arg=value}}`.
 *
 * Argument values stop at whitespace and may not contain braces, so an
 * unterminated placeholder can't swallow the rest of a paragraph.
 */
const TOKEN = /\{\{\s*([a-z]+)((?:\s+[a-z]+=[^\s{}]+)*)\s*\}\}/g;

type Args = Record<string, string>;
type Ctx = { doc: PortfolioDoc; now: Date };
/** Returns null to decline — the placeholder is then left as written. */
type Resolver = (args: Args, ctx: Ctx) => string | null;

function parseArgs(raw: string): Args {
  const args: Args = {};
  for (const m of raw.matchAll(/([a-z]+)=([^\s{}]+)/g)) args[m[1]] = m[2];
  return args;
}

/** `YYYY-MM-DD`, or any ISO instant. Anything else is a refusal, not a guess. */
function parseDate(value: string | undefined): Date | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}([T ].*)?$/.test(value)) return null;
  const date = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Whole elapsed units, by the calendar rather than by division.
 *
 * 365-day years drift, and someone born on 29 February is not one day younger
 * than the arithmetic says — the answer people expect is "has the anniversary
 * happened yet", which is a comparison of month and day.
 */
function wholeUnits(from: Date, to: Date, unit: "years" | "months" | "days"): number {
  if (to <= from) return 0;
  if (unit === "days") return Math.floor((to.getTime() - from.getTime()) / 86_400_000);

  let months =
    (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + (to.getUTCMonth() - from.getUTCMonth());
  // The day of the month hasn't come round yet, so the last one doesn't count.
  if (to.getUTCDate() < from.getUTCDate()) months -= 1;
  if (months < 0) months = 0;

  return unit === "months" ? months : Math.floor(months / 12);
}

/** `{{years since=…}}` / `{{years until=…}}`, and the same for months and days. */
function elapsed(unit: "years" | "months" | "days"): Resolver {
  return (args, { now }) => {
    const since = parseDate(args.since);
    const until = parseDate(args.until);
    // Exactly one of the two, or the placeholder means nothing in particular.
    if (Boolean(since) === Boolean(until)) return null;
    return String(since ? wholeUnits(since, now, unit) : wholeUnits(now, until as Date, unit));
  };
}

/** How many entries one section holds. */
function entriesIn(section: Section): number {
  switch (section.type) {
    case "projects":
    case "experience":
    case "education":
    case "testimonials":
    case "gallery":
    case "stats":
    case "capabilities":
      return section.data.items.length;
    case "skills":
      return section.data.groups.reduce((n, g) => n + g.items.length, 0);
    case "contact":
      return section.data.channels.length;
    // About and Text hold prose, not entries; counting them would be a number
    // that means nothing.
    default:
      return 0;
  }
}

const RESOLVERS: Record<string, Resolver> = {
  /** `{{date}}` → 10 Sep 2026. `format=long|short|iso|year|month|weekday`. */
  date: (args, { now }) => {
    switch (args.format ?? "short") {
      case "short": return formatDate(now);
      case "long": return `${now.getUTCDate()} ${MONTHS_LONG[now.getUTCMonth()]} ${now.getUTCFullYear()}`;
      case "iso": return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}`;
      case "year": return String(now.getUTCFullYear());
      case "month": return MONTHS_LONG[now.getUTCMonth()];
      case "weekday": return WEEKDAYS[now.getUTCDay()];
      default: return null;
    }
  },

  /**
   * `{{time}}` → 14:32 UTC.
   *
   * Says UTC because it is UTC. Rendering the server's local time unlabelled
   * would be a clock that is wrong for most visitors and doesn't admit it.
   */
  time: (_args, { now }) => `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())} UTC`,

  years: elapsed("years"),
  months: elapsed("months"),
  days: elapsed("days"),

  /** `{{age since=1998-04-02}}` — years, spelled the way a birthday reads. */
  age: (args, ctx) => elapsed("years")({ since: args.since }, ctx),

  /** `{{count of=projects}}` — entries in the visible sections of one type. */
  count: (args, { doc }) => {
    if (!args.of) return null;
    const sections = doc.sections.filter((s) => !s.hidden && s.type === args.of);
    if (!sections.length) return null;
    return String(sections.reduce((n, s) => n + entriesIn(s), 0));
  },
};

/** Resolve every placeholder in one string. */
export function resolveText(text: string, ctx: Ctx): string {
  return text.replace(TOKEN, (raw, name: string, argString: string) => {
    const resolver = RESOLVERS[name];
    if (!resolver) return raw;
    return resolver(parseArgs(argString ?? ""), ctx) ?? raw;
  });
}

/**
 * A copy of the document with every placeholder in every string resolved.
 *
 * Document-wide rather than per-field so that a placeholder works wherever
 * text does — a stat value, a project year, a section title — without sixty
 * variants each having to remember to call something.
 *
 * Counts read the *original* document on purpose: resolving is not allowed to
 * change what is being counted, so the order fields happen to be walked in
 * can't change an answer.
 */
export function resolveDynamic(doc: PortfolioDoc, now: Date = new Date()): PortfolioDoc {
  const raw = JSON.stringify(doc);
  // The overwhelmingly common case: nothing to do, and no clone to pay for.
  if (!raw.includes("{{")) return doc;

  const ctx: Ctx = { doc, now };
  return JSON.parse(raw, (_key, value) =>
    typeof value === "string" ? resolveText(value, ctx) : value,
  ) as PortfolioDoc;
}

/** The vocabulary, for the editor's insert menu. Kept here so it can't drift. */
export const DYNAMIC_VALUES = [
  { token: "{{date}}", label: "Today's date" },
  { token: "{{date format=long}}", label: "Today, written out" },
  { token: "{{date format=year}}", label: "This year" },
  { token: "{{time}}", label: "Time of day (UTC)" },
  { token: "{{years since=2019-01-01}}", label: "Years since a date" },
  { token: "{{months since=2019-01-01}}", label: "Months since a date" },
  { token: "{{days until=2027-01-01}}", label: "Days until a date" },
  { token: "{{age since=1998-04-02}}", label: "Age from a birthday" },
  { token: "{{count of=projects}}", label: "Number of projects" },
] as const;
