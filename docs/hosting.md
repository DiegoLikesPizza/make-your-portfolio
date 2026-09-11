# Hosting, handles and custom domains

## The three ways to reach a site

| | Availability |
|---|---|
| `example.com/u/<handle>` | Always, from the first publish. Never breaks, needs no DNS. |
| `diego.dev` | Once the customer's DNS points here and the domain verifies. |
| `<handle>.example.com` | Off by default. Needs a wildcard certificate, which needs a DNS-01 challenge and a registrar API token — real setup cost for something the product doesn't currently promise. The code path is kept behind `NEXT_PUBLIC_SITES_ON_SUBDOMAINS`. |

`resolveHost` in [`src/lib/hosts.ts`](../src/lib/hosts.ts) is the only function
that decides which of these a request is. A bare IP address, `localhost` and
anything under `.localhost` always resolve to the app — nobody points an A
record at a literal, and it is how the dev server gets reached over the LAN.

## Connecting a customer's domain

1. **Add it** on Settings. The records to create are shown in the shape a
   registrar's panel asks for, because "point your domain at us" is where people
   get stuck.

   | Record | Why |
   |---|---|
   | `TXT` `_portfolio-verify` → `portfolio-verify=<token>` | Proves the person adding the domain controls it |
   | `A` → `SERVER_IP` (or `CNAME` → the app domain) | Sends the traffic here |

   Adding a domain reserves the name for **7 days**. A claim nobody verifies in
   that time stops blocking others, so a domain can't be squatted by adding it
   and walking away.

2. **Verify.** A real DNS lookup, not a trust-the-user checkbox — verification is
   what gates certificate issuance. It needs **both** records: every customer's
   domain resolves to the same address, so an address check alone proves the
   name points at the platform, not that it belongs to this account. Without
   the TXT token, a domain that still pointed here after its owner removed it
   could be claimed by anyone. A CNAME flattened by the provider (Cloudflare
   does this) resolves to our address instead, which is equally valid and
   accepted.

   When `SERVER_IP` is unset the check falls back to resolving `APP_DOMAIN`:
   whatever that points at is by definition where visitors reach us. Without
   that fallback an apex domain could never verify on a deployment that hadn't
   set the variable.

3. **HTTPS** is issued on the first visit. Nothing to do — on a Caddy install.

