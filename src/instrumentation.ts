/**
 * Startup checks. `register` runs once when the server starts, before it
 * accepts a request — and never during `next build`, so a build machine
 * doesn't need production secrets.
 */
export function register() {
  // Auth.js builds sign-in links from AUTH_URL when it is set, and otherwise
  // from the request's Host / X-Forwarded-Host (`trustHost: true`). Those are
  // client-controlled: anyone could request a link for someone else's address
  // with `Host: evil.example`, and the genuine email we send would carry that
  // person's sign-in token to the attacker. Development keeps the Host-based
  // behaviour, which is what lets the app be reached over the LAN.
  if (process.env.NODE_ENV === "production" && !process.env.AUTH_URL) {
    throw new Error(
      "AUTH_URL must be set in production. Without it, sign-in links are built from the request's Host header.",
    );
  }
}
