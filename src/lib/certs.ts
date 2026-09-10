import "server-only";

import { execFile } from "node:child_process";

/**
 * Asking the box to issue a certificate for a freshly verified domain.
 *
 * Present only when CERT_ISSUE_COMMAND points at a script — the same rule the
 * sign-in providers and "write it for me" follow. On a Caddy deployment this
 * stays unset, because Caddy issues on demand through /api/caddy/authorize and
 * needs nothing from us.
 *
 * Fire-and-forget on purpose. Issuance talks to Let's Encrypt and reloads
 * nginx; that is many seconds of work that must not sit inside the request the
 * user is waiting on, and if it fails the domain is still verified and the page
 * still says HTTPS is coming. The script is idempotent, so the retry is simply
 * pressing Re-check.
 */

export const CERT_ISSUE_COMMAND = process.env.CERT_ISSUE_COMMAND;

/** The same shape the script enforces. Neither side trusts the other. */
const HOSTNAME = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/;

export function issueCertificate(hostname: string): void {
  if (!CERT_ISSUE_COMMAND) return;

  // execFile with an argument array, never a shell string: this value started
  // life as user input, and the one thing that must never happen is it being
  // parsed as a command.
  if (!HOSTNAME.test(hostname)) return;

  const child = execFile(
    CERT_ISSUE_COMMAND,
    [hostname],
    { timeout: 180_000 },
    (error, stdout, stderr) => {
      if (error) console.error(`[certs] ${hostname}: ${error.message}\n${stderr || stdout}`);
      else console.log(`[certs] ${hostname}: ${stdout.trim()}`);
    },
  );

  // Don't hold the event loop open for it, and don't let a slow ACME round trip
  // keep a serverless-style process alive.
  child.unref();
}
