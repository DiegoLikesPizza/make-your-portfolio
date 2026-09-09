/**
 * Guards against the white-on-white class of bug: any page that uses a
 * `dark:` text colour must sit on an element that also sets a dark background,
 * otherwise it is invisible for anyone whose device is in dark mode.
 *
 * Checks the served HTML rather than the source, because that is where the
 * body's actual classes end up.
 */
const base = process.env.BASE ?? "http://localhost:3100";
const PAGES = ["/", "/signin", "/signin/check-email"];

let fail = 0;
for (const path of PAGES) {
  const html = await (await fetch(base + path)).text();
  const body = html.match(/<body class="([^"]*)"/)?.[1] ?? "";

  const usesDarkText = /dark:text-/.test(html);
  const hasDarkBg = /dark:bg-/.test(body) || /dark:bg-/.test(html);
  const hasBg = /\bbg-/.test(body) || /\bbg-/.test(html);

  const ok = !usesDarkText || (hasBg && hasDarkBg);
  if (!ok) fail += 1;
  console.log(`${ok ? "PASS " : "FAIL "}${path.padEnd(22)} dark text:${usesDarkText} bg:${hasBg} dark bg:${hasDarkBg}`);
}

console.log(`\n${PAGES.length - fail}/${PAGES.length} pages paint a background`);
process.exit(fail ? 1 : 0);
