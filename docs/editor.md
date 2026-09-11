# The editor

`/dashboard/<siteId>/edit`. Sections on the left, the selected thing in the
middle, the real page on the right.

The preview is an iframe rendering `/dashboard/<siteId>/preview` through the
**same components as the published site**, fed by `postMessage`. "What you see
is what publishes" is structural here rather than a promise.

## The left rail

The page as an ordered list. Rows drag to reorder (dnd-kit, with a keyboard
sensor so the same reorder works without a mouse), and each row carries a `⋯`
menu:

| | |
|---|---|
| Move up / Move down | Same as dragging, for one-step moves |
| **Change layout…** | Opens the layout picker on this section's type |
| Duplicate | Deep copy with a new id and a free slug |
| Hide / Show | Keeps the section in the document, out of the page |
| Delete | Set apart at the bottom, in red |

## The layout picker

Adding a section, and changing an existing one's layout, are the same question
asked twice, so they are the same dialog.

- **Add** — section types down the side, every layout for the chosen type as a
  card, rendered with sample content.
- **Change layout** — locked to the section's own type, previewed with **your**
  content, current layout marked.

The cards are the real variant components rendered with the site's own tokens,
not screenshots, so the picker cannot show you something publishing wouldn't.
They render at page width and are scaled down rather than reflowed, because a
layout squeezed into a 300px column shows a shape it never has in production.

Changing a layout is a re-render, never a migration: every variant of a section
type consumes the same `data`. That is the rule the whole catalog rests on.

## The middle pane

For a section:

1. **Section title** and **Anchor** (the `#slug` nav links point at).
2. **Layout settings**, if the chosen layout has any — see below.
3. **Content**, one form per section *type*, never per variant. Where a variant
   ignores a field, the hint says so rather than the field vanishing.

For "Profile & hero": name, initials, eyebrow, headline, intro, up to two
buttons, social links, and the page title/description used for search and
sharing.

### Layout settings

