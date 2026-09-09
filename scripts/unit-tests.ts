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
process.exit(failures + subFailures ? 1 : 0);
