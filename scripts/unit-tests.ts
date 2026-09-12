import { readFileSync } from "node:fs";
import { resolveHost, normalizeHost } from "../src/lib/hosts";
import { validateSubdomain, normalizeSubdomain } from "../src/lib/reserved-subdomains";
import { resolveText, resolveDynamic } from "../src/lib/dynamic";
import { hasOwnershipToken, ownershipRecord } from "../src/lib/dns";
import { isStaleClaim } from "../src/lib/domain-claims";
import { clientIp, describeWait, rateLimit } from "../src/lib/rate-limit";
import { normalizeSource } from "../src/lib/analytics";
import { isSafeHref } from "../src/lib/schema/sections";
import { migrate, portfolioDoc } from "../src/lib/schema/portfolio";
import { starterDoc } from "../src/lib/fixtures/starter";
import { contentSecurityPolicy } from "../src/lib/csp";
import { portfolioMetadata } from "../src/lib/portfolio-metadata";
import { isHandleCoolingDown } from "../src/lib/handles";
import { afterScheduledCheck, FAILED_CHECKS_BEFORE_UNVERIFY, recheckToken } from "../src/lib/domain-recheck";
import { isPreviewToken, newPreviewToken } from "../src/lib/preview-links";
import { VERSIONS_KEPT, versionsToPrune } from "../src/lib/versions";
import { ASSET_LIMITS, documentsUseAsset, isSafeAssetPath, quotaProblem, renditionWidths, resolveAsset } from "../src/lib/assets";
import { jsonForScript, personJsonLd, portfolioSitemapEntries } from "../src/lib/seo";
import { CONTACT_LIMITS, parseContact } from "../src/lib/contact";
import { normalizeUsername, pickRepos, repoToProject, toRepo, type GithubRepo } from "../src/lib/github";
import { exportDoc, exportFileName, inlineExport, stripScripts } from "../src/lib/export";
import type { PortfolioDoc } from "../src/lib/schema/portfolio";

/**
 * Unit tests for the two functions that decide routing and identity.
 *
 * Host routing decides whether a request is the dashboard or somebody's
 * portfolio — get it wrong and you 404 the app or serve the wrong site.
 * Subdomain validation decides what a user is allowed to claim.
 *
 *   npm test
 */
const cases: [string, string][] = [
  // The app itself.
  ["example.localhost", "app"],
  ["app.example.localhost", "app"],
  ["www.example.localhost", "app"],
  ["localhost", "app"],
  ["localhost:3100", "app"],
  ["127.0.0.1:3100", "app"],
  // Reaching the dev server over the LAN from another device — this was
  // resolving as a custom domain and 404ing every page.
  ["192.168.178.69", "app"],
  ["192.168.178.69:3100", "app"],
  ["10.2.0.2:3100", "app"],
  ["[::1]:3100", "app"],
  // Subdomain hosting is off by default (no wildcard certificate), so a
  // subdomain of the app domain is the app, not somebody's site.
  ["demo.example.localhost", "app"],
  ["diego.example.localhost:3100", "app"],
  ["lfdiego.xyz", "custom"],
  ["portfolio.someone.dev", "custom"],
];

let failures = 0;
for (const [host, expected] of cases) {
  const actual = resolveHost(host).kind;
  const ok = actual === expected;
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS " : "FAIL "}${host.padEnd(30)} -> ${actual}${ok ? "" : `  (expected ${expected})`}`);
}

const custom = resolveHost("lfdiego.xyz");
if (custom.kind !== "custom" || custom.hostname !== "lfdiego.xyz") {
  failures += 1;
  console.log("FAIL  custom hostname extraction");
}
if (normalizeHost("[::1]:3100") !== "::1") {
  failures += 1;
  console.log("FAIL  IPv6 normalisation");
}

console.log(`\n${cases.length + 2 - failures}/${cases.length + 2} host cases passed`);


// --- subdomain claiming -----------------------------------------------------

const subCases: [string, string | null][] = [
  ["diego", null],
  ["a-b-c", null],
  ["x1", "too-short"],
  ["-nope", "invalid"],
  ["nope-", "invalid"],
  ["has space", "invalid"],
  // DNS labels are case-insensitive and the claim path lowercases before
  // storing, so uppercase input is accepted rather than rejected.
  ["UPPER", null],
  ["admin", "reserved"],
  ["api", "reserved"],
  ["www", "reserved"],
  ["billing", "reserved"],
  // The public demos moved to /d/<preset>, so the preset names are claimable
  // again — nothing in the product depends on owning them.
  ["editorial", null],
  ["brutalist", null],
  ["a".repeat(64), "too-long"],
];

let subFailures = 0;
for (const [value, expected] of subCases) {
  const actual = validateSubdomain(value);
  const ok = actual === expected;
  if (!ok) subFailures += 1;
  console.log(`${ok ? "PASS " : "FAIL "}subdomain ${value.slice(0, 20).padEnd(21)} -> ${actual ?? "ok"}${ok ? "" : `  (expected ${expected ?? "ok"})`}`);
}

if (normalizeSubdomain("  Diego Göttler! ") !== "diego-g-ttler") {
  subFailures += 1;
  console.log(`FAIL  normalizeSubdomain -> ${normalizeSubdomain("  Diego Göttler! ")}`);
}

console.log(`\n${subCases.length + 1 - subFailures}/${subCases.length + 1} subdomain cases passed`);

/**
 * Which paths the proxy actually runs on.
 *
 * This shipped broken and silently: an under-escaped `\.` in the matcher left
 * the regex reading `.*..*`, which rejects every path of two or more
 * characters, so the proxy only ever ran on `/` — and a customer's domain
 * served the dashboard on every other path. A regex that wrong is invisible in
 * review and obvious in a table.
 */
