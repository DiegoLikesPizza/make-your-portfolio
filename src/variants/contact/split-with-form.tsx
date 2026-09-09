import { Reveal } from "@/render/primitives/Reveal";
import { SectionIndex } from "@/render/primitives/Section";
import { LinkIcon } from "@/render/primitives/LinkIcon";
import { highlight } from "@/lib/text";
import { MailtoForm } from "@/render/primitives/MailtoForm";
import type { SectionProps } from "@/render/context";

/**
 * Copy and channels left, a message form right.
 *
 * The form composes a `mailto:` rather than posting anywhere — there is no
 * submissions backend, and a form that quietly discards messages is worse than
 * no form. It opens the visitor's mail client with everything filled in.
 */
export default function ContactSplitWithForm({ section, index, ctx }: SectionProps<"contact">) {
  const m = ctx.doc.design.tokens.motion;
  const { headline, blurb, channels } = section.data;

  const mailChannel = channels.find((c) => c.href.startsWith("mailto:"));
  const address = (mailChannel?.href ?? `mailto:${ctx.doc.profile.email ?? ""}`).replace(/^mailto:/, "");

  return (
    <div>
      <Reveal motionStyle={m}>
        <SectionIndex index={index} label={section.title} show />
      </Reveal>

      <div className="mt-12 grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <Reveal motionStyle={m} delay={0.06}>
            {headline && (
              <h2
                className="font-[family-name:var(--font-heading)] font-semibold leading-tight tracking-[-0.02em] text-[var(--foreground)]"
                style={{ fontSize: "calc(clamp(2rem, 4.5vw, 3rem) * var(--type-scale))" }}
              >
                {highlight(headline)}
              </h2>
            )}
            {blurb && <p className="mt-5 max-w-[40ch] text-lg leading-relaxed text-[var(--foreground-muted)]">{blurb}</p>}
          </Reveal>

          <ul className="mt-8 space-y-3">
            {channels.map((c) => {
              const external = c.href.startsWith("http");
              return (
                <li key={c.id}>
                  <a
                    href={c.href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer nofollow ugc" : undefined}
                    className="inline-flex items-center gap-2.5 text-[var(--foreground-muted)] transition-colors hover:text-[var(--accent)]"
                  >
                    <LinkIcon name={c.icon} className="h-4 w-4" />
                    {c.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        <Reveal motionStyle={m} delay={0.1}>
          {address ? (
            <MailtoForm address={address} />
          ) : (
            <p className="text-sm text-[var(--foreground-subtle)]">
              Add an email address in your profile to enable the message form.
            </p>
          )}
        </Reveal>
      </div>
    </div>
  );
}
