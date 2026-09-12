import http from "node:http";

/**
 * The ways a published site can be reached, checked together.
 *
 * A regression here is silent — the editor keeps working while every public URL
 * 404s — so it gets its own test.
 *
 * Raw http rather than fetch: undici refuses to send a custom Host header, and
 * Host is the entire point of these assertions.
 */
const PORT = 3100;

function request(path, host) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: "127.0.0.1", port: PORT, path, method: "GET", headers: host ? { Host: host } : {} },
      (res) => {
        res.resume();
        res.on("end", () => resolve(res.statusCode));
      },
    );
    req.on("error", reject);
    req.end();
  });
}

let fail = 0;
let total = 0;
async function check(label, path, host, want) {
  const status = await request(path, host);
  const ok = status === want;
  total += 1;
  if (!ok) fail += 1;
  console.log(`${ok ? "PASS " : "FAIL "}${label.padEnd(34)} ${status}${ok ? "" : ` (expected ${want})`}`);
}

await check("path /u/demo", "/u/demo", null, 200);
await check("share card /u/demo/og", "/u/demo/og", null, 200);
await check("path /u/nobody", "/u/nobody", null, 404);
await check("demo /d/editorial", "/d/editorial", null, 200);
await check("demo /d/nobody", "/d/nobody", null, 404);
// Signed out, the admin page sends you to sign in instead of rendering.
await check("admin needs a session", "/admin", null, 307);
await check("app domain root", "/", "example.localhost", 200);
await check("app subdomain is the app", "/", "demo.example.localhost", 200);
await check("unknown custom domain", "/", "not-connected.test", 404);
await check("LAN IP is the app", "/", "192.168.178.69:3100", 200);

console.log(`\n${total - fail}/${total} route checks passed`);
process.exit(fail ? 1 : 0);
