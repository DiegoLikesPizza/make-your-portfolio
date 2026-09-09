import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { diegoDoc } from "../src/lib/fixtures/diego";
import { DEV_USER_EMAIL } from "../src/lib/constants";

/**
 * Seeds the development user and one site holding the reference document.
 *
 * The site is seeded as a *draft only* — `publishedDoc` stays null — so the
 * first thing you exercise in the editor is the publish path rather than
 * quietly starting from a published state.
 */
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const user = await db.user.upsert({
    where: { email: DEV_USER_EMAIL },
    update: {},
    create: { email: DEV_USER_EMAIL, name: "Dev User" },
  });

  const site = await db.site.upsert({
    where: { subdomain: "demo" },
    update: {},
    create: {
      userId: user.id,
      subdomain: "demo",
      draftDoc: diegoDoc as unknown as object,
    },
  });

  console.log(`seeded user ${user.email} and site /${site.subdomain} (${site.id})`);
}

main()
  .finally(() => db.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
