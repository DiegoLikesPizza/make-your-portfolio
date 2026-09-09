/**
 * Renders every section type under every preset, plus every nav and hero
 * variant, and reports any that fail to render.
 *
 *   npm run dev   (port 3100)
 *   node scripts/sweep-check.mjs
 */
const base = "http://localhost:3100/dev/sweep";

const TYPES = ["about", "capabilities", "projects", "experience", "education", "skills", "gallery", "testimonials", "stats", "text", "contact"];
const PRESETS = ["editorial", "minimal", "serif", "gradient", "terminal", "brutalist"];
const NAVS = ["top-fixed", "top-static", "side-left-rail", "side-floating-pill", "bottom-dock", "dot-rail", "hamburger-overlay", "none"];
const HEROES = ["split-left", "centered-stack", "full-bleed-background", "portrait-side", "oversized-type", "terminal-prompt", "image-right-split", "minimal-line"];

let failures = 0;
let checks = 0;

async function check(label, url) {
  checks += 1;
  const res = await fetch(url);
  if (res.status !== 200) {
    failures += 1;
    console.log(`FAIL ${label}  — status ${res.status}`);
  }
}

for (const type of TYPES) {
  for (const preset of PRESETS) {
    await check(`${type} @ ${preset}`, `${base}?type=${type}&preset=${preset}`);
  }
}
for (const nav of NAVS) await check(`nav ${nav}`, `${base}?type=projects&nav=${nav}`);
for (const hero of HEROES) await check(`hero ${hero}`, `${base}?type=projects&hero=${hero}`);

console.log(`\n${checks - failures}/${checks} render checks passed`);
process.exit(failures ? 1 : 0);
