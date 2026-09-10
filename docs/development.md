# Development

## Running it

No Docker required. `prisma dev` runs a real local Postgres as a plain
background process.

```bash
npm install
npm run db -- -d          # start local Postgres (detached); `npx prisma dev ls` shows the URL
npx prisma migrate deploy
npm run seed              # dev user + the demo site
PORT=3100 npm run dev
```

Port 3000 is often taken by another project, hence 3100.

### Signing in

Magic links work with **no mail server**. Leave `EMAIL_SERVER_HOST` empty and
the sign-in link is printed to the dev server console — copy it from there.
GitHub and Google buttons appear on `/signin` only once their credentials are in
`.env`.

The seed creates `dev@example.localhost` and a site at `/demo`, seeded as a
**draft only**, so the first thing you exercise is the publish path.

## The checks

| | |
|---|---|
| `npm test` | Host routing, subdomain claiming, the proxy matcher literal, and the assist schema. Pure — no server, no database. |
| `npm run routes` | Every public URL, against a **running** dev server on 3100. |
| `npm run smoke` | Autosave, conflict detection, publish, token and nav changes, and that a draft is not public. Needs a running server. |
| `npm run coverage` | Every variant in the schema has a component in the registry. |
| `npm run sweep` | Every variant actually renders. |
| `npm run contrast` | Marketing pages paint their own background in both schemes. |
| `npm run lint` / `npx tsc --noEmit` | |

`/dev/sweep` renders every section variant on one page in the browser, and
`/layouts` is the public catalog browser.

## Traps

**A page 404s after you edited a row by hand.** `unstable_cache` stores misses,
and a write from outside the app can't revalidate a tag. Publish once from the
editor, or clear `.next/cache` *and* re-publish. See
[architecture.md](architecture.md#caching-and-the-rule-that-follows-from-it).

**`prisma migrate dev` fails on the shadow database.** The local `prisma dev`
URL points at `template1`, so the shadow database is created from a template
that already contains the app's types and the replayed migration collides.
Generate the SQL and apply it by hand instead:

```bash
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script \
  > prisma/migrations/<timestamp>_<name>/migration.sql
npx prisma db execute --file prisma/migrations/<timestamp>_<name>/migration.sql
npx prisma migrate resolve --applied <timestamp>_<name>
npx prisma generate
```

**The Prisma client is generated into `src/generated/prisma` and committed.**
Change `schema.prisma` and you must `npx prisma generate`, and restart the dev
server — a long-running server holds the old client and `db.<newModel>` will be
`undefined`.

**Dates inside a hydrated component.** `toLocaleDateString()` reads the
runtime's locale and time zone, and the server's are not the visitor's, so every
such date is a hydration mismatch React logs and refuses to patch. Use
[`src/lib/dates.ts`](../src/lib/dates.ts), which formats from fixed tables in
UTC.

**Interpolated Tailwind class names produce no CSS.** Tailwind scans source text,
so `lg:grid-cols-${n}` matches nothing. Write the options out in a lookup — see
`COLUMNS` in [`gallery/uniform-grid.tsx`](../src/variants/gallery/uniform-grid.tsx).

**`AGENTS.md` is rewritten by `next dev`.** Removing it from a diff only
re-creates the change; commit it with your work.

## This is Next 16

Middleware is called **Proxy** and lives in `src/proxy.ts`. The bundled docs in
`node_modules/next/dist/docs/` are the version actually installed — read those
rather than remembering an older API.
