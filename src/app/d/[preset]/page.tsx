import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Portfolio } from "@/render/Portfolio";
import { DEMO_HANDLES, demoDoc } from "@/lib/fixtures/demo";
import { resolveDynamic } from "@/lib/dynamic";
import { portfolioMetadata } from "@/lib/portfolio-metadata";

/**
 * The public demo portfolios, one per preset.
 *
 * Rendered straight from the fixture rather than from a seeded site row. The
 * demos used to live at `/u/<preset>`, which meant six handles had to be
 * reserved so a user could not claim the page the marketing site links to —
 * and a fresh install showed no demos at all until `seed:demos` had been run.
 * Their own path namespace costs neither: nothing to seed, nothing to reserve.
 */

type Props = { params: Promise<{ preset: string }> };

// Not prerendered: every page renders per request so its scripts carry the
// response's CSP nonce (see the root layout). That also means a dynamic value
// in a demo is as of this request, not of the last build.
function docFor(preset: string) {
  return DEMO_HANDLES.includes(preset) ? resolveDynamic(demoDoc(preset)) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { preset } = await params;
  const doc = docFor(preset);
  // The fixture sets `noindex`: six pages of near-identical copy are thin
  // duplicate content, and /layouts is the surface meant to be indexed.
  return doc ? portfolioMetadata(doc) : {};
}

export default async function DemoPage({ params }: Props) {
  const { preset } = await params;
  const doc = docFor(preset);
  if (!doc) notFound();

  // No `analyticsSiteId`: a demo has no site row, and traffic to the marketing
  // surface is not somebody's portfolio traffic.
  return <Portfolio ctx={{ doc, assets: {} }} />;
}
