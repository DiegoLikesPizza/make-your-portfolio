import { cache } from "react";
import { db } from "@/lib/db";
import { diegoDoc } from "@/lib/fixtures/diego";
import type { PortfolioDoc } from "@/lib/schema/portfolio";

/**
 * `/u/demo` — the reference document, as a finished page.
 *
 * The seed puts a `demo` site holding this content into a development
 * database, but a deployment is never seeded, so on the live app the address
 * was a 404. Rendered from the fixture, it exists everywhere, the same way
 * `/d/<preset>` does.
 *
 * Only while no site holds the handle. `demo` is reserved so nobody can claim
 * it from now on, but a development database has the seeded row, and a handle
 * claimed before the reservation still belongs to whoever claimed it —
 * published or not.
 */

export const REFERENCE_HANDLE = "demo";

export const referenceDemoDoc = cache(async (handle: string): Promise<PortfolioDoc | null> => {
  if (handle !== REFERENCE_HANDLE) return null;

  const claimed = await db.site.findUnique({ where: { subdomain: handle }, select: { id: true } });
  if (claimed) return null;

  // `noindex`: the original is a live site of its own, and a copy here would
  // compete with it in search.
  return { ...diegoDoc, meta: { ...diegoDoc.meta, noindex: true } };
});
