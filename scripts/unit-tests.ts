import { readFileSync } from "node:fs";
import { resolveHost, normalizeHost } from "../src/lib/hosts";
import { validateSubdomain, normalizeSubdomain } from "../src/lib/reserved-subdomains";

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
  // The public demo portfolios live at /u/<preset>, so those handles are ours.
  ["editorial", "reserved"],
  ["brutalist", "reserved"],
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
process.exit(failures + subFailures + pathFailures ? 1 : 0);
