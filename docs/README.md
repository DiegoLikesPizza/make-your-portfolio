# Documentation

A hosted builder for one-page portfolios. Sign in, fill out a guided form, watch
the page render live beside it, publish to `example.com/u/name` or your own
domain.

Start with [architecture.md](architecture.md) — the rest of the codebase only
makes sense once you have the three-layer model and the single-document idea in
your head. Everything else can be read out of order.

| | |
|---|---|
| [architecture.md](architecture.md) | The three layers, the one document, how a request becomes a page, what is cached and when it is dropped |
| [editor.md](editor.md) | The editing surface: sections, layouts, layout settings, inline emphasis, autosave and publish |
| [dashboard.md](dashboard.md) | Account, Analytics, Settings, and "Write it for me" |
| [hosting.md](hosting.md) | Handles, custom domains, DNS verification, Caddy and on-demand TLS |
| [development.md](development.md) | Running it locally, the checks, and the traps that cost an afternoon |
| [extending.md](extending.md) | Adding a section layout, a preset, a layout setting, a nav variant |

## The shape of it in one paragraph

A portfolio is **one JSON document**, validated by
[`src/lib/schema/portfolio.ts`](../src/lib/schema/portfolio.ts), stored twice per
site: `draftDoc` (what the editor is working on) and `publishedDoc` (what the
public sees). Nothing about layout, theme or content lives in a database column,
so publishing is an atomic copy, adding a layout never touches a migration, and
the editor's live preview and the published page render through the same
components.

## The public demos

One example portfolio per preset lives at `/d/editorial` through
`/d/brutalist`, rendered straight from the fixture — nothing to seed. See
[development.md](development.md#the-public-demos).

## What is not built

**Uploads.** `Asset` exists in the schema and `assetId` fields exist on gallery
items, project covers and the About portrait, but nothing writes them. Gallery
layouts render grey placeholders. Everything else works without images.

## Conventions worth knowing before you read code

- **Every variant of a section type consumes the same `data`.** Switching
  Projects from `numbered-list` to `table` never loses content and never opens a
  migration dialog. A layout that can't show a field ignores it. This is the
  rule that lets the catalog grow without the schema rotting.
- **A capability the server can't perform is never offered.** Sign-in providers
  without credentials aren't rendered; "Write it for me" has no tab and its
  route 404s without an API key. A button and its capability can never disagree.
- **Design values are enums, never free-form CSS.** A tampered document can
  change *which* of our values is used and can never introduce one of its own.
