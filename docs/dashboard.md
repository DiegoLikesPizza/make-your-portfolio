# The dashboard

Everything except the editor shares one frame
([`Shell.tsx`](../src/components/dashboard/Shell.tsx)). The editor is
deliberately outside it: it owns the whole viewport and has its own header, and
a second bar would cost preview height for no gain.

`/dashboard` itself is a redirect — to the editor if you have a site, to
`/onboarding` if you don't.

## Account — `/dashboard/account`

- The address you sign in with, and why it can't be swapped in place: it *is*
  the account. Signing in with a different address creates a separate one.
- Sign-in methods, session count, join date.
- Display name (dashboard only — your portfolio's name is edited in the editor).
- **Delete account.** One cascading delete from the `User` row: sites, domains,
  assets, views and sessions all go with it, so there is no cleanup routine that
  can half-fail. Gated on typing your own email address.

## Analytics — `/dashboard/<siteId>/analytics`

Daily views for the last 30 days, the all-time total, and where the traffic came
from.

**Counted in the browser.** The public routes are cached — most requests never
reach application code — so a server-side counter would only ever see cache
misses. [`ViewBeacon`](../src/render/primitives/ViewBeacon.tsx) posts the site
id and the referring hostname to `/api/hit`, once per page load.

**Aggregated on write.** One `SiteView` row per site per day per referrer, and
nothing per visitor: no cookie, no IP, no user agent, no fingerprint. There is
nothing to leak, nothing to ask consent for and nothing to prune — and no
"unique visitors" number, which is the honest cost of that.

`/api/hit` is unauthenticated by necessity (the visitor is a stranger) but
checks that the request came from a page that is actually this site: the app
domain, or one of the site's own verified hostnames. That is not proof — an
`Origin` header can be forged outside a browser — and this is a vanity number
rather than billing, so the trade is stated rather than over-engineered. Views
of an unpublished site are never counted.

The chart is one bar per day, including days with none: charting only the days
that have data is how a fortnight of silence becomes a flat line through
nothing. Zero days render as a dim 2px baseline tick so they can still be
hovered.

## Settings — `/dashboard/<siteId>/settings`

Replaces the old standalone Domains page, which now permanently redirects here.
Domains were never a subject of their own — they are one answer to "where does
this site live", and splitting them out meant the handle, the publish state and
the custom hostname were each edited somewhere different.

- **Handle** — the `/u/<handle>` URL. Renaming drops both cache tags. There is
  deliberately **no redirect from the old handle**: a freed name has to be
  claimable by someone else, and a permanent redirect from a name that now
  belongs to a different person is worse than a 404.
- **Published** — when it went live, and *Take offline*, which clears
  `publishedDoc` and leaves the draft alone. (A `published` boolean would leave
  a stale document in the row for a later bug to serve.)
- **Your own domain** — see [hosting.md](hosting.md).
- **Delete site** — cascades to domains, assets and views; the account stays.
  Gated on typing the handle.

## Write it for me — `/dashboard/<siteId>/assist`

Turns a paragraph — or a pasted CV, or three sentences — into the words on the
page.

Present only when `ANTHROPIC_API_KEY` is set. No key, no tab, and the route
404s, the same rule the sign-in providers follow.

**What it writes:** content only. `design` and `hero` are carried across
verbatim — the three layers are the user's, and "write my copy" is not a request
to restyle the page. It writes the **draft** and never publishes: what comes
back from a model is a first draft by definition, and the editor exists to fix
it.

**What it won't do:** invent employers, dates, clients, metrics or degrees. The
system prompt is explicit that a thin description should produce a short page
rather than a fabricated one.

**How it stays valid.** The model is asked for a *brief* — a small content-only
schema in [`src/lib/assist/brief.ts`](../src/lib/assist/brief.ts) — not a
`PortfolioDoc`. Ids, slugs, variants and tokens are not writing decisions, and
asking a model to invent them means every generation can fail validation for
reasons that have nothing to do with the words. `applyBrief` supplies the
machinery; the result then goes through `portfolioDoc.safeParse`, the same gate
Publish uses, before anything is written. Two independent checks, and a failure
at either one leaves the draft untouched.

Optional fields in the brief are `.nullable()` rather than `.optional()`:
structured outputs requires every property to be present, so "no value" has to
be expressible as a value.

`npm test` covers the half of this that needs no API key — that the brief schema
converts to a JSON schema structured outputs will accept, and that any valid
brief folds into a document that passes `portfolioDoc` with unique, anchor-safe
slugs and the design untouched.

> The live API call has not been exercised against a real key. If you are the
> first to set one, watch that first generation.
