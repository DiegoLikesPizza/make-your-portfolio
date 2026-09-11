import { db } from "@/lib/db";
import { isHandleCoolingDown } from "@/lib/handles";

/**
 * Released handles, in the database. The rule itself lives in handles.ts, where
 * it can be tested without one.
 */

/** Reserve `subdomain` for `userId`, who has just given it up. */
export async function releaseHandle(subdomain: string, userId: string) {
  await db.releasedHandle.upsert({
    where: { subdomain },
    create: { subdomain, userId },
    update: { userId, releasedAt: new Date() },
  });
}

/** True while someone other than `userId` holds a reservation on `subdomain`. */
export async function isReservedForSomeoneElse(subdomain: string, userId: string) {
  const release = await db.releasedHandle.findUnique({ where: { subdomain } });
  return isHandleCoolingDown(release, userId);
}

/** A handle that is in use again has nothing left to reserve. */
export async function clearRelease(subdomain: string) {
  await db.releasedHandle.deleteMany({ where: { subdomain } });
}
