# Make Your Portfolio

A hosted builder for **one-page portfolios**. Sign in, fill out a guided form, watch the page
render live beside it, publish to `example.com/u/name` or your own domain.

**Documentation is in [`docs/`](docs/)** — start with
[docs/architecture.md](docs/architecture.md). The full plan lives at
`~/.claude/plans/i-want-you-to-jazzy-garden.md`.

## The idea in one paragraph

A theme is not a monolith here. It is split into three layers the user controls independently:

- **Shell** — nav variant, container width, dividers, footer, background
- **Sections** — an ordered list, each picking one of many layout variants
- **Tokens** — radius, borders, shadow, density, fonts, palette, motion

A "theme" is then just a **preset**: a tested bundle of the three that you load and then change
anything in. `editorial` is the design system of `lfdiego.xyz`, ported as the reference target.

The rule that makes the catalog growable: **every variant of a section type consumes the same
data**, so switching Projects from `numbered-list` to `grid-3` to `table` never loses content.

## Status

| Step | State |
|---|---|
| 1. Skeleton (Next 16, Prisma, Caddy) | done |
| 2. Auth (GitHub / Google / magic link) | **done** — magic links work with no SMTP in dev |
| 3. Schema + render core | done — `/u/demo` renders the reference content |
| 4. Editor | **done** — content, design, autosave, publish |
| 5. Variant catalog | **done** — 52/52 section variants, 8 nav, 8 hero |
| 6. Presets | **done** — 6 |
| 7. Uploads | **not started** — the only unbuilt piece. `Asset` is modelled; nothing writes it |
| 8. Custom domains | **done** — add, verify, on-demand TLS gate |
| 9. Dashboard | **done** — account, analytics, settings; domains folded into settings |
| 10. Write it for me | **done, unexercised** — needs `ANTHROPIC_API_KEY`; the live call has never run |

### Signing in

Magic links work with **no mail server**: leave `EMAIL_SERVER_HOST` empty and the sign-in link is
printed to the dev server console. Set it before deploying — in production a missing mail server is
a hard error rather than a link in a log file.

GitHub and Google buttons appear on `/signin` only once their credentials are in `.env`. A provider
without credentials is omitted entirely rather than rendered and failing on click, so the button and
the capability can never disagree.

Sessions are database rows (revocable), and every site read or write goes through
`requireSiteOwner` in `src/lib/auth.ts` — the one place that answers "is this yours?".

## Running it

No Docker required. `prisma dev` runs a real local Postgres as a plain background process:

```bash
npm install
npm run db -- -d      # start local Postgres (detached); `npm run db ls` shows the URL
npx prisma migrate dev
npm run seed          # dev user + the demo site
PORT=3100 npm run dev
```

Port 3000 is often taken by another project, hence `PORT=3100` above.

Then open **http://localhost:3100** and sign up. `npm run seed` also creates a `demo` site you can
view at `/u/demo`.

```bash
npm test              # host routing, subdomain rules, the proxy matcher, the assist schema
npm run routes        # every public URL (needs a running server)
npm run smoke         # end-to-end: edit -> autosave -> conflict -> publish (needs a running server)
npm run sweep         # every section type under every preset
npm run coverage      # every planned variant has a component
npm run contrast      # marketing pages paint their own background in both schemes
```

- `/` — placeholder marketing page
- `/layouts` — the public catalog browser
- `/dashboard/<siteId>/edit` — the editor
- `/dashboard/<siteId>/analytics` · `/settings` · `/dashboard/account`
- `/u/demo` — the published portfolio, path-addressed
- `curl -H 'Host: demo.example.localhost' localhost:3100` — the same site, host-addressed

Reaching the dev server from a phone on the same network works — visit `http://<your-lan-ip>:3100`.
IP literals resolve to the app rather than being treated as a customer's custom domain.

Host routing lives in `src/proxy.ts`: `app.` and the bare domain are the dashboard, everything
else rewrites to `/site/[host]`.

### Deployed at make-your-portfolio.lfdiego.xyz

