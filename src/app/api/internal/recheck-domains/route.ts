import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkPointsHere, serverAddresses } from "@/lib/dns";
import { afterScheduledCheck, recheckToken } from "@/lib/domain-recheck";
import { revalidateHost } from "@/lib/sites";

/**
 * Re-check every verified custom domain. Called once a day by the scheduler in
 * src/lib/domain-recheck.ts; a Route Handler because revalidateTag only works
 * inside one.
 *
 * It asks whether each name still reaches this server, not whether the
 * ownership TXT record is still there. Ownership was proven when the domain
 * verified, and requiring the record forever would take down every domain that
 * verified before the TXT check existed.
 */

function authorized(request: Request): boolean {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${recheckToken(secret)}`);
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function POST(request: Request) {
  // 404 rather than 401: to anyone without the token, this route isn't here.
  if (!authorized(request)) return new Response(null, { status: 404 });

  const serverIp = process.env.SERVER_IP;

  // If the server can't find its own address, every domain would fail. That is
  // this server's misconfiguration, not theirs, so nothing is marked.
  if ((await serverAddresses(serverIp)).length === 0) {
    return NextResponse.json({ skipped: "this server's own address is unknown — set SERVER_IP" });
  }

  const domains = await db.domain.findMany({ where: { verified: true } });
  const now = new Date();
  let unverified = 0;

  for (const domain of domains) {
    const result = await checkPointsHere(domain.hostname, serverIp);
    const update = afterScheduledCheck(domain, result.ok, now);
    await db.domain.update({ where: { id: domain.id }, data: update });

    if (!update.verified) {
      unverified += 1;
      // Stop serving the site on it now, not when the cached page next expires.
      await revalidateHost(domain.hostname);
    }
  }

  return NextResponse.json({ checked: domains.length, unverified });
}
