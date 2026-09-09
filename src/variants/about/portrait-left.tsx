import { Reveal } from "@/render/primitives/Reveal";
import { SectionIndex } from "@/render/primitives/Section";
import { asset, type SectionProps } from "@/render/context";

/** The only About layout that uses `imageAssetId`. */
export default function AboutPortraitLeft({ section, index, ctx }: SectionProps<"about">) {
  const m = ctx.doc.design.tokens.motion;
  const { lead, body, footnote, imageAssetId } = section.data;
  const image = asset(ctx, imageAssetId);

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
      <div className="lg:col-span-5">
        <Reveal motionStyle={m}>
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image.src}
              srcSet={image.srcSet}
              alt={ctx.doc.profile.name}
              width={image.width}
              height={image.height}
              className="w-full rounded-[var(--radius)] object-cover shadow-[var(--shadow)]"
            />
          ) : (
            <div className="aspect-[4/5] w-full rounded-[var(--radius)] bg-[var(--background-secondary)]" aria-hidden />
          )}
        </Reveal>
      </div>
      <div className="lg:col-span-7">
        <Reveal motionStyle={m}>
          <SectionIndex index={index} label={section.title} show />
        </Reveal>
        <Reveal motionStyle={m} delay={0.08}>
          <p className="mt-8 font-[family-name:var(--font-heading)] text-2xl font-medium leading-snug text-[var(--foreground)] md:text-[1.75rem]">
            {lead}
          </p>
        </Reveal>
        <Reveal motionStyle={m} delay={0.14}>
          <div className="mt-6 max-w-[58ch] space-y-5 text-lg leading-relaxed text-[var(--foreground-muted)]">
            {body.split(/\n\n+/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </Reveal>
        {footnote && (
          <p className="mt-8 border-t border-[var(--border-color)] pt-5 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
            {footnote}
          </p>
        )}
      </div>
    </div>
  );
}
