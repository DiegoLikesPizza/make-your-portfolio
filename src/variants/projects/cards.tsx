import { Reveal } from "@/render/primitives/Reveal";
import { SectionIndex } from "@/render/primitives/Section";
import { Cover, ProjectLink, ProjectMeta, TechList } from "@/render/primitives/ProjectBits";
import { asset, type SectionProps } from "@/render/context";

/** Bordered cards in two columns — heavier than the grid, lighter than showcase. */
export default function ProjectsCards({ section, index, ctx }: SectionProps<"projects">) {
  const m = ctx.doc.design.tokens.motion;

  return (
    <div>
      <Reveal motionStyle={m}>
        <SectionIndex index={index} label={section.title} show />
      </Reveal>
      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {section.data.items.map((p, i) => {
          const cover = asset(ctx, p.coverAssetId);
          return (
            <Reveal key={p.id} motionStyle={m} delay={i * 0.05}>
              <article className="group flex h-full flex-col rounded-[var(--radius)] border border-[var(--border-color)] bg-[var(--surface)] p-6 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-[var(--shadow)]">
                <Cover
                  assetId={p.coverAssetId}
                  src={cover?.src}
                  srcSet={cover?.srcSet}
                  className="mb-5 aspect-[16/9] w-full rounded-[calc(var(--radius)-2px)] object-cover"
                />
                <ProjectMeta project={p} />
                <h3 className="mt-3 font-[family-name:var(--font-heading)] text-xl font-semibold text-[var(--foreground)]">
                  {p.title}
                </h3>
                <p className="mt-2 flex-1 leading-relaxed text-[var(--foreground-muted)]">{p.summary}</p>
                <TechList tech={p.tech} className="mt-4" />
                <ProjectLink project={p} className="mt-5" />
              </article>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
