import { Reveal } from "@/render/primitives/Reveal";
import type { SectionProps } from "@/render/context";

/** An accent-bordered panel. No section index — it is an aside, not a chapter. */
export default function TextCallout({ section, ctx }: SectionProps<"text">) {
  const m = ctx.doc.design.tokens.motion;
  return (
    <Reveal motionStyle={m}>
      <div className="rounded-[var(--radius)] border border-[var(--border-color)] border-l-2 border-l-[var(--accent)] bg-[var(--accent-soft)] p-6 md:p-8">
        {section.title && (
          <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--foreground)]">
            {section.title}
          </h3>
        )}
        <div className="mt-3 max-w-[62ch] space-y-4 leading-relaxed text-[var(--foreground-muted)]">
          {section.data.body.split(/\n\n+/).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
