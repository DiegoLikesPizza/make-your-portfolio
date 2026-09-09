import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * One Prisma client per process.
 *
 * Next's dev server reloads modules on every edit; without the global cache
 * that means a new connection pool each time until Postgres refuses more.
 *
 * Prisma 7 requires an explicit driver adapter — `pg` here, so the same client
 * works against a local `prisma dev` server, a native Postgres install, or a
 * managed one, with only DATABASE_URL changing.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function create() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

export const db = globalForPrisma.prisma ?? create();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
