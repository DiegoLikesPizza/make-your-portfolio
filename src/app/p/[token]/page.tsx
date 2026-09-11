import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { assetMap } from "@/lib/assets";
import { migrate } from "@/lib/schema/portfolio";
import { resolveDynamic } from "@/lib/dynamic";
import { isPreviewToken } from "@/lib/preview-links";
import { Portfolio } from "@/render/Portfolio";

/**
 * A draft, shown to whoever has the link.
 *
 * For asking someone what they think before publishing. It reads the draft on
 * every request rather than through the published-site cache, so it shows the
 * page as it is now; it is never indexed and never counted in analytics, and a
 * revoked or replaced token is a 404.
 */

type Props = { params: Promise<{ token: string }> };

export const metadata: Metadata = {
  title: "Draft preview",
  robots: { index: false, follow: false },
};

async function draftFor(token: string) {
  if (!isPreviewToken(token)) return null;
  const site = await db.site.findUnique({
    where: { previewToken: token },
    select: { draftDoc: true, assets: true },
  });
  return site ? { doc: resolveDynamic(migrate(site.draftDoc)), assets: assetMap(site.assets) } : null;
}

export default async function DraftPreviewPage({ params }: Props) {
  const { token } = await params;
  const draft = await draftFor(token);
  if (!draft) notFound();

  return (
    <>
      <p className="fixed bottom-4 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-neutral-900/90 px-4 py-1.5 text-xs font-medium text-white shadow-lg">
        Draft preview — not published
      </p>
      <Portfolio ctx={draft} />
    </>
  );
}
