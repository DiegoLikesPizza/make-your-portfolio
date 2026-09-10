import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/render/primitives/Reveal";
import { SectionIndex } from "@/render/primitives/Section";
import { StatusBadge } from "@/render/primitives/StatusBadge";
import type { SectionProps } from "@/render/context";
import { option } from "@/lib/variant-options";

/** lfdiego.xyz's Work: a numbered editorial list, one row per project. */
export default function ProjectsNumberedList({ section, index, ctx }: SectionProps<"projects">) {
  const m = ctx.doc.design.tokens.motion;
  const { items } = section.data;
  const dividers = option(section, "dividers");
  const showTech = option(section, "showTech");

  return (
    <div>
      <Reveal motionStyle={m}>
        <SectionIndex index={index} label={section.title} show />
      </Reveal>

      <ul className={`mt-12 ${dividers ? "border-t border-[var(--border-color)]" : ""}`}>
        {items.map((p, i) => {
          const external = p.href?.startsWith("http");
          return (
            <li key={p.id}>
              <Reveal motionStyle={m} delay={i * 0.04}>
                <article
                  className={`group grid gap-4 py-8 md:grid-cols-12 md:gap-8 md:py-10 ${
                    dividers ? "border-b border-[var(--border-color)]" : ""
                  }`}
                >
                  <div className="md:col-span-2">
                    <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.14em] text-[var(--foreground-subtle)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <div className="md:col-span-7">
                    <h3 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-[var(--foreground)]">
                      {p.title}
                    </h3>
                    <p className="mt-3 max-w-[60ch] leading-relaxed text-[var(--foreground-muted)]">{p.summary}</p>
                    {showTech && p.tech.length > 0 && (
                      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
                        {p.tech.map((t) => (
                          <li key={t} className="font-[family-name:var(--font-mono)] text-xs text-[var(--foreground-subtle)]">
                            {t}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex flex-col items-start gap-3 md:col-span-3 md:items-end">
                    <div className="flex items-center gap-3">
                      {p.year && (
                        <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--foreground-subtle)]">{p.year}</span>
                      )}
                      <StatusBadge status={p.status} />
                    </div>
                    {p.href && (
                      <a
                        href={p.href}
                        target={external ? "_blank" : undefined}
                        rel={external ? "noopener noreferrer nofollow ugc" : undefined}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:text-[var(--accent)]"
                      >
                        {p.linkLabel ?? "View"}
                        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </a>
                    )}
                  </div>
                </article>
              </Reveal>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
