/**
 * Who may open /admin.
 *
 * An allowlist in `ADMIN_EMAILS` rather than a role column: no row to flip, no
 * screen that grants it, no migration. Becoming an admin means editing the
 * server's environment, which already holds every secret the app has. Unset,
 * nobody is one and /admin is a 404 for everybody.
 *
 * The address also has to be *proven*. `emailVerified` is only ever set by
 * signing in with an email link, and that matters because Auth.js's GitHub
 * provider takes an account's primary address without checking that GitHub
 * verified it. Matching the address alone would let someone sign up through
 * GitHub claiming the admin's address — before the admin had an account of
 * their own — and walk straight in.
 */

/** The addresses in `ADMIN_EMAILS`, lowercased. Commas or whitespace separate them. */
export function adminEmails(raw: string | undefined = process.env.ADMIN_EMAILS): Set<string> {
  return new Set(
    (raw ?? "")
      .split(/[\s,]+/)
      .map((email) => email.toLowerCase())
      .filter(Boolean),
  );
}

/** Whether an address is on the list — not yet whether its account proved it. */
export function isAdminEmail(email: string | null | undefined, raw?: string): boolean {
  if (!email) return false;
  return adminEmails(raw).has(email.trim().toLowerCase());
}

/** On the list, and the account has signed in with an email link to that address. */
export function isAdmin(user: { email: string; emailVerified: Date | null }, raw?: string): boolean {
  return user.emailVerified !== null && isAdminEmail(user.email, raw);
}
