import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/render/primitives/Reveal";
import { SectionIndex } from "@/render/primitives/Section";
import { StatusBadge } from "@/render/primitives/StatusBadge";
import { asset, type SectionProps } from "@/render/context";

/** Same project data as `numbered-list`; this layout additionally uses covers. */
export default function ProjectsGrid3({ section, index, ctx }: SectionProps<"projects">) {
  const m = ctx.doc.design.tokens.motion;

  return (
    <div>
      <Reveal motionStyle={m}>
        <SectionIndex index={index} label={section.title} show />
      </Reveal>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {section.data.items.map((p, i) => {
          const cover = asset(ctx, p.coverAssetId);
          const external = p.href?.startsWith("http");
          return (
            <Reveal key={p.id} motionStyle={m} delay={i * 0.05}>
              <article className="group flex h-full flex-col overflow-hidden rounded-[var(--radius)] border border-[var(--border-color)] bg-[var(--surface)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow)]">
                {cover && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cover.src}
                    srcSet={cover.srcSet}
                    alt=""
                    width={cover.width}
                    height={cover.height}
                    loading="lazy"
                    className="aspect-[16/10] w-full object-cover"
                  />
                )}
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center gap-3">
                    {p.year && (
                      <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--foreground-subtle)]">{p.year}</span>
                    )}
                    <StatusBadge status={p.status} />
                  </div>
                  <h3 className="mt-3 font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--foreground)]">
                    {p.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--foreground-muted)]">{p.summary}</p>
                  {p.tech.length > 0 && (
                    <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-1">
                      {p.tech.map((t) => (
                        <li key={t} className="font-[family-name:var(--font-mono)] text-xs text-[var(--foreground-subtle)]">
                          {t}
                        </li>
                      ))}
                    </ul>
                  )}
                  {p.href && (
                    <a
                      href={p.href}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noopener noreferrer nofollow ugc" : undefined}
                      className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--foreground)] hover:text-[var(--accent)]"
                    >
                      {p.linkLabel ?? "View"}
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
