import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { portfolioDoc } from "../src/lib/schema/portfolio";
import { demoDoc, DEMO_HANDLES } from "../src/lib/fixtures/demo";

/**
 * Publishes one demo portfolio per preset.
 *
 * Safe to re-run: every site is upserted by handle and the documents are
 * rebuilt from the fixture each time, so this is also how you *update* the
 * demos after changing a preset or a layout.
 *
 * The demos belong to their own account rather than to a real user. Two
 * reasons: deleting a real account cascades to its sites, and nobody should be
 * able to edit the public demos by signing in as themselves. That account has
 * no sign-in method attached — it exists to own rows.
 *
 *   npm run seed:demos
 */
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const OWNER_EMAIL = "demos@invalid.local";

async function main() {
  const owner = await db.user.upsert({
    where: { email: OWNER_EMAIL },
    update: {},
    create: { email: OWNER_EMAIL, name: "Demo portfolios" },
  });

  for (const handle of DEMO_HANDLES) {
    // Validated here rather than trusted: these go straight to `publishedDoc`,
    // skipping the editor and the publish endpoint that would normally check.
    const doc = portfolioDoc.parse(demoDoc(handle));
    const json = doc as unknown as object;

    const existing = await db.site.findUnique({
      where: { subdomain: handle },
      select: { userId: true },
    });

    // Never overwrite a real person's site, however unlikely the collision.
    if (existing && existing.userId !== owner.id) {
      console.log(`SKIP  /u/${handle} — already owned by another account`);
      continue;
    }

    const site = await db.site.upsert({
      where: { subdomain: handle },
      update: { draftDoc: json, publishedDoc: json, publishedAt: new Date() },
      create: {
        userId: owner.id,
        subdomain: handle,
        draftDoc: json,
        publishedDoc: json,
        publishedAt: new Date(),
      },
    });

    console.log(`OK    /u/${site.subdomain}  (${doc.sections.length} sections, hero ${doc.hero.variant})`);
  }

  console.log(`\n${DEMO_HANDLES.length} demo portfolios published.`);
  console.log("If the app is running, restart it or publish once — cached misses for these");
  console.log("handles are not dropped by a write made outside the app.");
}

main()
  .finally(() => db.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
