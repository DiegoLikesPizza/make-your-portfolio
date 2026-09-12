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

### The public demos

One example portfolio per preset at `/d/editorial`, `/d/minimal`, `/d/serif`,
`/d/gradient`, `/d/terminal` and `/d/brutalist`. The homepage and `/layouts`
link to them.

Nothing to seed: [`src/app/d/[preset]/page.tsx`](../src/app/d/%5Bpreset%5D/page.tsx)
renders the fixture directly, so a demo is always current with the preset it
shows and a fresh clone has working demos before the database has a single row.

They used to be seeded site rows at `/u/<preset>`, which cost six reserved
handles — a user could not claim `editorial` because the marketing site linked
to it — and left the demos stale until someone re-ran the seed. Their own path
namespace costs neither.

A database seeded before that change still has those six site rows. They are
harmless — `editorial` simply reads as a taken handle — but deleting them hands
the names back:

```sql
DELETE FROM "Site" WHERE "userId" = (SELECT id FROM "User" WHERE email = 'demos@invalid.local');
```

Content lives in [`src/lib/fixtures/demo.ts`](../src/lib/fixtures/demo.ts) — an
invented studio, deliberately not the reference document, because publishing six
copies of a real CV under six handles would put a real person's details on pages
nobody claims to own. Each preset gets its own hero and its own layout per
section, so the six read as six different sites rather than one site in six
colours.

### `/u/demo`

The reference document — lfdiego.xyz's content — as a finished page. In
development it is the seeded `demo` site, as last published. Where no site holds
the handle, which is every deployment,
[`src/lib/reference-demo.ts`](../src/lib/reference-demo.ts) renders the fixture
instead: `noindex`, never counted, and `demo` is a reserved handle so nobody can
take the address.

### The admin page

Put the address you sign in with in `ADMIN_EMAILS` and open `/admin`. The account
has to have signed in **by email link** at least once, which is what proves the
address (see [dashboard.md](dashboard.md#admin--admin)). The seeded
`dev@example.localhost` never has, so it isn't an admin until it does.

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
