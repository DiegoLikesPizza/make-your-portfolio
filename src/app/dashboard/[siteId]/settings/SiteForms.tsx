"use client";

import { useActionState, useTransition, useState } from "react";
import { deleteSite, renameHandle, unpublishSite, type SiteState } from "@/app/actions/site";
import { formatDateTime } from "@/lib/dates";

const inputClass =
  "mt-2 w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-neutral-900 outline-none " +
  "placeholder:text-neutral-400 focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 " +
  "dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-white";

const primaryButton =
  "rounded-lg bg-neutral-900 px-5 py-2 text-sm font-medium text-white disabled:opacity-40 dark:bg-white dark:text-neutral-900";

function Result({ state }: { state: SiteState }) {
  if (state.error) {
    return (
      <span role="alert" className="text-sm text-red-600 dark:text-red-400">
        {state.error}
      </span>
    );
  }
  if (state.ok) return <span className="text-sm text-green-700 dark:text-green-400">{state.ok}</span>;
  return null;
}

export function HandleForm({ siteId, subdomain, appDomain }: { siteId: string; subdomain: string; appDomain: string }) {
  const [state, action, pending] = useActionState<SiteState, FormData>(
    (prev, formData) => renameHandle(siteId, prev, formData),
    {},
  );

  return (
    <form action={action} className="mt-3">
      <label className="block">
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">
          {appDomain}/u/…
        </span>
        <input
          name="subdomain"
          defaultValue={subdomain}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className={`${inputClass} font-mono`}
        />
      </label>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={primaryButton}>
          Save handle
        </button>
        <Result state={state} />
      </div>
    </form>
  );
}

export function PublishState({ siteId, publishedAt }: { siteId: string; publishedAt: string | null }) {
  const [pending, start] = useTransition();
  const [state, setState] = useState<SiteState>({});

  if (!publishedAt) {
    return <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">Not published yet.</p>;
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <span className="text-sm">Live since {formatDateTime(publishedAt)}.</span>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => setState(await unpublishSite(siteId)))}
        className="rounded-lg border border-neutral-300 px-4 py-2 text-sm disabled:opacity-40 dark:border-neutral-700"
      >
        {pending ? "Taking offline…" : "Take offline"}
      </button>
      <Result state={state} />
    </div>
  );
}

/**
 * Deletion, gated on typing the handle.
 *
 * Same reasoning as on the account page: there is no undo and no trash, so the
 * confirmation has to be something you can only produce by reading the page.
 */
export function DeleteSiteForm({ siteId, subdomain }: { siteId: string; subdomain: string }) {
  const [state, action, pending] = useActionState<SiteState, FormData>(
    (prev, formData) => deleteSite(siteId, prev, formData),
    {},
  );

  return (
    <form action={action} className="mt-3">
      <label className="block">
        <span className="text-sm text-neutral-600 dark:text-neutral-400">
          Type <span className="font-mono text-neutral-900 dark:text-white">{subdomain}</span> to confirm.
        </span>
        <input
          name="confirm"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder={subdomain}
          className={inputClass}
        />
      </label>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40"
        >
          {pending ? "Deleting…" : "Delete this site"}
        </button>
        <Result state={state} />
      </div>
    </form>
  );
}
