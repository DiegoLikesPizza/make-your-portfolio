import { DEMO_HANDLES, demoDoc } from "@/lib/fixtures/demo";
import { resolveDynamic } from "@/lib/dynamic";
import { shareCard } from "@/lib/share-card";

/** The share card for a demo portfolio — the same card a real one gets. */
export async function GET(_request: Request, { params }: { params: Promise<{ preset: string }> }) {
  const { preset } = await params;
  if (!DEMO_HANDLES.includes(preset)) return new Response(null, { status: 404 });
  return shareCard(resolveDynamic(demoDoc(preset)));
}
