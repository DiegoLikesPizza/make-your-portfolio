import type { ReactNode } from "react";

/**
 * `==highlight==` marks accent spans inside headings — the mechanism behind
 * lfdiego.xyz's "I build fast, reliable web software", where one word carries
 * the accent colour.
 *
 * Deliberately not markdown and deliberately not HTML: the only thing a user
 * can express here is "this run of text is the accent colour", so there is
 * nothing to sanitise.
 */
export function highlight(text: string): ReactNode[] {
  return text.split(/(==[^=]+==)/g).map((part, i) =>
    part.startsWith("==") && part.endsWith("==") && part.length > 4 ? (
      <span key={i} className="text-[var(--accent)]">
        {part.slice(2, -2)}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

/** Strip the markers, for places that need plain text (title tags, alt text). */
export function plain(text: string): string {
  return text.replace(/==([^=]+)==/g, "$1");
}
