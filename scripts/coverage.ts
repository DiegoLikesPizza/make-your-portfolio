import { SECTION_VARIANTS, type SectionType } from "../src/lib/schema/sections";
import { implementedVariants } from "../src/variants/registry";

/** Prints the variant catalog backlog: planned vs built, per section type. */
let planned = 0;
let built = 0;

for (const type of Object.keys(SECTION_VARIANTS) as SectionType[]) {
  const all = SECTION_VARIANTS[type];
  const have = new Set<string>(implementedVariants(type));
  const missing = all.filter((v) => !have.has(v));
  planned += all.length;
  built += have.size;
  const mark = missing.length === 0 ? "OK  " : "TODO";
  console.log(`${mark} ${type.padEnd(13)} ${String(have.size).padStart(2)}/${all.length}${missing.length ? "   missing: " + missing.join(", ") : ""}`);
}

console.log(`\n${built}/${planned} section variants built`);
