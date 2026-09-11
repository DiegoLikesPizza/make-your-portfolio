/**
 * The Content-Security-Policy, built per request around a fresh nonce.
 *
 * Portfolios at /u/<handle> share an origin with the dashboard, so script that
 * gets injected into one — through a renderer bug, a new variant, a dependency —
 * would run with the visitor's dashboard session. The policy is what makes such
 * a bug inert: script runs only if it came from this origin with a nonce that
 * was minted for this response, or was loaded by script that did
 * (`'strict-dynamic'`, which is how Next's chunks load each other).
 *
 * Next reads the nonce back out of the request's policy header and stamps it on
 * every script it renders. A nonce only exists at request time, so every page
 * renders per request — see the root layout.
 */
export function contentSecurityPolicy(nonce: string, dev: boolean): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // React's development build evaluates source maps for error overlays.
    "script-src": ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", ...(dev ? ["'unsafe-eval'"] : [])],
    // Inline styles stay allowed: React style attributes, the per-portfolio
    // token <style> and motion all depend on them, and a style can't run script.
    "style-src": ["'self'", "'unsafe-inline'"],
    // Portfolio media is served from /assets on this origin.
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'"],
    "connect-src": ["'self'"],
    "media-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    // 'self' rather than 'none': the editor previews the page in a same-origin iframe.
    "frame-ancestors": ["'self'"],
  };

  // No form-action: signing in with GitHub or Google submits to us and is
  // redirected to the provider, and browsers apply form-action to that redirect.
  return Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(" ")}`)
    .join("; ");
}
