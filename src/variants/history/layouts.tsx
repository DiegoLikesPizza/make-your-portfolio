import { Reveal } from "@/render/primitives/Reveal";
import { SectionIndex } from "@/render/primitives/Section";
import type { Tokens } from "@/lib/schema/tokens";
import { Bullets, Org, period, type HistoryRow } from "./shared";

/** The four history layouts, shared by Experience and Education. */

type Props = {
  rows: HistoryRow[];
  index: number;
  title?: string;
  motion: Tokens["motion"];
};

function Head({ index, title, motion }: { index: number; title?: string; motion: Tokens["motion"] }) {
  return (
    <Reveal motionStyle={motion}>
      <SectionIndex index={index} label={title} show />
    </Reveal>
  );
}

export function TimelineVertical({ rows, index, title, motion }: Props) {
  return (
    <div>
      <Head index={index} title={title} motion={motion} />
      <ol className="mt-12 border-l border-[var(--border-color)]">
        {rows.map((row, i) => (
          <li key={row.id} className="relative pb-10 pl-8 last:pb-0">
            <Reveal motionStyle={motion} delay={i * 0.05}>
              <span className="absolute -left-[4.5px] top-2 h-2 w-2 rounded-full bg-[var(--accent)]" />
              <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
                {period(row)}
              </span>
              <h3 className="mt-2 font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--foreground)]">
                {row.title}
              </h3>
              <p className="mt-0.5 text-sm">
                <Org row={row} />
              </p>
              {row.summary && <p className="mt-3 max-w-[60ch] leading-relaxed text-[var(--foreground-muted)]">{row.summary}</p>}
              <Bullets bullets={row.bullets} />
            </Reveal>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function TwoColList({ rows, index, title, motion }: Props) {
  return (
    <div>
      <Head index={index} title={title} motion={motion} />
      <ul className="mt-12 border-t border-[var(--border-color)]">
        {rows.map((row, i) => (
          <li key={row.id}>
            <Reveal motionStyle={motion} delay={i * 0.04}>
              <article className="grid gap-3 border-b border-[var(--border-color)] py-7 md:grid-cols-12 md:gap-8">
                <div className="md:col-span-4">
                  <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
                    {period(row)}
                  </span>
                </div>
                <div className="md:col-span-8">
                  <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--foreground)]">
                    {row.title}
                  </h3>
                  <p className="mt-0.5 text-sm">
                    <Org row={row} />
                  </p>
                  {row.summary && <p className="mt-3 max-w-[60ch] leading-relaxed text-[var(--foreground-muted)]">{row.summary}</p>}
                  <Bullets bullets={row.bullets} />
                </div>
              </article>
            </Reveal>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HistoryTable({ rows, index, title, motion }: Props) {
  return (
    <div>
      <Head index={index} title={title} motion={motion} />
      <div className="mt-12 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[var(--border-color)]">
              {["Period", "Role", "Organisation"].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="pb-3 font-[family-name:var(--font-mono)] text-xs font-normal uppercase tracking-[0.12em] text-[var(--foreground-subtle)]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-[var(--border-color)]">
                <td className="py-4 pr-6 font-[family-name:var(--font-mono)] text-xs text-[var(--foreground-subtle)]">
                  {period(row)}
                </td>
                <td className="py-4 pr-6">
                  <span className="font-medium text-[var(--foreground)]">{row.title}</span>
                  {row.summary && <span className="mt-1 block max-w-[46ch] text-sm text-[var(--foreground-muted)]">{row.summary}</span>}
                </td>
                <td className="py-4 text-sm">
                  <Org row={row} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function HistoryCards({ rows, index, title, motion }: Props) {
  return (
    <div>
      <Head index={index} title={title} motion={motion} />
      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {rows.map((row, i) => (
          <Reveal key={row.id} motionStyle={motion} delay={i * 0.05}>
            <article className="h-full rounded-[var(--radius)] border border-[var(--border-color)] bg-[var(--surface)] p-6">
              <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
                {period(row)}
              </span>
              <h3 className="mt-3 font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--foreground)]">
                {row.title}
              </h3>
              <p className="mt-0.5 text-sm">
                <Org row={row} />
              </p>
              {row.summary && <p className="mt-3 leading-relaxed text-[var(--foreground-muted)]">{row.summary}</p>}
              <Bullets bullets={row.bullets} />
            </article>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
