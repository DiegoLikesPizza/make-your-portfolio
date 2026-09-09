import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { randomBytes } from "node:crypto";
import { diegoDoc } from "../src/lib/fixtures/diego";

/**
 * End-to-end smoke test of the editor loop against a running dev server.
 *
 *   npm run dev            (port 3100)
 *   npm run smoke
 *
 * Restores the demo document afterwards so it can be run repeatedly.
 *
 * Authentication is real now, so this mints a database session for the demo
 * site's owner and sends its cookie — rather than relying on a dev bypass,
 * which would mean the smoke test exercised a path production never takes.
 */

const base = "http://localhost:3100";
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const log = (n: string, ok: boolean, extra = "") => console.log(`${ok ? "PASS " : "FAIL "}${n}${extra ? "  — " + extra : ""}`);

/** Auth.js reads this cookie name when not on HTTPS. */
const SESSION_COOKIE = "authjs.session-token";

async function main() {
  const site = await db.site.findUniqueOrThrow({ where: { subdomain: "demo" } });

  const sessionToken = randomBytes(32).toString("hex");
  await db.session.create({
    data: {
      sessionToken,
      userId: site.userId,
      expires: new Date(Date.now() + 60 * 60 * 1000),
    },
  });
  const cookie = `${SESSION_COOKIE}=${sessionToken}`;
  const doc = structuredClone(site.draftDoc) as Record<string, unknown>;
  const profile = doc.profile as Record<string, unknown>;
  profile.headline = "Edited by the ==round-trip== test.";
  // Also flip a design token, to prove the Design tab persists too.
  const design = doc.design as Record<string, Record<string, unknown>>;
  design.tokens.radius = "sharp";
  design.nav.variant = "dot-rail";

  const save = (baseUpdatedAt: string) =>
    fetch(`${base}/api/sites/${site.id}/draft`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({ doc, baseUpdatedAt }),
    });

  const stale = site.updatedAt.toISOString();
  let res = await save(stale);
  log("autosave accepts a valid document", res.status === 200, `status ${res.status}`);
  const fresh = ((await res.json()) as { updatedAt: string }).updatedAt;

  // Replaying the now-stale timestamp is exactly the second-tab case.
  res = await save(stale);
  log("autosave detects a conflicting write", res.status === 409, `status ${res.status}`);

  res = await save(fresh);
  log("autosave accepts the refreshed timestamp", res.status === 200, `status ${res.status}`);

  // The edit must not be public until Publish is pressed.
  let html = await (await fetch(`${base}/u/demo`)).text();
  log("draft edit is NOT public before publish", !html.includes("round-trip"));

  await fetch(`${base}/api/sites/${site.id}/publish`, { method: "POST", headers: { cookie } });
  html = await (await fetch(`${base}/u/demo`)).text();
  log("edit is public after publish", html.includes("round-trip"));
  log("accent markup rendered, not literal", !html.includes("==round-trip=="));
  log("design token change applied", html.includes("--radius: 0px"));
  log("nav variant change applied", html.includes("Sections"));

  // Leave the demo site as the reference document, published.
  await db.site.update({
    where: { id: site.id },
    data: { draftDoc: diegoDoc as unknown as object },
  });
  await fetch(`${base}/api/sites/${site.id}/publish`, { method: "POST", headers: { cookie } });
  html = await (await fetch(`${base}/u/demo`)).text();
  log("demo restored to the reference document", html.includes("I build fast"));

  // An unauthenticated caller must not be able to touch someone else's site.
  const anon = await fetch(`${base}/api/sites/${site.id}/publish`, { method: "POST" });
  log("publish rejects a request with no session", anon.status === 404, `status ${anon.status}`);

  const anonSave = await fetch(`${base}/api/sites/${site.id}/draft`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ doc, baseUpdatedAt: new Date().toISOString() }),
  });
  log("autosave rejects a request with no session", anonSave.status === 404, `status ${anonSave.status}`);

  await db.session.delete({ where: { sessionToken } });
}

main().finally(() => db.$disconnect());
