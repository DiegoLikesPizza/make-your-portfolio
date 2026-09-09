import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/render/primitives/Reveal";
import { SectionIndex } from "@/render/primitives/Section";
import { StatusBadge } from "@/render/primitives/StatusBadge";
import type { SectionProps } from "@/render/context";

/** The densest projects layout. Scrolls inside itself rather than the page. */
export default function ProjectsTable({ section, index, ctx }: SectionProps<"projects">) {
  const m = ctx.doc.design.tokens.motion;

  return (
    <div>
      <Reveal motionStyle={m}>
        <SectionIndex index={index} label={section.title} show />
      </Reveal>
      <div className="mt-12 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[var(--border-color)]">
              {["Year", "Project", "Stack", "Status", ""].map((h) => (
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
            {section.data.items.map((p) => {
              const external = p.href?.startsWith("http");
              return (
                <tr key={p.id} className="border-b border-[var(--border-color)]">
                  <td className="py-4 pr-6 font-[family-name:var(--font-mono)] text-xs text-[var(--foreground-subtle)]">
                    {p.year}
                  </td>
                  <td className="py-4 pr-6">
                    <span className="font-medium text-[var(--foreground)]">{p.title}</span>
                    <span className="mt-1 block max-w-[48ch] text-sm text-[var(--foreground-muted)]">{p.summary}</span>
                  </td>
                  <td className="py-4 pr-6 font-[family-name:var(--font-mono)] text-xs text-[var(--foreground-subtle)]">
                    {p.tech.join(" · ")}
                  </td>
                  <td className="py-4 pr-6">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="py-4">
                    {p.href && (
                      <a
                        href={p.href}
                        target={external ? "_blank" : undefined}
                        rel={external ? "noopener noreferrer nofollow ugc" : undefined}
                        aria-label={`${p.linkLabel ?? "View"} — ${p.title}`}
                        className="text-[var(--foreground-muted)] hover:text-[var(--accent)]"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
