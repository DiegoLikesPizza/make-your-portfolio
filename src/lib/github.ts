import type { Section } from "@/lib/schema/sections";

/**
 * A GitHub user's public repositories, as portfolio projects.
 *
 * The server only ever connects to api.github.com. A username is validated
 * against GitHub's own rules and becomes one segment of a fixed URL, and
 * redirects are not followed, so nothing a user types can choose where the
 * request goes.
 */

export type ProjectItem = Extract<Section, { type: "projects" }>["data"]["items"][number];

export type GithubRepo = {
  name: string;
  description: string;
  fork: boolean;
  archived: boolean;
  stars: number;
  pushedAt: string;
  createdAt: string;
  language: string;
  topics: string[];
  homepage: string;
  htmlUrl: string;
};

/** How many repositories an import turns into projects. */
export const IMPORTED_PROJECTS = 6;

const TIMEOUT_MS = 8000;

/** GitHub's rules: 1–39 letters, digits or single hyphens, not starting or ending with one. */
const USERNAME = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

/** `octocat`, `@octocat` or `https://github.com/octocat` → `octocat`; null if it isn't one. */
export function normalizeUsername(raw: string): string | null {
  const value = raw.trim().replace(/^@/, "").replace(/^(?:https?:\/\/)?(?:www\.)?github\.com\//i, "").replace(/\/+$/, "");
  return USERNAME.test(value) ? value : null;
}

const str = (value: unknown) => (typeof value === "string" ? value : "");

/** One entry of the API response, or null when it isn't shaped like a repository. */
export function toRepo(raw: unknown): GithubRepo | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (!str(r.name) || !str(r.html_url)) return null;
  return {
    name: str(r.name),
    description: str(r.description),
    fork: r.fork === true,
    archived: r.archived === true,
    stars: typeof r.stargazers_count === "number" ? r.stargazers_count : 0,
    pushedAt: str(r.pushed_at),
    createdAt: str(r.created_at),
    language: str(r.language),
    topics: Array.isArray(r.topics) ? r.topics.filter((t): t is string => typeof t === "string") : [],
    homepage: str(r.homepage),
    htmlUrl: str(r.html_url),
  };
}

/** Their own work only — forks are skipped — most starred first, then most recently pushed. */
export function pickRepos(repos: GithubRepo[], count = IMPORTED_PROJECTS): GithubRepo[] {
  return repos
    .filter((repo) => !repo.fork)
    .sort((a, b) => b.stars - a.stars || b.pushedAt.localeCompare(a.pushedAt))
    .slice(0, count);
}

const isWebUrl = (value: string) => /^https?:\/\/[^\s]+$/i.test(value) && value.length <= 2000;

export function repoToProject(repo: GithubRepo, id: string): ProjectItem {
  // A homepage is where the thing can be seen; the repository is the fallback.
  // Only absolute http(s) — a bare "example.com" would become a relative link.
  const live = isWebUrl(repo.homepage);
  // The language is usually also a topic, in different case: keep the first spelling.
  const tech = [repo.language, ...repo.topics]
    .filter((t, i, all) => t && all.findIndex((other) => other.toLowerCase() === t.toLowerCase()) === i)
    .map((t) => t.slice(0, 40))
    .slice(0, 12);

  return {
    id,
    title: repo.name.slice(0, 300),
    summary: repo.description.slice(0, 5000),
    tech,
    ...(/^\d{4}/.test(repo.createdAt) && { year: repo.createdAt.slice(0, 4) }),
    status: repo.archived ? "archived" : live ? "live" : "none",
    ...(live ? { href: repo.homepage } : isWebUrl(repo.htmlUrl) && { href: repo.htmlUrl }),
    featured: false,
  };
}

export function reposToProjects(repos: GithubRepo[], makeId: () => string): ProjectItem[] {
  return pickRepos(repos).map((repo) => repoToProject(repo, makeId()));
}

export type GithubReposResult = { ok: true; repos: GithubRepo[] } | { ok: false; error: string };

export async function fetchPublicRepos(username: string): Promise<GithubReposResult> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "make-your-portfolio",
  };
  // Optional: without it GitHub allows 60 requests an hour for the whole server.
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  let response: Response;
  try {
    response = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?type=owner&sort=pushed&per_page=100`,
      { headers, redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) },
    );
  } catch {
    return { ok: false, error: "GitHub didn't answer. Try again in a moment." };
  }

  if (response.status === 404) return { ok: false, error: `There's no GitHub account called ${username}.` };
  if (response.status >= 300 && response.status < 400) {
    return { ok: false, error: "That account has been renamed. Use its current username." };
  }
  if (response.status === 403 || response.status === 429) {
    return { ok: false, error: "GitHub's rate limit is used up for now. Try again later." };
  }
  if (!response.ok) return { ok: false, error: "GitHub didn't answer properly. Try again in a moment." };

  const body: unknown = await response.json().catch(() => null);
  if (!Array.isArray(body)) return { ok: false, error: "GitHub didn't answer properly. Try again in a moment." };
  return { ok: true, repos: body.map(toRepo).filter((repo): repo is GithubRepo => repo !== null) };
}
