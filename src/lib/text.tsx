import type { ReactNode } from "react";

/**
 * Inline emphasis for the handful of strings that are display type — the hero
 * sentence, an About lead, a contact headline, a pull quote.
 *
 * Deliberately not markdown and deliberately not HTML. The whole vocabulary is
 * four markers, and each one maps to a token the design system already owns:
 *
 *   ==accent==   the site's accent colour
 *   **bold**     heavier weight
 *   *italic*     italic
 *   ~muted~      the muted foreground
 *
 * Colour is a *role*, never a value. "Make this word red" would mean carrying a
 * hex code in the content layer, where it would survive a preset change, fight
 * the palette, and be the one thing in a document that can't be re-themed. The
 * accent and muted roles move with the palette instead, which is what someone
 * asking for coloured text actually wants and can't get from a colour picker.
 *
 * Markers don't nest: one pass, one marker per run. The alternative is a real
 * parser, and a real parser in the content layer is the beginning of a sanitiser.
 */

/** `**` before `*`, or the shorter one would swallow the longer's opener. */
const TOKEN = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|==[^=\n]+==|~[^~\n]+~)/g;

const MARKS: { open: string; close: string; className: string }[] = [
  // font-bold, not semibold: display type is already 600, and a mark that
  // matches its surroundings is a mark that does nothing.
  { open: "**", close: "**", className: "font-bold" },
  { open: "==", close: "==", className: "text-[var(--accent)]" },
  { open: "~", close: "~", className: "text-[var(--foreground-muted)]" },
  { open: "*", close: "*", className: "italic" },
];

export function highlight(text: string): ReactNode[] {
  return text.split(TOKEN).map((part, i) => {
    const mark = MARKS.find(
      (m) => part.startsWith(m.open) && part.endsWith(m.close) && part.length > m.open.length + m.close.length,
    );

    return mark ? (
      <span key={i} className={mark.className}>
        {part.slice(mark.open.length, -mark.close.length)}
      </span>
    ) : (
      <span key={i}>{part}</span>
    );
  });
}

/** Strip the markers, for places that need plain text (title tags, alt text). */
export function plain(text: string): string {
  return text
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/==([^=\n]+)==/g, "$1")
    .replace(/~([^~\n]+)~/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1");
}

/** The vocabulary, for the editor's toolbar. Kept here so the two can't drift. */
export const MARKUP = [
  { label: "B", title: "Bold", marker: "**", className: "font-semibold" },
  { label: "I", title: "Italic", marker: "*", className: "italic" },
  { label: "A", title: "Accent colour", marker: "==", className: "text-orange-600" },
  { label: "M", title: "Muted", marker: "~", className: "opacity-60" },
] as const;
