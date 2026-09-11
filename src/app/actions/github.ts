"use server";

import { nanoid } from "nanoid";
import { requireSiteOwner } from "@/lib/auth";
import { fetchPublicRepos, normalizeUsername, reposToProjects, type ProjectItem } from "@/lib/github";
import { describeWait, LIMITS, rateLimit } from "@/lib/rate-limit";

export type GithubImportResult = { ok: true; projects: ProjectItem[] } | { ok: false; error: string };

/**
 * A GitHub user's top public repositories, as projects.
 *
 * Returns them rather than writing the draft: the editor has the draft open and
 * autosaves it, so a server-side write would be overwritten by — or conflict
 * with — its next save. The editor applies the projects like any other edit,
 * and nothing is published.
 */
export async function importGithubProjects(siteId: string, rawUsername: string): Promise<GithubImportResult> {
  const owned = await requireSiteOwner(siteId);
  if (!owned) return { ok: false, error: "Not found." };

  const username = normalizeUsername(rawUsername);
  if (!username) return { ok: false, error: "That isn't a GitHub username." };

  // Every import is a request on the server's shared GitHub allowance.
  const allowed = rateLimit(`github:${owned.user.id}`, LIMITS.githubImportPerUser);
  if (!allowed.ok) return { ok: false, error: `Too many imports. Try again in ${describeWait(allowed.retryAfterMs)}.` };

  const result = await fetchPublicRepos(username);
  if (!result.ok) return result;

  const projects = reposToProjects(result.repos, () => nanoid(8));
  if (projects.length === 0) return { ok: false, error: `${username} has no public repositories of their own.` };
  return { ok: true, projects };
}
