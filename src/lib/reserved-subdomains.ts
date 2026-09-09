/**
 * Subdomains a user may not claim.
 *
 * Two reasons: some address the product itself (`app`, `api`), and some would
 * let a site impersonate us or a service (`admin`, `billing`, `support`,
 * `mail`). Enforced server-side on claim — the UI check is a convenience, not
 * the control.
 */
const RESERVED = new Set([
  "www", "app", "api", "admin", "administrator", "root", "system", "internal",
  "mail", "email", "smtp", "imap", "pop", "webmail", "mx", "ns", "ns1", "ns2",
  "dns", "cdn", "static", "assets", "img", "images", "media", "files", "uploads",
  "blog", "docs", "help", "support", "status", "about", "legal", "privacy",
  "terms", "security", "abuse", "billing", "payments", "account", "accounts",
  "auth", "login", "signin", "signup", "register", "logout", "oauth", "sso",
  "dashboard", "settings", "profile", "user", "users", "me", "my", "new",
  "test", "testing", "dev", "staging", "preview", "sandbox", "beta",
  "portfolio", "site", "sites", "page", "pages", "host", "hosting",
]);

export type SubdomainError = "too-short" | "too-long" | "invalid" | "reserved";

export const SUBDOMAIN_MESSAGES: Record<SubdomainError, string> = {
  "too-short": "At least 3 characters.",
  "too-long": "At most 63 characters.",
  invalid: "Letters, numbers and hyphens only, and it can't start or end with a hyphen.",
  reserved: "That one is reserved. Try another.",
};

/** Returns null when the subdomain is acceptable, or the reason it isn't. */
export function validateSubdomain(raw: string): SubdomainError | null {
  const value = raw.trim().toLowerCase();

  if (value.length < 3) return "too-short";
  // 63 is the DNS label limit, so anything longer could never resolve.
  if (value.length > 63) return "too-long";
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(value)) return "invalid";
  if (RESERVED.has(value)) return "reserved";

  return null;
}

export function normalizeSubdomain(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/^-+|-+$/g, "");
}
