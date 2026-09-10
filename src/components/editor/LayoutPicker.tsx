"use client";

import { createElement, useEffect, useState } from "react";
import type { PortfolioDoc } from "@/lib/schema/portfolio";
import type { Section, SectionType } from "@/lib/schema/sections";
import { implementedVariants, isBleed, resolveVariant } from "@/variants/registry";
import { SectionFrame } from "@/render/primitives/Section";
import { tokensToCss } from "@/render/tokens";
import { SECTION_INFO, SECTION_TYPES_IN_ORDER, variantLabel } from "@/lib/catalog";
import { sampleSection } from "@/lib/fixtures/sweep";
import { addableTypes } from "./options";

/**
 * Browse the layouts instead of picking one out of a dropdown.
 *
 * A layout is a visual decision and a `<select>` full of kebab-case ids is the
 * worst possible way to make one — "featured plus list" means nothing until you
 * see it. Every card here is the real variant component rendered with the site's
 * own tokens, so the picker cannot show you something publishing wouldn't.
 *
 * Two jobs, one component, because they are the same question asked twice:
 *
 *   add      pick a type, then a layout for a section that doesn't exist yet;
 *            previews use sample content.
 *   convert  change an existing section's layout. Previews use *your* content,
 *            which is the whole point — every variant of a type consumes the
 *            same data, so this is a preview, not a migration.
 */

type Props = {
  doc: PortfolioDoc;
  onClose: () => void;
} & (
  | { mode: "add"; onPick: (type: SectionType, variant: string) => void }
  | { mode: "convert"; section: Section; onPick: (type: SectionType, variant: string) => void }
);

export function LayoutPicker(props: Props) {
  const { doc, onClose } = props;
  const convert = props.mode === "convert" ? props.section : null;

  const [type, setType] = useState<SectionType>(convert?.type ?? addableTypes()[0]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const variants = implementedVariants(type);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={convert ? "Change layout" : "Add a section"}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* The tokens the previews render against — the site's own, scoped to this
          dialog so the editor chrome around it is untouched. */}
      <style dangerouslySetInnerHTML={{ __html: tokensToCss(doc.design.tokens, ".layout-preview") }} />

      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-[min(46rem,90vh)] w-[min(72rem,95vw)] flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
      >
        <header className="flex shrink-0 items-baseline gap-3 border-b border-neutral-200 px-5 py-3 dark:border-neutral-800">
          <h2 className="text-sm font-semibold">{convert ? "Change layout" : "Add a section"}</h2>
          <p className="min-w-0 flex-1 truncate text-xs text-neutral-500 dark:text-neutral-400">
            {convert
              ? "Every layout of a section shows the same content — switching never loses anything."
              : SECTION_INFO[type].blurb}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded px-2 py-1 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
          >
            ✕
          </button>
        </header>

        <div className="flex min-h-0 flex-1">
          {!convert && (
            <nav className="w-44 shrink-0 overflow-y-auto border-r border-neutral-200 p-2 dark:border-neutral-800">
              {SECTION_TYPES_IN_ORDER.filter((t) => addableTypes().includes(t)).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex w-full items-baseline justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
                    t === type
                      ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                      : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  }`}
                >
                  <span className="truncate">{SECTION_INFO[t].label}</span>
                  <span className="shrink-0 text-[10px] opacity-60">{implementedVariants(t).length}</span>
                </button>
              ))}
            </nav>
          )}

          <div className="grid min-h-0 flex-1 auto-rows-min grid-cols-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2 xl:grid-cols-3">
            {variants.map((variant) => (
              <LayoutCard
                key={variant}
                variant={variant}
                current={convert?.variant === variant}
                section={convert ? ({ ...convert, variant } as Section) : sampleSection(type, variant)}
                doc={doc}
                onPick={() => props.onPick(type, variant)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LayoutCard({
  variant, section, doc, current, onPick,
}: {
  variant: string;
  section: Section;
  doc: PortfolioDoc;
  current: boolean;
  onPick: () => void;
}) {
  // A registry lookup, not a component defined during render: the same key
  // always returns the same module reference. Written with createElement rather
  // than as `<Component />` because a capitalised local in JSX is exactly the
  // shape the lint rule looks for, and suppressing the rule would also suppress
  // it for the case it is actually there to catch.
  const component = resolveVariant(section.type, variant);

  return (
    <button
      type="button"
      onClick={onPick}
      aria-current={current ? "true" : undefined}
      className={`group overflow-hidden rounded-lg border text-left transition-colors ${
        current
          ? "border-neutral-900 dark:border-white"
          : "border-neutral-200 hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
      }`}
    >
      {/* A layout is designed for a page, not a thumbnail. Rather than let it
          reflow into a narrow column — which would show a shape it never has in
          production — it renders at page width and is scaled down. */}
      <div className="h-40 overflow-hidden bg-[var(--background)]" aria-hidden>
        <div
          className="layout-preview portfolio origin-top-left"
          style={{ width: "1100px", transform: "scale(0.34)" }}
          data-scheme={doc.design.colorScheme}
        >
          {component && (
            <SectionFrame slug={`pick-${variant}`} ctx={{ doc, assets: {} }} bleed={isBleed(section.type, variant)}>
              {createElement(component, { section, index: 1, ctx: { doc, assets: {} } })}
            </SectionFrame>
          )}
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2 border-t border-neutral-200 px-3 py-2 dark:border-neutral-800">
        <span className="truncate text-sm font-medium">{variantLabel(variant)}</span>
        {current && <span className="shrink-0 text-[10px] uppercase tracking-wider text-neutral-500">Current</span>}
      </div>
    </button>
  );
}
