# Uploads

Images and GIFs are uploaded from the editor, wherever a field takes one: the
hero portrait, the About image, project covers, gallery items, testimonial
avatars, and the page, hero and section backgrounds.

## What happens to a file

`POST /api/sites/<siteId>/assets` ([route](../src/app/api/sites/[siteId]/assets/route.ts)),
owner only. It is a Route Handler rather than a Server Action because actions
cap a body at 1 MB.

1. **Rejected early** if the declared size is too large, the user is over the
   upload rate limit (60 an hour), or the site is at its quota: **100 files or
   200 MB**.
2. **Validated by decoding it** with `sharp` ([`src/lib/storage.ts`](../src/lib/storage.ts)).
   The file name and the declared type are never trusted. Accepted: JPEG, PNG,
   WebP, AVIF, GIF. **SVG is refused**: it can carry script, and it would be
   served from the same origin as the dashboard. Images may be 5 MB, GIFs 15 MB.
3. **Re-encoded** to WebP at 400, 800 and 1600px wide, never wider than the
   original. Re-encoding drops EXIF — GPS included — and applies the EXIF
   rotation first so portrait phone photos stay upright.
4. **Animated GIFs** also become a looping WebP, and an MP4 when `ffmpeg` is on
   the server's `PATH`. Backgrounds play the MP4 when there is one; without
   ffmpeg the looping WebP still plays, so its absence isn't an error.
5. An `Asset` row records the size, the kind and which files exist.

Asset ids are lowercase letters and digits only: files are named `<id>-<width>.webp`,
and a hyphen inside an id would let one asset's files match another's.

## Where files live and how they're served

On disk under `ASSETS_DIR` (default `./data/assets`), one directory per site:

```
<ASSETS_DIR>/<siteId>/<id>-400.webp
                     /<id>-800.webp
                     /<id>-1600.webp
                     /<id>-anim.webp   animated only
                     /<id>.mp4         animated, where ffmpeg ran
```

They're served at `/assets/<siteId>/<file>`:

- **Caddy** serves the directory itself and never reaches Node.
- **nginx** proxies everything, so [`src/app/assets/[...path]`](../src/app/assets/[...path]/route.ts)
  answers. It only serves paths shaped exactly like names uploads are written
  under (so nothing outside the directory can be named), with immutable caching
  and byte-range support, which Safari needs to play video.

The proxy matcher skips paths containing a dot, so `/assets/...` works the same
on custom domains.

## Rendering

`resolveAsset` ([`src/lib/assets.ts`](../src/lib/assets.ts)) turns a row into the
`AssetMap` every renderer already reads: a `src` and `srcSet` for stills, the
looping WebP plus `video` and `poster` for GIFs. The published page, the editor
preview and the draft preview link all load the site's map; the editor adds each
new upload to it and posts it to the preview along with the document.

## Deleting

Clearing an image field only unsets the field. The file stays, because another
field or a saved version may still use it.

Settings → *Uploads* lists every file with its size and whether the draft, the
live page or any saved version still uses it. Only unused ones can be deleted,
and `DELETE /api/sites/<siteId>/assets/<assetId>` checks again. Saved versions
count as users on purpose: deleting a file one needs would leave *Publish this
version* putting a page live with a hole in it.

Deleting a site or an account removes its whole directory.

## On the box

- `ASSETS_DIR` has to be writable by the app's user
  (`/srv/websites/make-your-portfolio.lfdiego.xyz/data/assets` there).
- `ffmpeg` is optional; install it to get MP4 for GIF backgrounds.
- nginx's `client_max_body_size 20M` already covers the 15 MB GIF limit.
