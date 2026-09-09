import Link from "next/link";
import type { Metadata } from "next";
import { PRESETS } from "@/presets";
import { portfolioDoc, type PortfolioDoc } from "@/lib/schema/portfolio";
import { everyVariantDoc } from "@/lib/fixtures/sweep";
import type { SectionType } from "@/lib/schema/sections";
import { tokensToCss } from "@/render/tokens";
import type { RenderCtx } from "@/render/context";
import {
  SECTION_INFO, SECTION_TYPES_IN_ORDER, TOTAL_VARIANTS, HERO_VARIANTS, NAV_VARIANTS, builtCount,
} from "@/lib/catalog";
import { Chip } from "@/components/browser/Chip";
import { HeroPreviews, NavPreviews, SectionPreviews } from "@/components/browser/Previews";

export const metadata: Metadata = {
  title: "Layouts",
  description: "Every section layout, navigation style and hero, rendered live in any preset.",
};

type View = "sections" | "hero" | "nav";
type Params = { type?: string; preset?: string; view?: string };

function href(p: Params) {
  const q = new URLSearchParams();
  if (p.view && p.view !== "sections") q.set("view", p.view);
  if (p.type) q.set("type", p.type);
  if (p.preset && p.preset !== "editorial") q.set("preset", p.preset);
  const s = q.toString();
  return s ? `/layouts?${s}` : "/layouts";
}

export default async function LayoutsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;

  const preset = PRESETS[sp.preset ?? ""] ? (sp.preset as string) : "editorial";
  const view: View = sp.view === "hero" || sp.view === "nav" ? sp.view : "sections";
  const type: SectionType = SECTION_TYPES_IN_ORDER.includes(sp.type as SectionType)
    ? (sp.type as SectionType)
    : "projects";

  const design = structuredClone(PRESETS[preset].design);
  const doc: PortfolioDoc = portfolioDoc.parse(everyVariantDoc(design, type));
  const ctx: RenderCtx = { doc, assets: {} };

  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
      {/* Tokens for the chosen preset, scoped so every preview below renders
          exactly as a published page would. */}
      <style dangerouslySetInnerHTML={{ __html: tokensToCss(design.tokens, ".portfolio") }} />

      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="font-semibold tracking-tight">Make Your Portfolio</Link>
          <Link
            href="/signin"
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
          >
            Start building
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">Layouts</h1>
        <p className="mt-3 max-w-[60ch] text-neutral-600 dark:text-neutral-400">
          {TOTAL_VARIANTS} section layouts, {HERO_VARIANTS.length} heroes and {NAV_VARIANTS.length} navigation
          styles, rendered live in whichever preset you pick. Every layout of a section shows the
          same content, so switching one never loses anything.
        </p>

        <nav className="mt-8 flex flex-wrap gap-2" aria-label="View">
          {(["sections", "hero", "nav"] as View[]).map((v) => (
            <Chip key={v} href={href({ view: v, type, preset })} active={view === v}>
              {v === "sections" ? "Sections" : v === "hero" ? "Heroes" : "Navigation"}
            </Chip>
          ))}
        </nav>

        <div className="mt-3 flex flex-wrap gap-2" aria-label="Preset">
          {Object.entries(PRESETS).map(([id, p]) => (
            <Chip key={id} href={href({ view, type, preset: id })} active={preset === id}>
              {p.label}
            </Chip>
          ))}
        </div>

        {view === "sections" && (
          <div className="mt-3 flex flex-wrap gap-2" aria-label="Section type">
            {SECTION_TYPES_IN_ORDER.map((t) => (
              <Chip
                key={t}
                href={href({ view, type: t, preset })}
                active={type === t}
                count={String(builtCount(t).built)}
              >
                {SECTION_INFO[t].label}
              </Chip>
            ))}
          </div>
        )}
      </div>

      <div className="mx-auto max-w-6xl space-y-8 px-6 pb-24">
        {view === "sections" && <SectionPreviews type={type} doc={doc} ctx={ctx} />}
        {view === "hero" && <HeroPreviews doc={doc} />}
        {view === "nav" && <NavPreviews doc={doc} />}
      </div>
    </div>
  );
}
