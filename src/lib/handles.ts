/**
 * How long a released handle stays reserved.
 *
 * A handle is released by renaming, deleting the site, or deleting the account.
 * If it changed hands the same second, a stranger could publish a page at an
 * address that is already printed on the previous owner's CV or in their email
 * signature. Thirty days is long enough for that person to notice and come back
 * for it, and short enough that a genuinely abandoned name frees up again.
 */
export const HANDLE_COOLDOWN_DAYS = 30;

const DAY_MS = 86_400_000;

export type HandleRelease = { userId: string; releasedAt: Date };

/** Is the handle still reserved for whoever released it — someone other than `userId`? */
export function isHandleCoolingDown(release: HandleRelease | null, userId: string, now: Date = new Date()): boolean {
  if (!release || release.userId === userId) return false;
  return now.getTime() - release.releasedAt.getTime() < HANDLE_COOLDOWN_DAYS * DAY_MS;
}