Running on the Hetzner box at `5.75.165.180`, which already hosts lfdiego.xyz, n8n and
newqolhub behind **nginx + certbot + pm2 + Postgres 16**. The deployment follows that existing
pattern rather than the Caddy setup originally planned — installing Caddy would have fought nginx
for ports 80/443 and could have taken three live sites down.

| | |
|---|---|
| App | `/srv/websites/make-your-portfolio.lfdiego.xyz/app` |
| Process | pm2 `make-your-portfolio`, `ecosystem.config.js`, bound to `127.0.0.1:3004` |
| Node | `/opt/node22` (v22.14) — the system Node 20 is too old for `nanoid@6` |
| Database | Postgres 16, database `portfolio`, role `portfolio` |
| Web | `/etc/nginx/sites-available/make-your-portfolio.lfdiego.xyz` |
| Assets | `/srv/websites/make-your-portfolio.lfdiego.xyz/data/assets` |

Redeploy:

```bash
cd /srv/websites/make-your-portfolio.lfdiego.xyz/app
export PATH=/opt/node22/bin:$PATH
npm install --no-audit && npx prisma migrate deploy && npm run build
cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/
pm2 restart make-your-portfolio
```

**Two production gotchas, both already handled — do not undo them:**

- `npm ci` fails on the server. The committed lockfile is generated on Windows and omits
  Linux-only optional packages (`@emnapi/*`), so `npm install` is used there instead.
- **The standalone server does not read the project `.env`.** It resolves env files relative to
  `server.js` (`.next/standalone/`), not the project root. pm2 therefore runs `start.sh`, which
  sources `.env` and execs the server. Without it Auth.js never sees `AUTH_URL`, falls back to the
  server's own bind address, and every magic link points at `https://localhost:3004`.
  `AUTH_URL` is mandatory in production for the same reason.

The `caddy/` directory and `deploy/*.service` are kept for a clean-server install, but are **not**
what runs in production.

### Custom domains

`/dashboard/<siteId>/settings` shows the exact DNS record to create, then verifies it with a real
lookup, and the app serves a verified custom domain correctly. (`/domains` permanently redirects
there.) Every change to a domain drops that hostname's cache tag — without it the cached 404 from
before verification never expired and the domain stayed dead after going green. See
[docs/hosting.md](docs/hosting.md).

**Not finished on the deployed box:** issuing the certificate. `/api/caddy/authorize` exists and is
correct, but nginx has no equivalent of Caddy's on-demand TLS — it cannot obtain a certificate for
a hostname it has never seen. The remaining work is a hook that runs `certbot --nginx -d <domain>`
when a domain is verified. Until then a customer domain resolves and verifies but has no HTTPS.
The endpoint is blocked at the nginx level (`deny all`) so it cannot be reached from outside.

## Layout

```
docs/                      architecture · editor · dashboard · hosting · development · extending
src/
  proxy.ts                 host-based routing
  components/editor/       the editor: section list, layout picker, forms, design panel, preview
  components/dashboard/    the frame around every non-editor page, and the views chart
  app/site/[host]/         the public renderer (one route serves every site)
  app/u/[subdomain]/       path-addressed alias
  app/dashboard/           editor · analytics · settings · account · assist
  app/actions/             server actions: domains, site, account, assist
  lib/schema/              portfolio.ts · sections.ts · tokens.ts · background.ts
  lib/assist/              "write it for me": the brief schema and the Claude call
  lib/variant-options.ts   which settings each layout has, and their defaults
  render/                  Portfolio · Nav · Background · tokens.ts (tokens -> CSS vars)
  variants/<type>/<id>.tsx the catalog, plus registry.ts
  presets/                 tested bundles of shell + tokens + nav
  lib/fixtures/diego.ts    lfdiego.xyz's content as a PortfolioDoc
```

## Notes

- `npm audit` reports 4 high advisories, all inside the **Prisma CLI** (dev-only); `mysql2` is
  unused with Postgres. No runtime dependency is affected.
- lucide 1.x dropped brand icons for trademark reasons, so GitHub/LinkedIn/X/Instagram/Dribbble
  marks are inlined in `src/render/primitives/LinkIcon.tsx`.
- Font pairings reference `next/font` CSS variables, never family names — next/font emits a hashed
  family, so naming a font directly silently falls back to system-ui.
