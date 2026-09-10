# Architecture

## The three layers

A theme is not a monolith here. It is split into three things the user controls
independently, and a "preset" is just a tested bundle of all three.

| Layer | What it decides | Where it lives |
|---|---|---|
| **Shell** | nav variant and side, container width, dividers, footer, page background | `design.nav`, `design.footer`, `design.background` |
| **Sections** | an ordered list; each picks one layout of its type | `sections[]` |
| **Tokens** | radius, borders, shadow, density, fonts, type scale, palette, motion | `design.tokens` |

The point of the split is that "editorial look, floating side rail, brutalist
corners" is a combination the user can actually reach. Loading a preset seeds
all three; nothing afterwards tracks which parts were changed, because nothing
needs to.

Tokens become a scoped stylesheet — [`src/render/tokens.ts`](../src/render/tokens.ts)
emits CSS custom properties under a `.portfolio` selector rather than inline
styles, so `:hover`, media queries and the dark-scheme block all work.

## One document

```
PortfolioDoc
├─ version        literal 1
├─ meta           title, description, noindex
├─ design         preset name, tokens, nav, background, colorScheme, footer
├─ profile        name, initials, eyebrow, headline, bio, location, ctas, links
├─ hero           variant (+ optional background)
└─ sections[]     id, slug, title, hidden, variant, options, data
```

Defined once in [`src/lib/schema/portfolio.ts`](../src/lib/schema/portfolio.ts)
and [`sections.ts`](../src/lib/schema/sections.ts). Forms, the live preview, the
public renderer and API validation all derive from it.

**`migrate(raw)` is the migration system.** Documents are JSON blobs, so the
shape evolves in that function rather than in a database migration. It runs on
every read, which is why a new field with a zod `.default()` *is* a migration —
`nav.side` and `nav.mobileBehavior` were added exactly that way, and documents
written before they existed parse and render unchanged.

The database ([`prisma/schema.prisma`](../prisma/schema.prisma)) holds identity,
ownership and addressing, and nothing about how a page looks:

- `User`, `Account`, `Session`, `VerificationToken` — Auth.js, database sessions
  so they are revocable.
- `Site` — `subdomain` (the handle), `draftDoc`, `publishedDoc`, `publishedAt`.
- `Domain` — a custom hostname, its `verified` flag and verification token.
- `Asset` — uploads. Modelled, not yet written to.
- `SiteView` — one row per site per day per referrer. See [dashboard.md](dashboard.md).

## How a request becomes a page

```
                    ┌─ Host is the app domain, localhost or an IP
Request ─ proxy.ts ─┤
                    └─ anything else → rewrite to /site/[host]
```

[`src/proxy.ts`](../src/proxy.ts) (Next 16's renamed middleware) reads the
`Host` header and hands it to `resolveHost` in
[`src/lib/hosts.ts`](../src/lib/hosts.ts), the one place that answers "is this
the dashboard or somebody's portfolio". Sites are one-pagers, so there is no
per-site routing to do: every site host rewrites to a single route which
re-resolves the host with the same function.

Three public surfaces, two of them the same page:

| URL | Route | Notes |
|---|---|---|
| `example.com/u/<handle>` | `app/u/[subdomain]` | Always available from first publish |
| `diego.dev` | `app/site/[host]` | Verified custom domain |
| `<handle>.example.com` | `app/site/[host]` | Off unless `NEXT_PUBLIC_SITES_ON_SUBDOMAINS=true`; needs a wildcard certificate |

The proxy's `matcher` excludes `/api/`, `/_next/` and anything that looks like a
file. `/api/caddy/authorize` is excluded deliberately — Caddy calls it with the
customer's domain as a *query parameter*, not as the `Host`.

> The escaping in that matcher is load-bearing. Written `"\."`, JavaScript drops
> the backslash and the regex reads `.*..*`, which rejects every path of two or
> more characters — the proxy then only ever runs on `/`, and a customer's
> domain serves the dashboard everywhere else. `npm test` checks the literal.

## Caching, and the rule that follows from it

Published documents are read through `unstable_cache` in
[`src/lib/sites.ts`](../src/lib/sites.ts), tagged `site:handle:<handle>` and
`site:host:<hostname>`.

**The cache stores misses as well as hits.** A lookup for a host that is not yet
verified caches `null`, and nothing expires it on its own. So:

> Every write that changes what a hostname or handle resolves to must drop that
> tag.

`revalidateSite(handle, hostnames)` and `revalidateHost(hostname)` exist for
this, and are called from publish, from adding / verifying / removing a domain,
from renaming a handle (both the old and the new name) and from taking a site
offline. Miss this and the symptom is a domain that goes green in the dashboard
and keeps 404ing forever — which is exactly what issue #6 was.

Writing to the database from outside the app — a seed script, `psql`, a
migration — cannot revalidate anything. If a page 404s in development after a
manual row edit, that is why; publish once from the editor and it clears.

## Ownership

Every read or write of a site goes through `requireSiteOwner` in
[`src/lib/auth.ts`](../src/lib/auth.ts) — the one place that answers "is this
yours?". It returns `null` rather than throwing, so callers render a 404 and
never confirm that an id exists. Looking a site up by id alone is how one user
ends up editing another's portfolio; there is no such call in the codebase and
there shouldn't be.
