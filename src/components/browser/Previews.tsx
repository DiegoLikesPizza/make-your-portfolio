import type { PortfolioDoc } from "@/lib/schema/portfolio";
import type { SectionType } from "@/lib/schema/sections";
import { implementedVariants, isBleed, resolveVariant } from "@/variants/registry";
import { SectionFrame } from "@/render/primitives/Section";
import { Hero } from "@/render/hero/Hero";
import { Nav } from "@/render/Nav";
import type { RenderCtx } from "@/render/context";
import { SECTION_INFO, HERO_VARIANTS, NAV_VARIANTS, needsImages, variantLabel } from "@/lib/catalog";
import { PreviewCard } from "./PreviewCard";

/**
 * The previews are the real components with real tokens, not screenshots — so
 * the browser cannot drift from what publishing actually produces.
 */

function Stage({ doc, children, className }: { doc: PortfolioDoc; children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`portfolio bg-[var(--background)] text-[var(--foreground)] ${className ?? ""}`}
      data-scheme={doc.design.colorScheme}
    >
      {children}
    </div>
  );
}

export function SectionPreviews({ type, doc, ctx }: { type: SectionType; doc: PortfolioDoc; ctx: RenderCtx }) {
  const built = new Set<string>(implementedVariants(type));

  return (
    <>
      <p className="text-sm text-neutral-500">{SECTION_INFO[type].blurb}</p>
      {doc.sections
        .filter((s) => built.has(s.variant))
        .map((section, i) => {
          const Component = resolveVariant(section.type, section.variant);
          if (!Component) return null;
          return (
            <PreviewCard
              key={section.id}
              title={variantLabel(section.variant)}
              subtitle={`${type}:${section.variant}`}
              note={
                needsImages(type, section.variant)
                  ? "Grey blocks are where uploaded images go — uploads aren't built yet."
                  : undefined
              }
            >
              <Stage doc={doc}>
                <SectionFrame slug={section.slug} ctx={ctx} bleed={isBleed(section.type, section.variant)}>
                  <Component section={section} index={i + 1} ctx={ctx} />
                </SectionFrame>
              </Stage>
            </PreviewCard>
          );
        })}
    </>
  );
}

export function HeroPreviews({ doc }: { doc: PortfolioDoc }) {
  return (
    <>
      <p className="text-sm text-neutral-500">
        The hero is always first and always present. It uses your name, headline and links, whichever
        shape you pick.
      </p>
      {HERO_VARIANTS.map((variant) => {
        const heroDoc: PortfolioDoc = { ...doc, hero: { ...doc.hero, variant } };
        return (
          <PreviewCard key={variant} title={variantLabel(variant)} subtitle={`hero:${variant}`}>
            {/* Heroes are a full viewport tall by design; the preview shortens
                them so the page stays browsable. */}
            <Stage doc={doc} className="[&>section]:min-h-[52svh] [&_.min-h-\[88svh\]]:min-h-[52svh]">
              <Hero ctx={{ doc: heroDoc, assets: {} }} />
            </Stage>
          </PreviewCard>
        );
      })}
    </>
  );
}

export function NavPreviews({ doc }: { doc: PortfolioDoc }) {
  const items = doc.sections.slice(0, 4).map((s) => ({ slug: s.slug, label: s.title ?? s.slug }));

  return (
    <>
      <p className="text-sm text-neutral-500">
        Navigation is a site-level choice, independent of the preset — every preset supports all eight.
        These previews are static; on a real page they follow scrolling and highlight the section
        you are in. Side and dot variants appear on wide screens only.
      </p>
      {NAV_VARIANTS.map((variant) => (
        <PreviewCard key={variant} title={variantLabel(variant)} subtitle={`nav:${variant}`}>
          {/* Nav variants position against the viewport, so the preview traps
              them inside this box with `relative` + absolute children. */}
          <Stage doc={doc} className="relative h-56 overflow-hidden [&_header]:!absolute [&_nav[aria-label='Sections']]:!absolute">
            <Nav config={{ ...doc.design.nav, variant }} items={items} monogram={doc.profile.initials} />
            <div className="px-6 pt-20 text-sm text-[var(--foreground-subtle)]">
              {variant === "none"
                ? "No navigation — the page is scrolled, not navigated."
                : "Page content sits here."}
            </div>
          </Stage>
        </PreviewCard>
      ))}
    </>
  );
}
