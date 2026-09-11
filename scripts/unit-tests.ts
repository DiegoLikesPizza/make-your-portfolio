import { readFileSync } from "node:fs";
import { resolveHost, normalizeHost } from "../src/lib/hosts";
import { validateSubdomain, normalizeSubdomain } from "../src/lib/reserved-subdomains";
import { resolveText, resolveDynamic } from "../src/lib/dynamic";
import { hasOwnershipToken, ownershipRecord } from "../src/lib/dns";
import { isStaleClaim } from "../src/lib/domain-claims";
import { clientIp, describeWait, rateLimit } from "../src/lib/rate-limit";
import { normalizeSource } from "../src/lib/analytics";
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

process.exit(failures + subFailures + pathFailures + dynFailures + domainFailures + limitFailures ? 1 : 0);
