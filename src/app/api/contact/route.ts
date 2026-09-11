import { db } from "@/lib/db";
import { MAX_CONTACT_REQUEST_CHARS, parseContact } from "@/lib/contact";
import { notifyOwner } from "@/lib/mail";
import { clientIp, LIMITS, rateLimit } from "@/lib/rate-limit";
import { requestHost, servesSite } from "@/lib/site-origin";

/**
 * A message from a visitor to a site's owner.
 *
 * Unauthenticated, like the view counter, and checked the same way: the site
 * must be published and the request must come from one of its pages. On top:
 *
 * - **Length limits** on every field (src/lib/contact.ts), and on the request.
 * - **A honeypot.** A field real visitors never see; a request that fills it in
 *   is answered as a success and dropped, so a bot learns nothing.
 * - **Rate limits** per visitor per site, and per site overall, so neither one
 *   client nor many can fill an inbox or the table.
 *
 * The message is stored before anyone is emailed: a mail server that is down
 * must not lose it, and the dashboard is where messages are delivered either way.
 */

const reply = (body: { ok: true } | { error: string }, status: number) => Response.json(body, { status });

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > MAX_CONTACT_REQUEST_CHARS) return reply({ error: "That message is too long." }, 413);

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return reply({ error: "That didn't look like a message." }, 400);
  }

  const parsed = parseContact(payload);
  if (!parsed.ok) return reply({ error: parsed.error }, 400);
  const { siteId, name, email, message } = parsed.data;

  const site = await db.site.findUnique({
    where: { id: siteId },
    select: { id: true, subdomain: true, publishedAt: true, user: { select: { email: true } } },
  });
  if (!site?.publishedAt || !(await servesSite(requestHost(request), site.id, site.subdomain))) {
    return reply({ error: "This form can't send messages." }, 403);
  }

  const allowed =
    rateLimit(`contact:ip:${site.id}:${clientIp(request.headers)}`, LIMITS.contactPerIp).ok &&
    rateLimit(`contact:site:${site.id}`, LIMITS.contactPerSite).ok;
  if (!allowed) return reply({ error: "Too many messages. Please try again later." }, 429);

  if (parsed.spam) return reply({ ok: true }, 200);

  await db.contactMessage.create({ data: { siteId: site.id, name, email, body: message } });

  try {
    await notifyOwner({ to: site.user.email, siteId: site.id, handle: site.subdomain, name, email, message });
  } catch (error) {
    // Already saved; the owner still sees it in the dashboard.
    console.error("Contact notification failed:", error instanceof Error ? error.message : error);
  }

  return reply({ ok: true }, 201);
}
