import type { PortfolioDoc } from "@/lib/schema/portfolio";

/**
 * Turning a rendered portfolio into one self-contained HTML file.
 *
 * The app renders the page (/export/<siteId>) and the export route fetches it
 * back; everything here is the work in between, as pure functions over strings
 * with the fetching passed in, so it can be tested without a server.
 *
 * The file has no scripts. Next's are removed (they would only fail against a
 * server that isn't there), stylesheets become <style> blocks, and fonts,
 * images and videos become data: URIs.
 */

/** The embedded files one export may carry, in total. */
export const MAX_EXPORT_BYTES = 100 * 1024 * 1024;

/**
 * The published document, adjusted for a page that never runs JavaScript:
 * content that fades in on scroll would stay invisible, a theme toggle would do
 * nothing, and a menu that only opens with a click would leave no way to navigate.
 */
export function exportDoc(doc: PortfolioDoc): PortfolioDoc {
  const { nav } = doc.design;
  return {
    ...doc,
    design: {
      ...doc.design,
      tokens: { ...doc.design.tokens, motion: "none" },
      nav: {
        ...nav,
        variant: nav.variant === "hamburger-overlay" ? "top-static" : nav.variant,
        mobileBehavior: nav.mobileBehavior === "hamburger" ? "wrap" : nav.mobileBehavior,
        showThemeToggle: false,
      },
    },
  };
}

export function exportFileName(handle: string): string {
  return `portfolio-${handle.replace(/[^a-z0-9-]/gi, "") || "site"}.html`;
}

/** Link relations that only exist for scripts, or would point back at this app. */
const DROPPED_LINKS = /^(?:preload|modulepreload|prefetch|preconnect|dns-prefetch|icon|shortcut icon|apple-touch-icon|manifest)$/i;

const attr = (tag: string, name: string) =>
  new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i").exec(tag)?.slice(1).find((v) => v !== undefined);

const decodeEntities = (value: string) =>
  value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'");

/** Every <script>, the links that serve them, and CSP nonces nothing will check. */
export function stripScripts(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<link\b[^>]*>/gi, (tag) => (DROPPED_LINKS.test(attr(tag, "rel") ?? "") ? "" : tag))
    .replace(/\snonce="[^"]*"/gi, "");
}

/**
 * A reference as a path on this app — `/_next/static/media/x.woff2` — resolved
 * against the file it appears in. Null for data: URIs and other hosts, which
 * are left exactly as they are.
 */
export function localPath(ref: string, base = "/"): string | null {
  const value = decodeEntities(ref.trim());
  if (!value || /^data:/i.test(value) || value.startsWith("#")) return null;
  const sentinel = "http://export.invalid";
  try {
    const url = new URL(value, new URL(base, sentinel));
    return url.origin === sentinel ? url.pathname + url.search : null;
  } catch {
    return null;
  }
}

const CSS_URL = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)'"\s]*))\s*\)/gi;

function cssPaths(css: string, base: string): string[] {
  return [...css.matchAll(CSS_URL)].flatMap((m) => localPath(m[1] ?? m[2] ?? m[3] ?? "", base) ?? []);
}

function rewriteCss(css: string, base: string, uri: (path: string) => string | undefined): string {
  return css.replace(CSS_URL, (whole, dq, sq, bare) => {
    const path = localPath(dq ?? sq ?? bare ?? "", base);
    const data = path && uri(path);
    return data ? `url("${data}")` : whole;
  });
}

