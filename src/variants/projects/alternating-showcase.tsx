import { Reveal } from "@/render/primitives/Reveal";
import { SectionIndex } from "@/render/primitives/Section";
import { Cover, ProjectLink, ProjectMeta, TechList } from "@/render/primitives/ProjectBits";
import { asset, type SectionProps } from "@/render/context";

/** Large alternating image/copy rows — the most editorial of the eight. */
export default function ProjectsAlternatingShowcase({ section, index, ctx }: SectionProps<"projects">) {
  const m = ctx.doc.design.tokens.motion;

  return (
    <div>
      <Reveal motionStyle={m}>
        <SectionIndex index={index} label={section.title} show />
      </Reveal>
      <div className="mt-14 space-y-20">
        {section.data.items.map((p, i) => {
          const cover = asset(ctx, p.coverAssetId);
          const flipped = i % 2 === 1;
          return (
            <Reveal key={p.id} motionStyle={m}>
              <article className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
                <div className={flipped ? "lg:order-2" : undefined}>
                  <Cover
                    assetId={p.coverAssetId}
                    src={cover?.src}
                    srcSet={cover?.srcSet}
                    className="aspect-[4/3] w-full rounded-[var(--radius)] object-cover shadow-[var(--shadow)]"
                  />
                </div>
                <div className={flipped ? "lg:order-1" : undefined}>
                  <ProjectMeta project={p} />
                  <h3
                    className="mt-4 font-[family-name:var(--font-heading)] font-semibold leading-tight tracking-[-0.02em] text-[var(--foreground)]"
                    style={{ fontSize: "calc(clamp(1.75rem, 3.5vw, 2.5rem) * var(--type-scale))" }}
                  >
                    {p.title}
                  </h3>
                  <p className="mt-4 max-w-[50ch] text-lg leading-relaxed text-[var(--foreground-muted)]">{p.summary}</p>
                  <TechList tech={p.tech} className="mt-5" />
                  <ProjectLink project={p} className="mt-6" />
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
