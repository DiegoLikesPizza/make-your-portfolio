# Extending the catalog

## Add a section layout

Four steps, three of them one line.

1. **Name it** in [`sections.ts`](../src/lib/schema/sections.ts), in that type's
   `*_VARIANTS` list.
2. **Build it** at `src/variants/<type>/<variant>.tsx`. It receives
   `SectionProps<"<type>">` — `section`, `index`, `ctx` — and must consume the
   *same* `data` as every other layout of its type. A field it can't show, it
   ignores; the editor's hint says so.
3. **Register it** in [`registry.ts`](../src/variants/registry.ts).
4. Run `npm run coverage` and `npm run sweep`.

The schema lists every *planned* variant and the registry lists the ones that
exist; the editor only ever offers the intersection, so a user can never select
a layout that would silently fall back to another. The gap between the two lists
is the catalog backlog, reported by a test rather than hidden.

Use the design tokens (`var(--radius)`, `var(--accent)`, `var(--foreground-muted)`,
`var(--border-color)`, …) rather than fixed values, or the layout will only look
right in one preset. If it renders edge-to-edge, add it to `BLEED` in the
registry.

A new layout appears in the picker, `/layouts` and `/dev/sweep` automatically.
If it needs an uploaded image to show its real shape, add it to `NEEDS_IMAGES`
in [`catalog.ts`](../src/lib/catalog.ts) so the browser says so.

## Add a setting to a layout

Only where there is a genuine behavioural choice. A grid has no setting worth
inventing, and a panel of controls that change nothing teaches people to stop
reading it.

1. If the key doesn't exist yet, add it to `variantOptions` in
   [`sections.ts`](../src/lib/schema/sections.ts) — an enum or a boolean, never
   a free-form string. That closed vocabulary is what stops a tampered document
   introducing a value of its own.
2. Describe it in `OPTION_FIELDS` and list it under the layout's key in
   `BY_VARIANT`, both in
   [`variant-options.ts`](../src/lib/variant-options.ts). The `fallback` is what
   documents written before the setting existed will render as, so it has to
   match the old hard-coded behaviour.
3. Read it in the component with `option(section, "key")`, never off
   `section.options` directly.

The editor panel builds itself from `BY_VARIANT`. Keys a layout ignores stay in
the document, so switching layout and back keeps the setting.

## Add a nav variant

Add the id to `navVariant` in
[`portfolio.ts`](../src/lib/schema/portfolio.ts), a `case` in
[`Nav.tsx`](../src/render/Nav.tsx), a label in `NAV_VARIANTS` in
[`DesignPanel.tsx`](../src/components/editor/DesignPanel.tsx), and the id to
`NAV_VARIANTS` in [`catalog.ts`](../src/lib/catalog.ts) so it shows on
`/layouts`.

If it hangs off a vertical edge, add it to `isSideNav` in
[`nav-layout.ts`](../src/render/nav-layout.ts) so it honours `side` and so the
floating scheme toggle moves out of its way; if it takes width from the page
rather than floating over it, give it a case in `railOffset`.

`nav-layout.ts` is separate from `Nav.tsx` because `Nav` is a client component,
and `Portfolio` — a server component — can render a client component but cannot
call a function exported from one.

## Add a preset

A preset is just a starting `design`: a tested bundle of shell, tokens, nav and
background. Add a file under [`src/presets/`](../src/presets) and an entry in
`PRESETS`. Nothing tracks which parts a user changed afterwards, because nothing
needs to.

Between them the presets should keep covering every nav variant, both shadow
styles and all three colour-scheme modes, so the token layer is exercised by
real combinations rather than by one house style.

## Add a field to the document

1. Add it to the zod schema. **If existing documents won't have it, give it a
   `.default()` or make it optional** — `migrate()` re-parses every document on
   read, so that default *is* the migration.
2. Add it to the editor form.
3. Read it in the renderer.

No database migration: the whole document is one JSON column. If a change can't
be expressed as a default, add a `if (doc.version === 1) { …; doc.version = 2 }`
branch to `migrate()` and bump `CURRENT_VERSION`.

## Add a marker to the inline emphasis vocabulary

[`src/lib/text.tsx`](../src/lib/text.tsx): add to `TOKEN`, `MARKS`, `plain()`
and `MARKUP` — all four, or the renderer, the plain-text stripper and the
editor's toolbar will disagree.

Longer openers must come first in the alternation, or the shorter one swallows
them (`*` before `**` would break bold). Map to a **role** the palette owns, not
to a colour value.
