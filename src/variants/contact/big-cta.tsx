import { Reveal } from "@/render/primitives/Reveal";
import { LinkIcon } from "@/render/primitives/LinkIcon";
import { highlight } from "@/lib/text";
import type { SectionProps } from "@/render/context";

/** One oversized line and a single primary channel; the rest demoted to a row. */
export default function ContactBigCta({ section, ctx }: SectionProps<"contact">) {
  const m = ctx.doc.design.tokens.motion;
  const { headline, blurb, channels } = section.data;
  const primary = channels[0];

  return (
    <div className="text-center">
      {headline && (
        <Reveal motionStyle={m}>
          <h2
            className="mx-auto max-w-[16ch] font-[family-name:var(--font-heading)] font-semibold leading-[1.02] tracking-[-0.03em] text-[var(--foreground)]"
            style={{ fontSize: "calc(clamp(2.5rem, 8vw, 5.5rem) * var(--type-scale))" }}
          >
            {highlight(headline)}
          </h2>
        </Reveal>
      )}
      {blurb && (
        <Reveal motionStyle={m} delay={0.08}>
          <p className="mx-auto mt-6 max-w-[46ch] text-lg leading-relaxed text-[var(--foreground-muted)]">{blurb}</p>
        </Reveal>
      )}
      {primary && (
        <Reveal motionStyle={m} delay={0.14}>
          <a
            href={primary.href}
            className="mt-10 inline-flex items-center gap-2 rounded-[var(--radius)] bg-[var(--accent)] px-8 py-4 text-lg font-medium text-[var(--accent-foreground)] transition-colors hover:bg-[var(--accent-hover)]"
          >
            <LinkIcon name={primary.icon} className="h-5 w-5" />
            {primary.label}
          </a>
        </Reveal>
      )}
      {channels.length > 1 && (
        <ul className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-3">
          {channels.slice(1).map((c) => (
            <li key={c.id}>
              <a
                href={c.href}
                target={c.href.startsWith("http") ? "_blank" : undefined}
                rel={c.href.startsWith("http") ? "noopener noreferrer nofollow ugc" : undefined}
                className="inline-flex items-center gap-2 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.12em] text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              >
                <LinkIcon name={c.icon} className="h-3.5 w-3.5" />
                {c.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
