import { Reveal } from "@/render/primitives/Reveal";
import { SectionIndex } from "@/render/primitives/Section";
import { Cover, ProjectLink, ProjectMeta, TechList } from "@/render/primitives/ProjectBits";
import { asset, type SectionProps } from "@/render/context";

/** Two wide columns, borderless — the quietest of the grid layouts. */
export default function ProjectsGrid2({ section, index, ctx }: SectionProps<"projects">) {
  const m = ctx.doc.design.tokens.motion;

  return (
    <div>
      <Reveal motionStyle={m}>
        <SectionIndex index={index} label={section.title} show />
      </Reveal>
      <div className="mt-12 grid gap-x-10 gap-y-14 md:grid-cols-2">
        {section.data.items.map((p, i) => {
          const cover = asset(ctx, p.coverAssetId);
          return (
            <Reveal key={p.id} motionStyle={m} delay={i * 0.05}>
              <article className="group">
                <Cover
                  assetId={p.coverAssetId}
                  src={cover?.src}
                  srcSet={cover?.srcSet}
                  className="mb-6 aspect-[3/2] w-full rounded-[var(--radius)] object-cover"
                />
                <ProjectMeta project={p} />
                <h3 className="mt-3 font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-[-0.01em] text-[var(--foreground)]">
                  {p.title}
                </h3>
                <p className="mt-3 max-w-[52ch] leading-relaxed text-[var(--foreground-muted)]">{p.summary}</p>
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
