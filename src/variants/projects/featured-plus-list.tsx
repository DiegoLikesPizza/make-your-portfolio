import { Reveal } from "@/render/primitives/Reveal";
import { SectionIndex } from "@/render/primitives/Section";
import { Cover, ProjectLink, ProjectMeta, TechList } from "@/render/primitives/ProjectBits";
import { asset, type SectionProps } from "@/render/context";

/**
 * One hero project over a compact list.
 *
 * This is the only layout that reads `featured`; it falls back to the first
 * project so the section is never headless.
 */
export default function ProjectsFeaturedPlusList({ section, index, ctx }: SectionProps<"projects">) {
  const m = ctx.doc.design.tokens.motion;
  const items = section.data.items;
  const hero = items.find((p) => p.featured) ?? items[0];
  const rest = items.filter((p) => p.id !== hero?.id);
  const cover = asset(ctx, hero?.coverAssetId);

  return (
    <div>
      <Reveal motionStyle={m}>
        <SectionIndex index={index} label={section.title} show />
      </Reveal>

      {hero && (
        <Reveal motionStyle={m} delay={0.06}>
          <article className="mt-12 grid gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              <Cover
                assetId={hero.coverAssetId}
                src={cover?.src}
                srcSet={cover?.srcSet}
                className="aspect-[16/10] w-full rounded-[var(--radius)] object-cover shadow-[var(--shadow)]"
              />
            </div>
            <div className="lg:col-span-5">
              <ProjectMeta project={hero} />
              <h3
                className="mt-4 font-[family-name:var(--font-heading)] font-semibold leading-tight tracking-[-0.02em] text-[var(--foreground)]"
                style={{ fontSize: "calc(clamp(1.75rem, 3.5vw, 2.5rem) * var(--type-scale))" }}
              >
                {hero.title}
              </h3>
              <p className="mt-4 leading-relaxed text-[var(--foreground-muted)]">{hero.summary}</p>
              <TechList tech={hero.tech} className="mt-5" />
              <ProjectLink project={hero} className="mt-6" />
            </div>
          </article>
        </Reveal>
      )}

      <ul className="mt-14 border-t border-[var(--border-color)]">
        {rest.map((p, i) => (
          <li key={p.id}>
            <Reveal motionStyle={m} delay={i * 0.04}>
              <article className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-b border-[var(--border-color)] py-5">
                <h3 className="font-[family-name:var(--font-heading)] text-lg font-medium text-[var(--foreground)]">
                  {p.title}
                </h3>
                <TechList tech={p.tech} className="flex-1" />
                <ProjectMeta project={p} />
                <ProjectLink project={p} />
              </article>
            </Reveal>
          </li>
        ))}
      </ul>
    </div>
  );
}