// Read the literal out of the source rather than importing the module: proxy.ts
// pulls in next/server, and what is under test is the string *as written* —
// JSON.parse applies the same escape rules the JavaScript parser does, which is
// exactly the step the original bug fell through.
const proxySource = readFileSync("src/proxy.ts", "utf8");
const literal = proxySource.match(/matcher: \[\s*("(?:[^"\\]|\\.)*")/)?.[1];
if (!literal) throw new Error("could not find the proxy matcher literal in src/proxy.ts");

let pathFailures = 0;
let matcher: RegExp | null = null;
try {
  matcher = new RegExp(`^${JSON.parse(literal) as string}$`);
} catch {
  // JSON rejects escapes it doesn't know, which is what the under-escaped
  // version was — so this branch catches the original bug by itself.
  pathFailures += 1;
  console.log(`FAIL  proxy matcher has an escape JavaScript would silently drop: ${literal}`);
}
const pathCases: [string, boolean][] = [
  ["/", true],
  ["/about", true],
  ["/u/demo", true],
  ["/d/editorial", true],
  ["/dashboard/abc/edit", true],
  // Excluded: Next internals, the API, and anything that looks like a file.
  ["/api/caddy/authorize", false],
  ["/_next/static/chunk.js", false],
  ["/favicon.ico", false],
  ["/logo.png", false],
];

for (const [path, expected] of matcher ? pathCases : []) {
  const actual = matcher!.test(path);
  const ok = actual === expected;
  if (!ok) pathFailures += 1;
  console.log(
    `${ok ? "PASS " : "FAIL "}proxy ${path.padEnd(26)} -> ${actual ? "runs" : "skipped"}` +
      `${ok ? "" : `  (expected ${expected ? "runs" : "skipped"})`}`,
  );
}

console.log(`\n${pathCases.length - pathFailures}/${pathCases.length} proxy path cases passed`);
// ------------------------------------------------------- dynamic values
//
// A fixed clock, because the whole point of these is that they read one.
const NOW = new Date("2026-09-10T14:32:00Z");

const doc = {
  sections: [
    { type: "projects", hidden: false, data: { items: [{}, {}, {}] } },
    // A second visible section of the same type adds to the count; a hidden
    // one does not, because a hidden one is not on the page.
    { type: "projects", hidden: false, data: { items: [{}] } },
    { type: "projects", hidden: true, data: { items: [{}, {}] } },
    { type: "skills", hidden: false, data: { groups: [{ items: [{}, {}] }, { items: [{}] }] } },
  ],
} as unknown as PortfolioDoc;

const dynamicCases: [string, string][] = [
  ["{{date}}", "10 Sep 2026"],
  ["{{date format=long}}", "10 September 2026"],
  ["{{date format=iso}}", "2026-09-10"],
  ["{{date format=year}}", "2026"],
  ["{{date format=weekday}}", "Thursday"],
  ["{{time}}", "14:32 UTC"],
  // Whole units only, and by the calendar: the 2019-01 anniversary has passed
  // this year, the 2019-12 one has not.
  ["{{years since=2019-01-01}}", "7"],
  ["{{years since=2019-12-01}}", "6"],
  ["{{months since=2026-08-11}}", "0"],
  ["{{days until=2026-09-20}}", "9"],
  ["{{age since=1998-04-02}}", "28"],
  // A date in the wrong direction is zero, not a negative.
  ["{{years since=2030-01-01}}", "0"],
  ["{{count of=projects}}", "4"],
  ["{{count of=skills}}", "3"],
  ["Working since {{date format=year}}, {{count of=projects}} shipped.", "Working since 2026, 4 shipped."],
  // Left standing: an unknown name, a missing argument, a section type with
  // nothing to count, a date that isn't one, and both endpoints at once.
  ["{{yaers since=2019-01-01}}", "{{yaers since=2019-01-01}}"],
  ["{{years}}", "{{years}}"],
  ["{{years since=last-tuesday}}", "{{years since=last-tuesday}}"],
  ["{{years since=2019-01-01 until=2030-01-01}}", "{{years since=2019-01-01 until=2030-01-01}}"],
  ["{{count of=gallery}}", "{{count of=gallery}}"],
  ["{{date format=fortnight}}", "{{date format=fortnight}}"],
  // Not a placeholder at all.
  ["100% of {{ nothing", "100% of {{ nothing"],
];

let dynFailures = 0;
for (const [input, expected] of dynamicCases) {
  const actual = resolveText(input, { doc, now: NOW });
  const ok = actual === expected;
  if (!ok) dynFailures += 1;
  console.log(
    `${ok ? "PASS " : "FAIL "}dynamic ${input.padEnd(46)} -> ${actual}${ok ? "" : `  (expected ${expected})`}`,
  );
}

// A document with no placeholders is handed back untouched rather than cloned.
const untouched = resolveDynamic(doc, NOW) === doc;
if (!untouched) dynFailures += 1;
console.log(`${untouched ? "PASS " : "FAIL "}dynamic a document without placeholders is not cloned`);

console.log(`\n${dynamicCases.length + 1 - dynFailures}/${dynamicCases.length + 1} dynamic value cases passed`);

// ------------------------------------------------------- domain ownership
//
// Every customer's domain resolves to the same address, so the TXT token is the
// only thing that ties a hostname to one account.
const TOKEN = "abc123";

const ownershipCases: [string, string[][], boolean][] = [
  ["exact record", [["portfolio-verify=abc123"]], true],
  // A long TXT value arrives split into chunks; they are one value.
  ["chunked record", [["portfolio-verify=", "abc123"]], true],
  ["among other TXT records", [["v=spf1 -all"], ["portfolio-verify=abc123"]], true],
  ["wrong token", [["portfolio-verify=zzz"]], false],
  ["token without the prefix", [["abc123"]], false],
  ["token as a substring", [["portfolio-verify=abc1234"]], false],
  ["no records", [], false],
];

let domainFailures = 0;
const expectDomain = (label: string, ok: boolean, detail = "") => {
  if (!ok) domainFailures += 1;
  console.log(`${ok ? "PASS " : "FAIL "}domain ${label}${ok ? "" : `  ${detail}`}`);
};

for (const [label, records, expected] of ownershipCases) {
  const actual = hasOwnershipToken(records, TOKEN);
  expectDomain(`TXT ${label}`, actual === expected, `(got ${actual}, expected ${expected})`);
}

// Names are relative to the zone, the way a registrar's panel asks for them.
const apexName = ownershipRecord("you.com", TOKEN).name;
const subName = ownershipRecord("portfolio.you.com", TOKEN).name;
expectDomain("TXT name for an apex domain", apexName === "_portfolio-verify", `(got ${apexName})`);
expectDomain("TXT name for a subdomain", subName === "_portfolio-verify.portfolio", `(got ${subName})`);

const daysAgo = (days: number) => new Date(NOW.getTime() - days * 86_400_000);
expectDomain("an unverified claim within a week still reserves the name", !isStaleClaim({ verified: false, createdAt: daysAgo(6) }, NOW));
expectDomain("an unverified claim past a week no longer does", isStaleClaim({ verified: false, createdAt: daysAgo(8) }, NOW));
expectDomain("a verified domain never goes stale", !isStaleClaim({ verified: true, createdAt: daysAgo(400) }, NOW));

const domainCases = ownershipCases.length + 5;
console.log(`\n${domainCases - domainFailures}/${domainCases} domain ownership cases passed`);

// ------------------------------------------------------- rate limiting
//
// Explicit timestamps, so the window can be walked through without waiting.
let limitFailures = 0;
const expectLimit = (label: string, ok: boolean, detail = "") => {
  if (!ok) limitFailures += 1;
  console.log(`${ok ? "PASS " : "FAIL "}limit ${label}${ok ? "" : `  ${detail}`}`);
};

const window3 = { limit: 3, windowMs: 1000 };
const T = 1_000_000;
const attempts = [0, 100, 200, 300].map((dt) => rateLimit("test:a", window3, T + dt));
expectLimit("allows up to the limit", attempts.slice(0, 3).every((r) => r.ok));

const refused = attempts[3];
expectLimit("refuses the next one inside the window", !refused.ok);
expectLimit(
  "says when the oldest attempt leaves the window",
  !refused.ok && refused.retryAfterMs === 700,
  `(got ${refused.ok ? "ok" : refused.retryAfterMs})`,
);
// Sliding, not fixed: at T+1050 only the first attempt has aged out.
expectLimit("frees one slot as the oldest attempt ages out", rateLimit("test:a", window3, T + 1050).ok);
expectLimit("and only one", !rateLimit("test:a", window3, T + 1060).ok);
expectLimit("keys are independent", rateLimit("test:b", window3, T + 300).ok);

// The last X-Forwarded-For hop is the one our proxy added; earlier ones are the client's.
const ipCases: [string, Record<string, string>, string][] = [
  ["single hop", { "x-forwarded-for": "203.0.113.7" }, "203.0.113.7"],
  ["a client-forged hop before ours", { "x-forwarded-for": "1.1.1.1, 203.0.113.7" }, "203.0.113.7"],
  ["X-Real-IP is not trusted", { "x-real-ip": "1.1.1.1" }, "unknown"],
  ["no header", {}, "unknown"],
];
for (const [label, headers, expected] of ipCases) {
  const actual = clientIp(new Headers(headers));
  expectLimit(`clientIp ${label}`, actual === expected, `(got ${actual})`);
}

expectLimit("describeWait in minutes", describeWait(90_000) === "2 minutes", `(got ${describeWait(90_000)})`);
expectLimit("describeWait in hours", describeWait(3 * 3_600_000) === "3 hours", `(got ${describeWait(3 * 3_600_000)})`);

const sourceCases: [unknown, string][] = [
  ["news.ycombinator.com", "news.ycombinator.com"],
  ["LinkedIn.com", "linkedin.com"],
  ["localhost:3000", "localhost:3000"],
  // Anything a forged beacon might send that isn't a hostname counts as direct.
  ["<script>", ""],
  ["has spaces.com", ""],
  ["a".repeat(121), ""],
  [42, ""],
];
for (const [input, expected] of sourceCases) {
  const actual = normalizeSource(input);
  expectLimit(`source ${String(input).slice(0, 24)}`, actual === expected, `(got "${actual}")`);
}

const limitCases = 6 + ipCases.length + 2 + sourceCases.length;
console.log(`\n${limitCases - limitFailures}/${limitCases} rate limit cases passed`);

// ------------------------------------------------------- link schemes
//
// Portfolios share an origin with the dashboard, so a link that runs script is
// stored XSS against anyone signed in who views one.
const hrefCases: [string, boolean][] = [
  ["https://example.com", true],
  ["http://example.com", true],
  ["mailto:you@example.com", true],
  ["tel:+441234567890", true],
  ["//example.com", true],
  ["#about", true],
  // A CTA target may be a bare section slug.
  ["about", true],
  ["", true],
  ["javascript:alert(1)", false],
  ["JavaScript:alert(1)", false],
  // Browsers drop tabs, newlines and leading spaces before reading a scheme.
  ["java\tscript:alert(1)", false],
  ["java\nscript:alert(1)", false],
  ["  javascript:alert(1)", false],
  ["data:text/html,<script>alert(1)</script>", false],
  ["vbscript:msgbox(1)", false],
];

let hrefFailures = 0;
const expectHref = (label: string, ok: boolean, detail = "") => {
  if (!ok) hrefFailures += 1;
  console.log(`${ok ? "PASS " : "FAIL "}href ${label}${ok ? "" : `  ${detail}`}`);
};

for (const [href, expected] of hrefCases) {
  const actual = isSafeHref(href);
  expectHref(JSON.stringify(href).slice(0, 40), actual === expected, `(got ${actual}, expected ${expected})`);
}

const withLink = (href: string) => {
  const doc = starterDoc("Test");
  doc.profile.links = [{ id: "l1", label: "Site", href, icon: "globe" }];
  return doc;
};
expectHref("the schema refuses a document with an unsafe link", !portfolioDoc.safeParse(withLink("javascript:alert(1)")).success);
// Stored before the check existed: the link goes, the document still loads.
const repaired = migrate(withLink("javascript:alert(1)"));
expectHref("migrate empties an unsafe stored link", repaired.profile.links[0].href === "", `(got ${repaired.profile.links[0].href})`);
expectHref("migrate leaves a safe link alone", migrate(withLink("https://example.com")).profile.links[0].href === "https://example.com");

const hrefTotal = hrefCases.length + 3;
console.log(`\n${hrefTotal - hrefFailures}/${hrefTotal} link scheme cases passed`);

// ------------------------------------------------------- content security policy
//
// The policy is the thing that makes an XSS bug inert, so what it allows is
// asserted directly rather than trusted to a code review.
let cspFailures = 0;
const expectCsp = (label: string, ok: boolean, detail = "") => {
  if (!ok) cspFailures += 1;
  console.log(`${ok ? "PASS " : "FAIL "}csp ${label}${ok ? "" : `  ${detail}`}`);
};

const directive = (policy: string, name: string) =>
  policy.split("; ").find((d) => d.startsWith(`${name} `))?.slice(name.length + 1).split(" ") ?? [];

const prod = contentSecurityPolicy("abc123", false);
const dev = contentSecurityPolicy("abc123", true);
const prodScripts = directive(prod, "script-src");

expectCsp("scripts need this response's nonce", prodScripts.includes("'nonce-abc123'"), prod);
expectCsp("chunks loaded by trusted script still run", prodScripts.includes("'strict-dynamic'"));
expectCsp("no inline script without a nonce", !prodScripts.includes("'unsafe-inline'"));
expectCsp("no eval in production", !prodScripts.includes("'unsafe-eval'"));
expectCsp("eval only in development, for React's dev build", directive(dev, "script-src").includes("'unsafe-eval'"));
expectCsp("framed only by this origin", directive(prod, "frame-ancestors").join(" ") === "'self'");
expectCsp("no plugins", directive(prod, "object-src").join(" ") === "'none'");
expectCsp("no <base> hijacking", directive(prod, "base-uri").join(" ") === "'self'");
expectCsp("images from this origin only", !directive(prod, "img-src").includes("https:"));

const cspCases = 9;
console.log(`\n${cspCases - cspFailures}/${cspCases} content security policy cases passed`);

// ------------------------------------------------------- portfolio metadata
//
// Every route a portfolio is reached by shares this. A route without it showed
// the app's own title instead of the person's.
let metaFailures = 0;
const expectMeta = (label: string, ok: boolean, detail = "") => {
  if (!ok) metaFailures += 1;
  console.log(`${ok ? "PASS " : "FAIL "}metadata ${label}${ok ? "" : `  ${detail}`}`);
};

const untitled = starterDoc("Ada Lovelace");
untitled.meta = { ...untitled.meta, title: "", description: "", noindex: false };
const fallback = portfolioMetadata(untitled);
const ogTitle = (m: ReturnType<typeof portfolioMetadata>) => (m.openGraph as { title?: unknown } | undefined)?.title;

expectMeta("title falls back to the person's name", fallback.title === "Ada Lovelace — Portfolio", `(got ${String(fallback.title)})`);
expectMeta("never the app's own name", fallback.title !== "Make Your Portfolio");
expectMeta(
  "description falls back to the headline, without markup",
  typeof fallback.description === "string" && fallback.description.length > 0 && !/==|\*\*/.test(fallback.description),
  `(got ${String(fallback.description)})`,
);
expectMeta("link preview uses the same title", ogTitle(fallback) === fallback.title);
expectMeta("indexable unless the owner says otherwise", fallback.robots === undefined);

const titled = portfolioMetadata({ ...untitled, meta: { ...untitled.meta, title: "Ada's work", noindex: true } });
expectMeta("an explicit title is used as written", titled.title === "Ada's work" && ogTitle(titled) === "Ada's work");
expectMeta(
  "noindex reaches robots",
  (titled.robots as { index?: boolean } | undefined)?.index === false,
  `(got ${JSON.stringify(titled.robots)})`,
);

const metaCases = 7;
console.log(`\n${metaCases - metaFailures}/${metaCases} portfolio metadata cases passed`);

// ------------------------------------------------------- released handles
//
// A released handle stays reserved for its previous owner, so nobody else can
// publish at an address that is still printed somewhere.
let handleFailures = 0;
const expectHandle = (label: string, ok: boolean) => {
  if (!ok) handleFailures += 1;
  console.log(`${ok ? "PASS " : "FAIL "}handle ${label}`);
};

const releasedByAda = { userId: "ada", releasedAt: daysAgo(10) };
expectHandle("a handle nobody released is free", !isHandleCoolingDown(null, "bob", NOW));
expectHandle("the person who released it can take it back", !isHandleCoolingDown(releasedByAda, "ada", NOW));
expectHandle("anyone else is refused within 30 days", isHandleCoolingDown(releasedByAda, "bob", NOW));
expectHandle("anyone can claim it after 30 days", !isHandleCoolingDown({ userId: "ada", releasedAt: daysAgo(31) }, "bob", NOW));

const handleCases = 4;
console.log(`\n${handleCases - handleFailures}/${handleCases} released handle cases passed`);

// ------------------------------------------------------- daily domain re-check
//
// One bad DNS lookup must not take a working site offline; consecutive failures
// should.
let recheckFailures = 0;
const expectRecheck = (label: string, ok: boolean, detail = "") => {
  if (!ok) recheckFailures += 1;
  console.log(`${ok ? "PASS " : "FAIL "}recheck ${label}${ok ? "" : `  ${detail}`}`);
};

const verifiedLastWeek = { failedChecks: 0, verifiedAt: daysAgo(7) };
const passed = afterScheduledCheck({ failedChecks: 1, verifiedAt: daysAgo(7) }, true, NOW);
expectRecheck("a pass resets the failure count", passed.verified && passed.failedChecks === 0, JSON.stringify(passed));
expectRecheck(
  "a pass gives domains verified before verifiedAt existed a date",
  afterScheduledCheck({ failedChecks: 0, verifiedAt: null }, true, NOW).verifiedAt?.getTime() === NOW.getTime(),
);
const firstFailure = afterScheduledCheck(verifiedLastWeek, false, NOW);
expectRecheck("one failure keeps the domain up", firstFailure.verified && firstFailure.failedChecks === 1, JSON.stringify(firstFailure));
const secondFailure = afterScheduledCheck(firstFailure, false, NOW);
expectRecheck(
  `${FAILED_CHECKS_BEFORE_UNVERIFY} failures in a row take it offline`,
  !secondFailure.verified && secondFailure.failedChecks === FAILED_CHECKS_BEFORE_UNVERIFY,
  JSON.stringify(secondFailure),
);
expectRecheck("going offline keeps when it last worked", secondFailure.verifiedAt === verifiedLastWeek.verifiedAt);
expectRecheck("the token is stable for a secret", recheckToken("s3cret") === recheckToken("s3cret"));
expectRecheck("and differs between secrets", recheckToken("s3cret") !== recheckToken("other"));

const recheckCases = 7;
console.log(`\n${recheckCases - recheckFailures}/${recheckCases} domain re-check cases passed`);

// ------------------------------------------------------- draft preview links
//
// The token is the only thing standing between a stranger and the draft.
let previewFailures = 0;
const expectPreview = (label: string, ok: boolean, detail = "") => {
  if (!ok) previewFailures += 1;
  console.log(`${ok ? "PASS " : "FAIL "}preview ${label}${ok ? "" : `  ${detail}`}`);
};

const tokenA = newPreviewToken();
const tokenB = newPreviewToken();
expectPreview("a new token has the expected shape", isPreviewToken(tokenA), tokenA);
expectPreview("tokens are not repeated", tokenA !== tokenB);
expectPreview("a short value is not a token", !isPreviewToken("abc"));
expectPreview("a path is not a token", !isPreviewToken("../../etc/passwd"));
expectPreview("a token with a stray character is not a token", !isPreviewToken(`${tokenA.slice(0, 42)}!`));

const previewCases = 5;
console.log(`\n${previewCases - previewFailures}/${previewCases} preview link cases passed`);

// ------------------------------------------------------- published versions
let versionFailures = 0;
const expectVersions = (label: string, ok: boolean, detail = "") => {
  if (!ok) versionFailures += 1;
  console.log(`${ok ? "PASS " : "FAIL "}versions ${label}${ok ? "" : `  ${detail}`}`);
};

const ids = (count: number) => Array.from({ length: count }, (_, i) => `v${i}`);
expectVersions("fewer than the limit prunes nothing", versionsToPrune(ids(5)).length === 0);
expectVersions("exactly the limit prunes nothing", versionsToPrune(ids(VERSIONS_KEPT)).length === 0);
const pruned = versionsToPrune(ids(VERSIONS_KEPT + 2));
expectVersions(
  "past the limit prunes the oldest",
  pruned.join(",") === `v${VERSIONS_KEPT},v${VERSIONS_KEPT + 1}`,
  `(got ${pruned.join(",")})`,
);

const versionCases = 3;
console.log(`\n${versionCases - versionFailures}/${versionCases} published version cases passed`);

// ------------------------------------------------------- uploads
let uploadFailures = 0;
const expectUpload = (label: string, ok: boolean, detail = "") => {
  if (!ok) uploadFailures += 1;
  console.log(`${ok ? "PASS " : "FAIL "}upload ${label}${ok ? "" : `  ${detail}`}`);
};

expectUpload("a wide image gets every width", renditionWidths(3000).join() === "400,800,1600", renditionWidths(3000).join());
expectUpload("a mid-size image stops at its own width", renditionWidths(1000).join() === "400,800,1000", renditionWidths(1000).join());
expectUpload("a small image is never upscaled", renditionWidths(300).join() === "300", renditionWidths(300).join());

const still = resolveAsset({ id: "abc", siteId: "s1", width: 1600, height: 900, variants: { widths: [400, 800, 1600], animated: false, video: false } });
expectUpload("a still resolves to its largest webp", still.src === "/assets/s1/abc-1600.webp", still.src);
expectUpload("with a srcset of every width", still.srcSet === "/assets/s1/abc-400.webp 400w, /assets/s1/abc-800.webp 800w, /assets/s1/abc-1600.webp 1600w", still.srcSet);

const gif = resolveAsset({ id: "g1", siteId: "s1", width: 800, height: 600, variants: { widths: [400, 800], animated: true, video: true } });
expectUpload(
  "an animated upload plays as webp, with its video and poster",
  gif.src === "/assets/s1/g1-anim.webp" && gif.video === "/assets/s1/g1.mp4" && gif.poster === "/assets/s1/g1-800.webp",
  JSON.stringify(gif),
);
const gifNoVideo = resolveAsset({ id: "g2", siteId: "s1", width: 800, height: 600, variants: { widths: [800], animated: true, video: false } });
expectUpload("without ffmpeg there is no video to point at", gifNoVideo.video === undefined);

const assetPathCases: [string[], boolean][] = [
  [["s1", "abc-400.webp"], true],
  [["s1", "abc-anim.webp"], true],
  [["s1", "abc.mp4"], true],
  [["..", "abc-400.webp"], false],
  [["s1", "..%2Fsecret.webp"], false],
  [["s1", "abc.svg"], false],
  [["s1", "sub", "abc.webp"], false],
  [["S1", "abc-400.webp"], false],
];
for (const [segments, expected] of assetPathCases) {
  expectUpload(`path ${segments.join("/")}`, isSafeAssetPath(segments) === expected);
}

expectUpload("an upload that fits the quota is allowed", quotaProblem({ count: 3, bytes: 1024 }, 2048) === null);
expectUpload("the 101st file is refused", quotaProblem({ count: ASSET_LIMITS.assetsPerSite, bytes: 0 }, 1) !== null);
expectUpload("going past 200 MB is refused", quotaProblem({ count: 1, bytes: ASSET_LIMITS.bytesPerSite }, 1) !== null);

const docUsingAsset = { profile: { avatarAssetId: "abc123" } };
expectUpload("a document using the asset counts", documentsUseAsset([null, docUsingAsset], "abc123"));
expectUpload("a longer id containing it doesn't", !documentsUseAsset([docUsingAsset], "abc"));

const uploadCases = 7 + assetPathCases.length + 5;
console.log(`\n${uploadCases - uploadFailures}/${uploadCases} upload cases passed`);

// ------------------------------------------------------- search and sharing
let seoFailures = 0;
const expectSeo = (label: string, ok: boolean, detail = "") => {
  if (!ok) seoFailures += 1;
  console.log(`${ok ? "PASS " : "FAIL "}seo ${label}${ok ? "" : `  ${detail}`}`);
};
const ogImages = (m: ReturnType<typeof portfolioMetadata>) =>
  ((m.openGraph as { images?: { url: string }[] } | undefined)?.images ?? []).map((i) => i.url);

const shareAssets = { og1: { src: "/assets/s1/og1-1600.webp", width: 1600, height: 840 } };
expectSeo("no card and no upload means no image", ogImages(portfolioMetadata(untitled)).length === 0);
expectSeo(
  "the generated card is the default image",
  ogImages(portfolioMetadata(untitled, { cardPath: "/u/ada/og" })).join() === "/u/ada/og",
);
const withUpload = { ...untitled, meta: { ...untitled.meta, ogAssetId: "og1" } };
expectSeo(
  "an uploaded share image replaces the card",
  ogImages(portfolioMetadata(withUpload, { cardPath: "/u/ada/og", assets: shareAssets })).join() === "/assets/s1/og1-1600.webp",
);
expectSeo(
  "a share image that no longer exists falls back to the card",
  ogImages(portfolioMetadata(withUpload, { cardPath: "/u/ada/og", assets: {} })).join() === "/u/ada/og",
);
const absoluteCard = ogImages(portfolioMetadata(untitled, { cardPath: "/u/ada/og", origin: "https://app.example" })).join();
expectSeo("with an origin the image URL is absolute", absoluteCard === "https://app.example/u/ada/og", absoluteCard);

const person = starterDoc("Ada Lovelace");
person.profile = {
  ...person.profile,
  headline: "I build ==analytical== engines",
  avatarAssetId: "og1",
  links: [
    { id: "a", label: "Site", href: "https://ada.example", icon: "globe" },
    { id: "b", label: "Mail", href: "mailto:ada@example.com", icon: "globe" },
  ],
};
const ld = personJsonLd(person, shareAssets, "https://app.example");
expectSeo("structured data names the person", ld["@type"] === "Person" && ld.name === "Ada Lovelace");
expectSeo("its description has no emphasis markers", ld.description === "I build analytical engines", String(ld.description));
expectSeo("only web links become sameAs", JSON.stringify(ld.sameAs) === '["https://ada.example"]', JSON.stringify(ld.sameAs));
expectSeo("the portrait is absolute", ld.image === "https://app.example/assets/s1/og1-1600.webp", String(ld.image));
expectSeo("without an origin there is no image", !("image" in personJsonLd(person, shareAssets, null)));
expectSeo(
  "no value can close the script tag",
  !jsonForScript({ name: "</script><script>alert(1)</script>" }).includes("</script>"),
);

const published = new Date("2026-09-01T00:00:00Z");
const hiddenDoc = { ...untitled, meta: { ...untitled.meta, noindex: true } };
const entries = portfolioSitemapEntries(
  [
    { subdomain: "ada", publishedAt: published, publishedDoc: untitled },
    { subdomain: "hidden", publishedAt: published, publishedDoc: hiddenDoc },
    { subdomain: "draft", publishedAt: null, publishedDoc: null },
    { subdomain: "broken", publishedAt: published, publishedDoc: { nonsense: true } },
  ],
  "https://app.example",
);
expectSeo(
  "the sitemap lists only indexable published pages",
  entries.map((e) => e.url).join() === "https://app.example/u/ada",
  entries.map((e) => e.url).join(),
);
expectSeo("with their publish date", entries[0]?.lastModified === published);

const seoCases = 13;
console.log(`\n${seoCases - seoFailures}/${seoCases} search and sharing cases passed`);

// ------------------------------------------------------- contact form
let contactFailures = 0;
const expectContact = (label: string, ok: boolean, detail = "") => {
  if (!ok) contactFailures += 1;
  console.log(`${ok ? "PASS " : "FAIL "}contact ${label}${ok ? "" : `  ${detail}`}`);
};
const validMessage = { siteId: "s1", name: " Ada ", email: "ada@example.com", message: "Hello\r\nthere" };
const accepted = parseContact(validMessage);
expectContact(
  "a normal message is accepted, trimmed, with newlines normalised",
  accepted.ok && accepted.data.name === "Ada" && accepted.data.message === "Hello\nthere" && !accepted.spam,
  JSON.stringify(accepted),
);
expectContact("a name is optional", parseContact({ ...validMessage, name: "" }).ok);
expectContact("an email address is required", !parseContact({ ...validMessage, email: "" }).ok);
expectContact("an address can't smuggle mailto parameters", !parseContact({ ...validMessage, email: "a@b.com?cc=x@y.com" }).ok);
expectContact("a name can't carry a mail header", !parseContact({ ...validMessage, name: "Ada\nBcc: x@y.com" }).ok);
expectContact("an empty message is refused", !parseContact({ ...validMessage, message: "   " }).ok);
expectContact(
  "an over-long message is refused",
  !parseContact({ ...validMessage, message: "x".repeat(CONTACT_LIMITS.message + 1) }).ok,
);
const trapped = parseContact({ ...validMessage, website: "https://spam.example" });
expectContact("a filled-in honeypot is flagged as spam", trapped.ok && trapped.spam);
expectContact("something that isn't an object is refused", !parseContact("hello").ok && !parseContact(null).ok);

const contactCases = 9;
console.log(`\n${contactCases - contactFailures}/${contactCases} contact form cases passed`);

// ------------------------------------------------------- github import
let githubFailures = 0;
const expectGithub = (label: string, ok: boolean, detail = "") => {
  if (!ok) githubFailures += 1;
  console.log(`${ok ? "PASS " : "FAIL "}github ${label}${ok ? "" : `  ${detail}`}`);
};

expectGithub("a plain username", normalizeUsername(" octocat ") === "octocat");
expectGithub(
  "an @handle or a profile URL",
  normalizeUsername("@octocat") === "octocat" && normalizeUsername("https://github.com/octocat/") === "octocat",
);
expectGithub(
  "nothing that could reach another endpoint",
  normalizeUsername("octocat/../../orgs/x") === null && normalizeUsername("a?per_page=1") === null && normalizeUsername("a%2Fb") === null,
);
expectGithub(
  "hyphens only between characters",
  normalizeUsername("-bad") === null && normalizeUsername("bad-") === null && normalizeUsername("a--b") === null,
);
expectGithub("at most 39 characters", normalizeUsername("a".repeat(39)) !== null && normalizeUsername("a".repeat(40)) === null);

const repo = (over: Partial<GithubRepo>): GithubRepo => ({
  name: "r", description: "", fork: false, archived: false, stars: 0,
  pushedAt: "2026-01-01T00:00:00Z", createdAt: "2024-03-01T00:00:00Z",
  language: "", topics: [], homepage: "", htmlUrl: "https://github.com/a/r", ...over,
});
const picked = pickRepos(
  [
    repo({ name: "fork", fork: true, stars: 99 }),
    repo({ name: "old", stars: 5, pushedAt: "2025-01-01T00:00:00Z" }),
    repo({ name: "new", stars: 5, pushedAt: "2026-06-01T00:00:00Z" }),
    repo({ name: "top", stars: 50 }),
  ],
  3,
);
expectGithub("forks skipped, most starred first, then latest push", picked.map((r) => r.name).join() === "top,new,old", picked.map((r) => r.name).join());
expectGithub("six at most", pickRepos(Array.from({ length: 10 }, (_, i) => repo({ name: `r${i}` }))).length === 6);

const mapped = repoToProject(
  repo({ name: "engine", description: "Analytical", language: "TypeScript", topics: ["typescript", "nextjs"], homepage: "https://engine.example" }),
  "p1",
);
expectGithub("a homepage is the link, and the project is live", mapped.href === "https://engine.example" && mapped.status === "live");
expectGithub("language and topics become tech, once each", mapped.tech.join() === "TypeScript,nextjs", mapped.tech.join());
expectGithub("the year it was created", mapped.year === "2024" && mapped.title === "engine" && mapped.summary === "Analytical");
const bare = repoToProject(repo({ homepage: "engine.example", archived: true }), "p2");
expectGithub("a homepage without a scheme falls back to the repository", bare.href === "https://github.com/a/r", String(bare.href));
expectGithub("archived stays archived", bare.status === "archived");
expectGithub(
  "a javascript: URL is never a link",
  repoToProject(repo({ homepage: "javascript:alert(1)", htmlUrl: "javascript:alert(1)" }), "p3").href === undefined,
);
expectGithub(
  "junk in the response is dropped",
  toRepo({ name: 3 }) === null && toRepo(null) === null &&
    toRepo({ name: "x", html_url: "https://github.com/a/x", topics: [1, "ok"] })?.topics.join() === "ok",
);

const githubCases = 13;
console.log(`\n${githubCases - githubFailures}/${githubCases} github import cases passed`);

// ------------------------------------------------------- html export
let exportFailures = 0;
const expectExport = (label: string, ok: boolean, detail = "") => {
  if (!ok) exportFailures += 1;
  console.log(`${ok ? "PASS " : "FAIL "}export ${label}${ok ? "" : `  ${detail}`}`);
};

const forExport = starterDoc("Ada Lovelace");
forExport.design = {
  ...forExport.design,
  tokens: { ...forExport.design.tokens, motion: "rise" },
  nav: { ...forExport.design.nav, variant: "hamburger-overlay", mobileBehavior: "hamburger", showThemeToggle: true },
};
const exported = exportDoc(forExport);
expectExport("motion is off, so nothing waits for JavaScript to appear", exported.design.tokens.motion === "none");
expectExport(
  "no control that needs JavaScript",
  !exported.design.nav.showThemeToggle && exported.design.nav.variant === "top-static" && exported.design.nav.mobileBehavior === "wrap",
  JSON.stringify(exported.design.nav),
);
const scrolling = exportDoc({ ...forExport, design: { ...forExport.design, nav: { ...forExport.design.nav, mobileBehavior: "scroll" } } });
expectExport("other mobile nav behaviours are kept", scrolling.design.nav.mobileBehavior === "scroll");
expectExport("the file name is the handle, and only the handle", exportFileName('ada"; x') === "portfolio-adax.html", exportFileName('ada"; x'));

const stripped = stripScripts(
  '<head><link rel="preload" as="script" href="/_next/a.js"/><link rel="icon" href="/favicon.ico"/>' +
    '<link rel="stylesheet" href="/_next/static/a.css" nonce="abc"/><script nonce="abc">self.__next_f.push(1)</script>' +
    '<script src="/_next/static/b.js" async=""></script></head>',
);
expectExport(
  "scripts, their preloads, icons and nonces are removed; stylesheets stay",
  !/<script|preload|favicon|nonce/.test(stripped) && stripped.includes('rel="stylesheet"'),
  stripped,
);

const requested: string[] = [];
const files: Record<string, { body: string; type: string }> = {
  "/_next/static/chunks/a.css": {
    body: '@font-face{src:url("../media/f.woff2")}body{background:url(data:image/png;base64,AA==)}.x{content:"</style><script>"}',
    type: "text/css; charset=utf-8",
  },
  "/_next/static/media/f.woff2": { body: "font", type: "font/woff2" },
  "/assets/s1/a-1600.webp": { body: "image", type: "image/webp" },
  "/assets/s1/v.mp4": { body: "video", type: "video/mp4" },
  "/assets/s1/v-800.webp": { body: "poster", type: "image/webp" },
};
const fakeLoad = async (path: string) => {
  requested.push(path);
  const file = files[path];
  return file ? { body: new TextEncoder().encode(file.body), type: file.type } : null;
};
const page =
  '<html><head><link rel="stylesheet" href="/_next/static/chunks/a.css" data-precedence="x"/><script>alert(1)</script></head><body>' +
  '<img src="/assets/s1/a-1600.webp" srcSet="/assets/s1/a-400.webp 400w, /assets/s1/a-1600.webp 1600w" alt=""/>' +
  '<img src="/assets/s1/a-1600.webp" alt=""/>' +
  '<video src="/assets/s1/v.mp4" poster="/assets/s1/v-800.webp"></video>' +
  '<a href="https://ada.example">site</a><img src="https://elsewhere.example/x.png" alt=""/></body></html>';

// Async, and this file runs as CommonJS: no top-level await, so the rest of the
// run finishes inside this function.
async function exportInlineCases() {
  const result = await inlineExport(page, fakeLoad);
  const out = result.ok ? result.html : "";
  // The escaped `<\/style><script>` inside the CSS string is text, not an element.
  expectExport("no script survives", result.ok && !/<script\b/i.test(out.replace(/<\\\/style><script>/, "")), out.slice(0, 200));
  expectExport("the stylesheet is inlined", !out.includes('rel="stylesheet"') && out.includes("<style>@font-face"));
  expectExport(
    "fonts resolve against the stylesheet and are embedded",
    requested.includes("/_next/static/media/f.woff2") && out.includes("data:font/woff2;base64,"),
    requested.join(),
  );
  expectExport(
    "a data: URI in the CSS is left alone and never fetched",
    out.includes("url(data:image/png;base64,AA==)") && !requested.some((p) => p.startsWith("data:")),
  );
  expectExport("nothing in a stylesheet can end the <style> element", !out.includes('"</style><script>"'));
  expectExport(
    "images, videos and posters are embedded; srcset is dropped",
    out.includes('src="data:image/webp;base64,') && out.includes('src="data:video/mp4;base64,') &&
      out.includes('poster="data:image/webp;base64,') && !/srcset/i.test(out),
  );
  expectExport("each file is fetched once", requested.filter((p) => p === "/assets/s1/a-1600.webp").length === 1);
  expectExport(
    "other hosts are neither fetched nor changed",
    !requested.some((p) => p.includes("elsewhere")) &&
      out.includes('src="https://elsewhere.example/x.png"') && out.includes('href="https://ada.example"'),
  );
  const tooBig = await inlineExport(page, fakeLoad, 10);
  expectExport("an export past the size cap is refused", !tooBig.ok);
}

void exportInlineCases().then(() => {
  const exportCases = 14;
  console.log(`\n${exportCases - exportFailures}/${exportCases} html export cases passed`);

  process.exit(failures + subFailures + pathFailures + dynFailures + domainFailures + limitFailures + hrefFailures + cspFailures + metaFailures + handleFailures + recheckFailures + previewFailures + versionFailures + uploadFailures + seoFailures + contactFailures + githubFailures + exportFailures ? 1 : 0);
});
