import { Reveal } from "@/render/primitives/Reveal";
import { SectionIndex } from "@/render/primitives/Section";
import { Cover, ProjectLink, ProjectMeta, TechList } from "@/render/primitives/ProjectBits";
import { asset, type SectionProps } from "@/render/context";

/**
 * A CSS-columns masonry.
 *
 * `break-inside: avoid` on each card is what keeps a project from being split
 * across two columns; without it this layout looks broken at every width.
 */
export default function ProjectsMasonry({ section, index, ctx }: SectionProps<"projects">) {
  const m = ctx.doc.design.tokens.motion;

  return (
    <div>
      <Reveal motionStyle={m}>
        <SectionIndex index={index} label={section.title} show />
      </Reveal>
      <div className="mt-12 gap-5 sm:columns-2 lg:columns-3">
        {section.data.items.map((p, i) => {
          const cover = asset(ctx, p.coverAssetId);
          return (
            <div key={p.id} className="mb-5 break-inside-avoid">
              <Reveal motionStyle={m} delay={i * 0.04}>
                <article className="group rounded-[var(--radius)] border border-[var(--border-color)] bg-[var(--surface)] p-5 transition-colors hover:border-[var(--accent)]">
                  <Cover
                    assetId={p.coverAssetId}
                    src={cover?.src}
                    srcSet={cover?.srcSet}
                    className="mb-4 w-full rounded-[calc(var(--radius)-2px)] object-cover"
                  />
                  <ProjectMeta project={p} />
                  <h3 className="mt-2 font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--foreground)]">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">{p.summary}</p>
                  <TechList tech={p.tech} className="mt-3" />
                  <ProjectLink project={p} className="mt-4" />
                </article>
              </Reveal>
            </div>
          );
        })}
      </div>
    </div>
  );
}
