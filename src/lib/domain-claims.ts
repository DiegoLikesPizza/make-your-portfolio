/**
 * How long adding a domain reserves it.
 *
 * A Domain row's hostname is unique, so an unverified row blocks everyone else
 * from connecting that name. Without an expiry, anyone could add a domain they
 * don't own and lock its real owner out for good. A week is long enough for DNS
 * to propagate and for someone to get round to creating the records.
 */
export const DOMAIN_CLAIM_TTL_DAYS = 7;

const DAY_MS = 86_400_000;

/** A claim nobody verified in time, which no longer reserves the hostname. */
export function isStaleClaim(domain: { verified: boolean; createdAt: Date }, now: Date = new Date()): boolean {
  if (domain.verified) return false;
  return now.getTime() - domain.createdAt.getTime() > DOMAIN_CLAIM_TTL_DAYS * DAY_MS;
}
