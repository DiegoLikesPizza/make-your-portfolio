import { notFound } from "next/navigation";
import { Portfolio } from "@/render/Portfolio";
import { PRESETS } from "@/presets";
import { portfolioDoc } from "@/lib/schema/portfolio";
import { everyVariantDoc } from "@/lib/fixtures/sweep";
import type { SectionType } from "@/lib/schema/sections";

/**
 * Development-only: every section variant on one page, under any preset.
 *
 *   /dev/sweep?type=projects&preset=brutalist&hero=terminal-prompt&nav=dot-rail
 *
 * This is the cheapest way to catch a layout that throws, overflows, or ignores
 * its tokens — rendering all 52 at once, in whatever combination.
 */
export default async function SweepPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; hero?: string; nav?: string; type?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const { preset = "editorial", hero, nav, type } = await searchParams;
  const design = structuredClone((PRESETS[preset] ?? PRESETS.editorial).design);
  if (nav) design.nav = { ...design.nav, variant: nav as typeof design.nav.variant };

  const raw = everyVariantDoc(design, type as SectionType | undefined);
  if (hero) raw.hero = { ...raw.hero, variant: hero as typeof raw.hero.variant };

  // Parsed rather than trusted: the sweep is also a check that the fixture
  // builder produces documents the schema actually accepts.
  const doc = portfolioDoc.parse(raw);

  return <Portfolio ctx={{ doc, assets: {} }} />;
}