> **The deployed box does not run Caddy.** It sits behind the nginx + certbot
> stack that already serves three other sites, so a customer domain resolves and
> verifies there but has no certificate: nginx has no equivalent of on-demand
> TLS. The remaining work is a hook that runs `certbot --nginx -d <domain>` when
> a domain verifies. The root [README](../README.md#custom-domains) has the
> details; `caddy/` is kept for a clean-server install.

**Cloudflare users:** set the record to *DNS only* (grey cloud). A proxied
record means Cloudflare terminates TLS itself and the certificate can never be
issued.

## TLS and the `ask` endpoint

This is the clean-server design; see the note above for what the current
deployment actually does.

[`caddy/Caddyfile`](../caddy/Caddyfile) is stock Caddy — no plugin build. The
app domain is a single hostname, so a normal HTTP-01 challenge covers it.
Customers' domains use **on-demand TLS**, which issues a certificate for a
hostname Caddy has never seen.

That is also how you get your ACME rate limit burned if anyone can point DNS at
the server, so every issuance is gated on
[`/api/caddy/authorize`](../src/app/api/caddy/authorize/route.ts), which answers
200 only for hostnames that exist as a **verified** `Domain` row. It answers 404
rather than 403 — Caddy treats any non-2xx as "do not issue", and 404 reveals
nothing about which hostnames exist.

**That endpoint must not be reachable from the public internet.** The Caddyfile
calls it on `127.0.0.1`, but binding the app to loopback is not what keeps it
private — the proxy forwards public requests to that same loopback port. So
every public-facing block answers `/api/caddy/*` with a 404 before proxying:
both Caddyfile site blocks, both blocks of the nginx catch-all, and the blocks
`deploy/issue-cert.sh` writes. The app can't enforce this itself, since behind
a proxy every request arrives from loopback. It is excluded from the proxy's
matcher on purpose: Caddy passes the domain as a query parameter, not as the
`Host` header.

## Two front ends, two ways to get a certificate

**Caddy** (the clean-server design) issues on demand and asks
`/api/caddy/authorize` first. Nothing else is needed.

**nginx** (what the deployed box runs) cannot issue for a hostname it has never
seen, so the app does it explicitly:

1. [`deploy/nginx-customer-domains.conf`](../deploy/nginx-customer-domains.conf),
   installed as `/etc/nginx/sites-available/00-customer-domains`, is the
   catch-all `default_server`. Without it an
   unmatched Host falls through to whichever block nginx loaded first — which
   served an unrelated site's content on customers' domains, behind a
   certificate warning. It proxies everything to the app, and serves
   `/.well-known/acme-challenge/` from `/var/www/certbot` over plain HTTP so a
   challenge can succeed before any certificate exists.
2. On verification the app runs [`deploy/issue-cert.sh`](../deploy/issue-cert.sh)
   — the path in `CERT_ISSUE_COMMAND`, unset means the feature does not exist.
   It runs `certbot certonly --webroot`, writes a per-domain server block, tests
   the config, and reloads. It uses `--webroot` rather than the nginx plugin
   because the plugin edits whichever block it thinks matches, and with a
   catch-all default server that is the wrong one.
3. It is idempotent and holds a lock, so pressing Re-check is the retry.

The app never blocks on any of this: issuance is fire-and-forget, because it
talks to Let's Encrypt and reloads a web server, and neither belongs inside a
request someone is waiting on.

## Verification checks where a name resolves, not what record it has

A `CNAME` whose *target string* is the app domain used to pass. Put a CDN in
front of the app domain — as the deployed box has — and that CNAME resolves to
the CDN, which has never heard of the customer's hostname: green in the
dashboard, broken on the internet.

So the check resolves the name and requires the answer to include one of our
addresses, and the instructions ask for an **A record to `SERVER_IP`** for every
kind of name rather than a CNAME. When a CNAME to the app domain is found and
still doesn't reach us, the error says exactly that instead of "points
elsewhere".

## After any change to a Domain row, drop the cache tag

An unverified hostname resolves to `null`, and `unstable_cache` stores that miss
with no expiry. The natural sequence — connect the domain, visit it to see
whether it works yet, then verify — therefore poisons the cache with a `null`
that nothing would ever clear, and the domain 404s forever after going green in
the dashboard.

`revalidateHost(hostname)` is called on add, verify and remove for exactly this
reason. If you add another path that changes what a hostname resolves to, call
it there too. See [architecture.md](architecture.md#caching-and-the-rule-that-follows-from-it).

## Deploying

- The redeploy recipe is in the root [README](../README.md#deployed-at-make-your-portfoliolfdiegoxyz).
  `npx prisma generate` is a required step in it: `src/generated/prisma` is
  gitignored, so a pull never brings a client that knows about a new model, and
  the build fails type-checking until it is regenerated.
- [`deploy/`](../deploy) has a systemd unit, a pm2 config and a start script.
- [`Dockerfile`](../Dockerfile) and [`docker-compose.yml`](../docker-compose.yml)
  are there if you'd rather.
- `ASSETS_DIR` is served straight off disk by Caddy at `/assets/*`, never
  through Node.
- Required in production: `APP_DOMAIN`, `NEXT_PUBLIC_APP_DOMAIN`,
  `DATABASE_URL`, `AUTH_SECRET`, `ACME_EMAIL`, and `EMAIL_SERVER_HOST` — a
  missing mail server is a hard error in production rather than a sign-in link
  printed into a log file. Auth.js also needs `AUTH_URL` on the deployed box, or
  every magic link points at the server's own bind address; see the deployment
  notes in the root [README](../README.md).
- Optional: `SERVER_IP` (apex verification), `AUTH_GITHUB_*` / `AUTH_GOOGLE_*`,
  `ANTHROPIC_API_KEY`.

> `.env.production.example` is matched by the `.env.*` line in `.gitignore`, so
> it exists locally but is not in the repository. `.env.example` is the tracked
> one; keep new variables documented there.
