import { ArrowRight } from "lucide-react";
import { highlight } from "@/lib/text";
import { Reveal } from "../primitives/Reveal";
import { Background } from "../Background";
import { asset, type RenderCtx } from "../context";
import { cn } from "@/lib/utils";
import { LinkIcon } from "../primitives/LinkIcon";

/**
 * The hero is always present and always first, so it sits outside `sections`
 * and has its own variant list.
 */
export function Hero({ ctx }: { ctx: RenderCtx }) {
  const { profile, hero, design } = ctx.doc;
  const m = design.tokens.motion;
  const avatar = asset(ctx, profile.avatarAssetId);
  const centered = hero.variant === "centered-stack" || hero.variant === "full-bleed-background";

  const eyebrow = profile.eyebrow && (
    <Reveal motionStyle={m}>
      <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.14em] text-[var(--foreground-subtle)] sm:text-sm">
        {profile.eyebrow}
      </p>
    </Reveal>
  );

  const headline = (
    <Reveal motionStyle={m} delay={0.06}>
      <h1
        className="mt-6 font-[family-name:var(--font-heading)] font-semibold leading-[0.96] tracking-[-0.03em] text-[var(--foreground)]"
        style={{
          fontSize:
            hero.variant === "oversized-type"
              ? "calc(clamp(3rem, 13vw, 10rem) * var(--type-scale))"
              : hero.variant === "minimal-line"
                ? "calc(clamp(1.75rem, 4vw, 2.75rem) * var(--type-scale))"
                : "calc(clamp(2.6rem, 8.5vw, 6.25rem) * var(--type-scale))",
          lineHeight: hero.variant === "oversized-type" ? "0.88" : undefined,
        }}
      >
        {highlight(profile.headline)}
      </h1>
    </Reveal>
  );

  const bio = profile.bio && (
    <Reveal motionStyle={m} delay={0.12}>
      <p className={cn("mt-8 max-w-[52ch] text-lg leading-relaxed text-[var(--foreground-muted)]", centered && "mx-auto")}>
        {profile.bio}
      </p>
    </Reveal>
  );

  const ctas = profile.ctas.length > 0 && (
    <Reveal motionStyle={m} delay={0.18}>
      <div className={cn("mt-10 flex flex-wrap items-center gap-x-6 gap-y-4", centered && "justify-center")}>
        {profile.ctas.map((c) => (
          <a
            key={c.id}
            href={c.target.startsWith("http") || c.target.startsWith("mailto:") ? c.target : `#${c.target}`}
            className={cn(
              "group inline-flex items-center gap-2 text-base font-medium transition-colors",
              c.style === "solid" &&
                "rounded-[var(--radius)] bg-[var(--accent)] px-6 py-3.5 text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)]",
              c.style === "outline" &&
                "rounded-[var(--radius)] border border-[var(--border-color)] px-6 py-3.5 text-[var(--foreground)] hover:border-[var(--accent)]",
              c.style === "text" && "text-[var(--foreground)] hover:text-[var(--accent)]",
            )}
          >
            {c.label}
            {c.style === "solid" && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
          </a>
        ))}
      </div>
    </Reveal>
  );

  const links = profile.links.length > 0 && (
    <Reveal motionStyle={m} delay={0.24}>
      <ul className={cn("mt-14 flex flex-wrap gap-x-6 gap-y-3", centered && "justify-center")}>
        {profile.links.map((l) => (
          <li key={l.id}>
            <a
              href={l.href}
              target={l.href.startsWith("http") ? "_blank" : undefined}
              rel={l.href.startsWith("http") ? "noopener noreferrer nofollow ugc" : undefined}
              className="inline-flex items-center gap-2 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.12em] text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]"
            >
              <LinkIcon name={l.icon} className="h-3.5 w-3.5" />
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </Reveal>
  );

  const terminal = hero.variant === "terminal-prompt";

  const body = terminal ? (
    <div className="w-full max-w-[62ch] rounded-[var(--radius)] border border-[var(--border-color)] bg-[var(--surface)] p-6 font-[family-name:var(--font-mono)] shadow-[var(--shadow)] md:p-8">
      <div className="flex gap-1.5" aria-hidden>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <span key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
        ))}
      </div>
      <div className="mt-6 space-y-3 text-sm leading-relaxed">
        {profile.eyebrow && (
          <p className="text-[var(--foreground-subtle)]">
            <span className="text-[var(--accent)]">$</span> whoami
            <span className="mt-1 block text-[var(--foreground-muted)]">{profile.eyebrow}</span>
          </p>
        )}
        <p className="text-[var(--foreground-subtle)]">
          <span className="text-[var(--accent)]">$</span> cat headline.txt
          <span className="mt-1 block text-lg font-medium text-[var(--foreground)] md:text-xl">
            {highlight(profile.headline)}
          </span>
        </p>
        {profile.bio && (
          <p className="text-[var(--foreground-subtle)]">
            <span className="text-[var(--accent)]">$</span> cat about.txt
            <span className="mt-1 block text-[var(--foreground-muted)]">{profile.bio}</span>
          </p>
        )}
        <p className="text-[var(--foreground-subtle)]">
          <span className="text-[var(--accent)]">$</span>
          <span className="ml-2 inline-block h-4 w-2 translate-y-0.5 bg-[var(--accent)]" aria-hidden />
        </p>
      </div>
      <div className="mt-8">{ctas}</div>
      {links}
    </div>
  ) : (
    <>
      {eyebrow}
      {headline}
      {bio}
      {ctas}
      {links}
    </>
  );

  return (
    <section id="top" className="relative">
      <Background config={hero.background} ctx={ctx} />
      <div
        className={cn(
          "mx-auto flex min-h-[88svh] px-6 pb-16 pt-28 md:px-10",
          centered ? "items-center justify-center text-center" : "items-start lg:items-center",
        )}
        style={{ maxWidth: "var(--container)" }}
      >
        {hero.variant === "portrait-side" || hero.variant === "image-right-split" ? (
          <div
            className={cn(
              "grid w-full items-center gap-12 lg:grid-cols-2",
              hero.variant === "portrait-side" && "lg:grid-cols-[1fr_auto]",
            )}
          >
            <div>{body}</div>
            {avatar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar.src}
                srcSet={avatar.srcSet}
                alt={profile.name}
                width={avatar.width}
                height={avatar.height}
                className="w-full rounded-[var(--radius)] object-cover shadow-[var(--shadow)]"
              />
            )}
          </div>
        ) : hero.variant === "minimal-line" ? (
          <div className="w-full max-w-[52ch]">{body}</div>
        ) : (
          <div className="w-full">{body}</div>
        )}
      </div>
    </section>
  );
}
