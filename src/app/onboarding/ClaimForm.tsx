"use client";

import { useActionState, useState } from "react";
import { claimSubdomain, type ClaimState } from "@/app/actions/onboarding";
import { normalizeSubdomain, validateSubdomain, SUBDOMAIN_MESSAGES } from "@/lib/reserved-subdomains";

/**
 * Claiming the subdomain.
 *
 * The same validator runs here and in the server action — this one just saves a
 * round trip; the action is what actually decides.
 */
export function ClaimForm({ domain, suggestion }: { domain: string; suggestion: string }) {
  const [state, action, pending] = useActionState<ClaimState, FormData>(claimSubdomain, {});
  const [value, setValue] = useState(suggestion);

  const normalized = normalizeSubdomain(value);
  const localProblem = value ? validateSubdomain(normalized) : null;
  const message = localProblem ? SUBDOMAIN_MESSAGES[localProblem] : state.error;

  return (
    <form action={action} className="mt-8">
      <div className="flex items-stretch overflow-hidden rounded-lg border border-neutral-300 focus-within:border-neutral-900 dark:border-neutral-700 dark:focus-within:border-white">
        <input
          name="subdomain"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="yourname"
          className="min-w-0 flex-1 bg-white px-4 py-3 text-neutral-900 outline-none dark:bg-neutral-950 dark:text-white"
        />
        <span className="flex shrink-0 items-center bg-neutral-100 px-3 text-sm text-neutral-500 dark:bg-neutral-900">
          .{domain}
        </span>
      </div>

      {message && (
        <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || Boolean(localProblem) || !normalized}
        className="mt-4 w-full rounded-lg bg-neutral-900 px-4 py-3 font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-40 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        {pending ? "Creating your site…" : "Create my portfolio"}
      </button>
    </form>
  );
}
