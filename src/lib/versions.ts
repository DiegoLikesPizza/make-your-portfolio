/**
 * Published versions kept per site.
 *
 * Enough to undo a bad week of edits; few enough that a site published many
 * times a day doesn't grow the table without bound.
 */
export const VERSIONS_KEPT = 20;

/** The versions to delete, given every version's id newest first. */
export function versionsToPrune(idsNewestFirst: string[], keep: number = VERSIONS_KEPT): string[] {
  return idsNewestFirst.slice(keep);
}
