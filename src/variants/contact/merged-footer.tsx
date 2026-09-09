import { Reveal } from "@/render/primitives/Reveal";
import { LinkIcon } from "@/render/primitives/LinkIcon";
import { highlight } from "@/lib/text";
import type { SectionProps } from "@/render/context";

/**
 * Contact that reads as the end of the page: an oversized name, channels in a
 * row. Pairs with `footer: "none"` so the page ends once, not twice.
 */
export default function ContactMergedFooter({ section, ctx }: SectionProps<"contact">) {
  const m = ctx.doc.design.tokens.motion;
  const { headline, blurb, channels } = section.data;

  return (
    <div>
      <Reveal motionStyle={m}>
        {headline && (
          <h2
            className="max-w-[14ch] font-[family-name:var(--font-heading)] font-semibold leading-[0.95] tracking-[-0.035em] text-[var(--foreground)]"
            style={{ fontSize: "calc(clamp(2.75rem, 10vw, 7rem) * var(--type-scale))" }}
          >
            {highlight(headline)}
          </h2>
        )}
      </Reveal>
      {blurb && (
        <Reveal motionStyle={m} delay={0.08}>
          <p className="mt-8 max-w-[44ch] text-lg leading-relaxed text-[var(--foreground-muted)]">{blurb}</p>
        </Reveal>
      )}
      <Reveal motionStyle={m} delay={0.14}>
        <ul className="mt-14 flex flex-wrap gap-x-8 gap-y-4 border-t border-[var(--border-color)] pt-8">
          {channels.map((c) => {
            const external = c.href.startsWith("http");
            return (
              <li key={c.id}>
                <a
                  href={c.href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer nofollow ugc" : undefined}
                  className="inline-flex items-center gap-2 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.12em] text-[var(--foreground-muted)] transition-colors hover:text-[var(--accent)]"
                >
                  <LinkIcon name={c.icon} className="h-3.5 w-3.5" />
                  {c.label}
                </a>
              </li>
            );
          })}
        </ul>
      </Reveal>
    </div>
  );
}
