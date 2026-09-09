import type { ReactNode } from "react";
import type { SectionOf } from "@/lib/schema/sections";

/**
 * Experience and education are the same shape wearing different field names, so
 * both types normalise into these rows and share all four layouts. One layout
 * written once beats two that drift.
 */
export type HistoryRow = {
  id: string;
  title: string;
  org: string;
  orgHref?: string;
  start: string;
  end?: string;
  summary?: string;
  bullets: { id: string; text: string }[];
};

export function fromExperience(section: SectionOf<"experience">): HistoryRow[] {
  return section.data.items.map((j) => ({
    id: j.id,
    title: j.role,
    org: j.org,
    orgHref: j.orgHref,
    start: j.start,
    end: j.end,
    summary: j.summary,
    bullets: j.bullets,
  }));
}

export function fromEducation(section: SectionOf<"education">): HistoryRow[] {
  return section.data.items.map((e) => ({
    id: e.id,
    title: e.qualification,
    org: e.institution,
    start: e.start,
    end: e.end,
    summary: e.summary,
    bullets: [],
  }));
}

export function period(row: HistoryRow) {
  return row.end ? `${row.start} — ${row.end}` : `${row.start} — Present`;
}

export function Org({ row }: { row: HistoryRow }) {
  if (!row.orgHref) return <span className="text-[var(--foreground-muted)]">{row.org}</span>;
  return (
    <a
      href={row.orgHref}
      target="_blank"
      rel="noopener noreferrer nofollow ugc"
      className="text-[var(--foreground-muted)] underline-offset-4 transition-colors hover:text-[var(--accent)] hover:underline"
    >
      {row.org}
    </a>
  );
}

export function Bullets({ bullets }: { bullets: HistoryRow["bullets"] }) {
  if (bullets.length === 0) return null;
  return (
    <ul className="mt-3 space-y-1.5">
      {bullets.map((b) => (
        <li key={b.id} className="flex gap-2.5 text-sm leading-relaxed text-[var(--foreground-muted)]">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]" />
          {b.text}
        </li>
      ))}
    </ul>
  );
}

export function Wrap({ children }: { children: ReactNode }) {
  return <div className="mt-12">{children}</div>;
}