Settings that belong to the layout rather than to the section — "this marquee
scrolls the other way" is not a token (it applies to one section) and not
content (switching layout and back shouldn't lose it). They live in
`section.options`, a single flat, closed vocabulary in
[`sections.ts`](../src/lib/schema/sections.ts); which keys a layout reads, and
their defaults, are in
[`src/lib/variant-options.ts`](../src/lib/variant-options.ts).

| Layout | Settings |
|---|---|
| Marquee (capabilities, skills, testimonials) | Speed, direction |
| Testimonials slider, gallery carousel | Advance on its own |
| Gallery uniform grid | Columns |
| About portrait | Image side |
| Text callout | Tone |
| Projects table | Show the year, show the tech list |
| Projects numbered list | Rules between rows, show the tech list |
| Stats number row, inline strip | Alignment |

Layouts with no genuine behavioural choice get no panel — a row of controls that
change nothing teaches people to stop reading the panel. A key a layout ignores
stays in the document, so switching away and back keeps your setting.

Autoplay is a timer nudging `scrollLeft` on the existing scroll-snap list, not a
carousel implementation: dragging, the scrollbar, arrow keys and the snap points
keep working. It pauses on hover and focus, and never starts under
`prefers-reduced-motion`.

### Inline emphasis

The display strings — the hero sentence, an About lead, a contact headline —
carry inline marks, applied with a small `B I A M` toolbar over the field:

| Marker | Renders as |
|---|---|
| `**bold**` | weight 700 (display type is already 600, so a semibold mark would do nothing) |
| `*italic*` | italic |
| `==accent==` | the site's accent colour |
| `~muted~` | the muted foreground |

Colour is a **role**, not a value. A hex code in the content layer would survive
a preset change, fight the palette, and be the one thing in a document that
can't be re-themed; `==accent==` moves with the palette instead. Markers don't
nest — one pass, one mark per run. What is stored is still the plain string with
its markers in it, because that string is what the renderer, the preview, the
published page and the OG description all read.

Body copy deliberately doesn't get this. Emphasis scattered through a paragraph
is how a portfolio starts to look like a ransom note.

### Dynamic values

Any text in a document may contain `{{...}}` placeholders, worked out when the
page renders rather than when it was written. The `{ }` button beside the
emphasis toolbar inserts one and selects the example argument, which is the part
you replace.

| Placeholder | Renders as |
|---|---|
| `{{date}}` | `10 Sep 2026` — also `format=long`, `iso`, `year`, `month`, `weekday` |
| `{{time}}` | `14:32 UTC` |
| `{{years since=2019-01-01}}` | `7` — also `months`, `days`, and `until=` instead of `since=` |
| `{{age since=1998-04-02}}` | `28` |
| `{{count of=projects}}` | entries in the visible sections of that type |

The point is the strings that go stale silently. "Seven years building X" is
wrong a year after it was typed and nobody edits a portfolio to fix it. Counts
drift the same way against a Projects section that has since grown.

Elapsed time is whole units by the calendar, never by division: the answer is
"has the anniversary happened yet", so 365-day years and 29 February both come
out right. Everything formats in UTC, for the reason in
[`dates.ts`](../src/lib/dates.ts) — a value that reads the runtime's time zone
renders differently on the server and in the browser, and the preview renders in
both.

An unknown name, a missing argument or a date that isn't one leaves the
placeholder standing on the page. Rendering nothing would make a typo look like
an empty field; seeing `{{yaers since=2019}}` is how you find out.

The vocabulary is closed on purpose — pure functions of the document and the
clock. A placeholder that could name a URL would turn rendering somebody's
portfolio into a request our server makes on their behalf.
See [`src/lib/dynamic.ts`](../src/lib/dynamic.ts).

### List fields

"Tech", "Skills" and "Highlights" edit arrays through a text field. They keep
the raw text as their own state and publish the parsed list outward, re-seeding
only when a value arrives that the field did not produce.

This is not incidental: rendering `items.join(", ")` back into the input and
re-parsing every keystroke makes the field lossy against itself. The space in
`React, ` is trimmed away before it can be displayed, and a newline is filtered
out before it can hold a character — which is why Enter used to look like a dead
key. See [`TokenField.tsx`](../src/components/editor/TokenField.tsx).

## Search and sharing

Under *Profile & hero → Search & sharing*: the page title and description, and
an optional **share image**. A published portfolio's `<head>` is built by
`portfolioMetadata` in [`src/lib/portfolio-metadata.ts`](../src/lib/portfolio-metadata.ts),
the same way on every route it is reached by.

- **Link previews** use the uploaded share image when there is one, otherwise a
  generated card — name, headline and role in the site's own colours — from
  `/u/<handle>/og` ([`src/lib/share-card.tsx`](../src/lib/share-card.tsx)).
  It's a plain route rather than the `opengraph-image` file convention: that
  convention outranks the metadata, so an uploaded image could never replace it,
  and on a custom domain its relative URL would resolve to the portfolio page.
  On a custom domain the card URL is absolute, on the app's own domain.
- **Structured data**: each public portfolio page carries a schema.org `Person`
  block — name, role, headline, portrait and http(s) links, nothing the page
  doesn't already show ([`src/lib/seo.ts`](../src/lib/seo.ts)).
- **`/robots.txt`** keeps crawlers out of the dashboard, the API, private
  preview links, exports and sign-in.
- **`/sitemap.xml`** lists the app's public pages and every published
  `/u/<handle>` that isn't set to *noindex*. Custom domains aren't listed: a
  sitemap may only name URLs on its own host.

Absolute URLs come from `AUTH_URL`, which production requires. Without it, in
development, the card URL stays relative and structured data has no image.

## Autosave and publish

- The preview updates after **150 ms**; the server write waits **800 ms**, so a
  sentence is one request rather than forty.
- Autosave `PATCH`es the whole document with the `updatedAt` the editor last
  saw. If the row moved on, the API answers **409**, autosave stops, and a
  banner says so — rather than silently clobbering a change made in another tab.
- **Publish** flushes the pending autosave first (otherwise it copies the
  previous draft), re-validates the draft server-side, copies it to
  `publishedDoc`, and drops every cache tag for the site.
- A draft is never public. An unpublished site 404s on every public URL.

## Dark mode

The editor follows the OS. Every input states its own placeholder colour:
`color-scheme: light dark` hands the browser a scheme-appropriate grey, which
lands almost invisible against a background the app has painted itself.
