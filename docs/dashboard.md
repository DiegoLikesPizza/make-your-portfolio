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

What a forged request *can* do is bounded
([`src/lib/rate-limit.ts`](../src/lib/rate-limit.ts),
[`src/lib/analytics.ts`](../src/lib/analytics.ts)):

- **30 views a minute per client per site.** Enough for any real visitor, not
  enough for a loop to move the number meaningfully.
- **A source must look like a hostname**, or it is recorded as a direct visit.
- **At most 50 distinct sources per site per day.** Every source is its own
  row, so without a cap made-up referrers would grow the table without bound;
  past the cap they are counted under `other`.

The chart is one bar per day, including days with none: charting only the days
that have data is how a fortnight of silence becomes a flat line through
nothing. Zero days render as a dim 2px baseline tick so they can still be
hovered.

## Messages — `/dashboard/<siteId>/messages`

What visitors send through the *split with form* contact layout, newest first,
with *Mark as read*, *Delete* and the visitor's address to reply to.

On the published page the form posts to `/api/contact`
([route](../src/app/api/contact/route.ts)). The message is stored first, then
emailed to the owner when `EMAIL_SERVER_HOST` is set, with Reply-To set to the
visitor — so a mail server that is down never loses one. In the editor preview,
the demos and exports there is no site to deliver to, and the form falls back to
opening the visitor's mail app.

The endpoint is unauthenticated, and guarded like `/api/hit`:

- **Published sites only**, and only from one of the site's own pages (the same
  origin check, [`src/lib/site-origin.ts`](../src/lib/site-origin.ts)).
- **Length limits**: name 100, email 254, message 5,000 characters
  ([`src/lib/contact.ts`](../src/lib/contact.ts)). Names can't contain control
  characters and addresses can't contain `?`, `&`, commas or quotes, so neither
  can inject mail headers or extra recipients.
- **A honeypot field** visitors never see. A request that fills it in gets a
  success response and is dropped.
- **5 messages an hour per visitor per site, and 50 a day per site.** Like every
  limit here these are per process.

## Settings — `/dashboard/<siteId>/settings`

Replaces the old standalone Domains page, which now permanently redirects here.
Domains were never a subject of their own — they are one answer to "where does
this site live", and splitting them out meant the handle, the publish state and
the custom hostname were each edited somewhere different.

- **Handle** — the `/u/<handle>` URL. Renaming drops both cache tags. There is
  deliberately **no redirect from the old handle**: a freed name has to be
  claimable by someone else, and a permanent redirect from a name that now
  belongs to a different person is worse than a 404.

  A released handle — by renaming, deleting the site or deleting the account —
  stays **reserved for 30 days** for whoever released it
  ([`src/lib/handles.ts`](../src/lib/handles.ts)). Otherwise a stranger could
  publish at an address that is still printed on its previous owner's CV.
  The person who released it can take it back at any time; everyone else is
  told it is taken until the 30 days are up. The reservation isn't tied to the
  account, so it survives account deletion.
- **Published** — when it went live, and *Take offline*, which clears
  `publishedDoc` and leaves the draft alone. (A `published` boolean would leave
  a stale document in the row for a later bug to serve.)
- **Published versions** — every publish is kept as a version, newest 20 per
  site. *Open in editor* replaces the draft with an old version (asking first,
  because it overwrites unsaved work) and leaves the live page alone; *Publish
  this version* puts it live again and is itself recorded as a new version, so
  going back can be undone too. Both the editor's Publish and republishing go
  through `publishDocument` in `src/lib/sites.ts`, the one definition of
  publishing.
- **Preview link** — a private `/p/<token>` link that shows the **draft** to
  whoever has it, for asking someone's opinion before publishing. The token is
  32 random bytes and is the only access control, so the page is never indexed
  and never counted in analytics. *New link* replaces it (the old one stops
  working) and *Revoke* turns it off.
- **Download as HTML** — the published page as one self-contained file:
  styles, fonts, images and videos are embedded as data URIs, so it opens
  offline and can be hosted anywhere. `GET /api/sites/<siteId>/export` fetches
  the owner-only `/export/<siteId>` page from the app itself, forwarding the
  owner's cookie, and inlines everything it references
  ([`src/lib/export.ts`](../src/lib/export.ts)). The page renders with motion
  off (content would otherwise wait for JavaScript to fade in), no theme toggle,
  and a mobile nav that wraps instead of needing a menu button, because every
  script is removed. The contact form falls back to a plain `mailto:` form.
  Limited to 100 MB of embedded files.
- **Your own domain** — see [hosting.md](hosting.md).
- **Delete site** — cascades to domains, assets, views and messages; the account stays.
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

**Limited to 10 generations a day per user.** Each one is a large model call
billed to the server's key, and anyone can sign up. A description rejected for
being too short or too long doesn't count against it.

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