/** A next/font variable: `--font-inter: "Inter", "Inter Fallback"` — only quoted family names. */
const FONT_VARIABLE = /--font-([a-z0-9-]+)\s*:\s*((?:"[^"]*"|'[^']*')(?:\s*,\s*(?:"[^"]*"|'[^']*'))*)/gi;
const FONT_REFERENCE = /var\(\s*--font-([a-z0-9-]+)/gi;

/**
 * The font families a page actually uses, lower-cased.
 *
 * The root layout declares a variable for every family the app offers, and
 * next/font an @font-face for each; a portfolio's theme references two or
 * three of those variables. Null when the sources declare no such variables,
 * meaning there is nothing to tell used from unused and nothing may be pruned.
 */
export function usedFontFamilies(sources: string[]): Set<string> | null {
  const text = sources.join("\n");
  const declared = new Map<string, string[]>();
  for (const [, name, value] of text.matchAll(FONT_VARIABLE)) {
    declared.set(name.toLowerCase(), [...value.matchAll(/"([^"]*)"|'([^']*)'/g)].map((m) => (m[1] ?? m[2]).trim().toLowerCase()));
  }
  if (declared.size === 0) return null;

  const used = new Set<string>();
  for (const [, name] of text.matchAll(FONT_REFERENCE)) {
    for (const family of declared.get(name.toLowerCase()) ?? []) used.add(family);
  }
  return used;
}

/** A stylesheet without the @font-face rules for families outside `families`. */
export function pruneFontFaces(css: string, families: Set<string>): string {
  return css.replace(/@font-face\s*\{[^}]*\}/gi, (face) => {
    const family = /font-family\s*:\s*([^;}]+)/i.exec(face)?.[1].trim().replace(/^["']|["']$/g, "").toLowerCase();
    // A rule that names no family can't be judged; keep it.
    return !family || families.has(family) ? face : "";
  });
}

const MEDIA_ATTR = /(\s(?:src|poster)\s*=\s*)(?:"([^"]*)"|'([^']*)')/gi;

export type LoadedFile = { body: Uint8Array; type: string };
/** Fetch one of this app's files by path, or null when it can't be had. */
export type FileLoader = (path: string) => Promise<LoadedFile | null>;

export type ExportResult = { ok: true; html: string; bytes: number } | { ok: false; error: string };

export function toDataUri({ body, type }: LoadedFile): string {
  const mime = type.split(";")[0].trim() || "application/octet-stream";
  return `data:${mime};base64,${Buffer.from(body).toString("base64")}`;
}

class TooLarge extends Error {}

export async function inlineExport(html: string, load: FileLoader, maxBytes = MAX_EXPORT_BYTES): Promise<ExportResult> {
  let bytes = 0;
  const files = new Map<string, LoadedFile | null>();

  /** Load every path not loaded yet, once each, keeping count of what is embedded. */
  const loadAll = async (paths: string[]) => {
    for (const path of new Set(paths)) {
      if (files.has(path)) continue;
      const file = await load(path);
      files.set(path, file);
      if (file) {
        bytes += file.body.byteLength;
        if (bytes > maxBytes) throw new TooLarge();
      }
    }
  };
  const uri = (path: string) => {
    const file = files.get(path);
    return file ? toDataUri(file) : undefined;
  };

  try {
    let out = stripScripts(html);

    // Stylesheets become <style> blocks, with their fonts and images embedded.
    const sheets = [...out.matchAll(/<link\b[^>]*>/gi)]
      .map((m) => m[0])
      .filter((tag) => /(^|\s)stylesheet(\s|$)/i.test(attr(tag, "rel") ?? ""))
      .map((tag) => ({ tag, path: localPath(attr(tag, "href") ?? "") }));
    await loadAll(sheets.flatMap((s) => s.path ?? []));

    const sheetCss = new Map<string, string>();
    for (const { path } of sheets) {
      const file = path ? files.get(path) : null;
      if (path && file) sheetCss.set(path, new TextDecoder().decode(file.body));
    }
    // Narrowed to the families the page uses before anything is fetched, so the
    // app's other fonts never reach the file.
    const families = usedFontFamilies([out, ...sheetCss.values()]);

    const styles = new Map<string, string>();
    for (const [path, raw] of sheetCss) {
      const css = families ? pruneFontFaces(raw, families) : raw;
      await loadAll(cssPaths(css, path));
      // Escaped so nothing inside the stylesheet can end the <style> element.
      styles.set(path, rewriteCss(css, path, uri).replace(/<\/style/gi, "<\\/style"));
    }
    out = out.replace(/<link\b[^>]*>/gi, (tag) => {
      const path = /(^|\s)stylesheet(\s|$)/i.test(attr(tag, "rel") ?? "") ? localPath(attr(tag, "href") ?? "") : null;
      const css = path ? styles.get(path) : undefined;
      return css === undefined ? tag : `<style>${css}</style>`;
    });

    // Images, videos and posters. `src` is already the largest rendition, so
    // srcset — every other width, embedded again — is dropped.
    out = out.replace(/\s(?:srcset|sizes)\s*=\s*(?:"[^"]*"|'[^']*')/gi, "");
    await loadAll([...out.matchAll(MEDIA_ATTR)].flatMap((m) => localPath(m[2] ?? m[3] ?? "") ?? []));
    out = out.replace(MEDIA_ATTR, (whole, prefix, dq, sq) => {
      const path = localPath(dq ?? sq ?? "");
      const data = path && uri(path);
      return data ? `${prefix}"${data}"` : whole;
    });

    // Inline style attributes and blocks can carry url() too (a tiled background).
    out = out.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi, (whole, open, css, close) =>
      cssPaths(css, "/").every((p) => files.has(p)) ? `${open}${rewriteCss(css, "/", uri)}${close}` : whole,
    );

    return { ok: true, html: out, bytes };
  } catch (error) {
    if (error instanceof TooLarge) {
      return { ok: false, error: `The page's files come to more than ${Math.round(maxBytes / 1024 / 1024)} MB, too much for one HTML file.` };
    }
    throw error;
  }
}
