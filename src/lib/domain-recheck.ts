import { createHmac } from "node:crypto";

/**
 * The daily re-check of verified custom domains.
 *
 * Verification used to happen once and hold forever: a domain whose DNS later
 * moved away stayed verified, kept passing the certificate gate and kept being
 * served. Now every verified domain is asked once a day whether it still
 * reaches this server.
 *
 * One failed lookup isn't proof. DNS has bad minutes, and taking a working site
 * offline over one of them is worse than a day's delay, so a domain is only
 * unverified after failing on consecutive runs.
 */

/** Consecutive failed daily checks before a verified domain is unverified. */
export const FAILED_CHECKS_BEFORE_UNVERIFY = 2;

const RECHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;
const FIRST_RUN_DELAY_MS = 60 * 1000;

type CheckedDomain = { failedChecks: number; verifiedAt: Date | null };

/** The row update after one scheduled check of a verified domain. */
export function afterScheduledCheck(domain: CheckedDomain, ok: boolean, now: Date) {
  if (ok) {
    // Domains verified before `verifiedAt` existed get it on their first pass.
    return { verified: true, failedChecks: 0, lastCheckedAt: now, verifiedAt: domain.verifiedAt ?? now };
  }
  const failedChecks = domain.failedChecks + 1;
  return {
    verified: failedChecks < FAILED_CHECKS_BEFORE_UNVERIFY,
    failedChecks,
    lastCheckedAt: now,
    verifiedAt: domain.verifiedAt,
  };
}

/**
 * The bearer token the scheduler presents to the re-check route.
 *
 * The route sits under /api like everything else, so the public proxy reaches
 * it and it needs a credential. Deriving one from AUTH_SECRET means there is no
 * second secret to configure, and the fixed label keeps the token useless for
 * anything else that secret signs.
 */
export function recheckToken(secret: string): string {
  return createHmac("sha256", secret).update("domain-recheck").digest("base64url");
}

/**
 * Start the re-check in this process: a minute after boot, then every 24 hours.
 *
 * The work itself happens in POST /api/internal/recheck-domains, called over
 * loopback, because dropping a hostname's cache tag only works inside a Route
 * Handler. Per process, like the rate limiter — right for the single pm2
 * process; with several, each would re-check, which is wasteful but harmless.
 */
export function scheduleDomainRecheck() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return;

  const url = `http://127.0.0.1:${process.env.PORT ?? 3000}/api/internal/recheck-domains`;
  const run = () =>
    fetch(url, { method: "POST", headers: { authorization: `Bearer ${recheckToken(secret)}` } })
      .then(async (response) => console.log(`[domain-recheck] ${response.status} ${await response.text()}`))
      .catch((error: Error) => console.error(`[domain-recheck] ${error.message}`));

  setTimeout(run, FIRST_RUN_DELAY_MS).unref();
  setInterval(run, RECHECK_INTERVAL_MS).unref();
}
