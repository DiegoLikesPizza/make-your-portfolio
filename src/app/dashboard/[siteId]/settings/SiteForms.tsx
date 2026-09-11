"use client";

import { useActionState, useTransition, useState, useSyncExternalStore } from "react";
import {
  createPreviewLink, deleteSite, renameHandle, revokePreviewLink, unpublishSite, type SiteState,
} from "@/app/actions/site";
import { republishVersion, restoreToDraft, type VersionState } from "@/app/actions/versions";
import { ConfirmButton } from "@/components/dashboard/ConfirmButton";
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
      <ConfirmButton
        label="Take offline"
        question="Take the site offline?"
        confirmLabel="Take offline"
        pending={pending}
        pendingLabel="Taking offline…"
        onConfirm={() => start(async () => setState(await unpublishSite(siteId)))}
        className="rounded-lg border border-neutral-300 px-4 py-2 text-sm disabled:opacity-40 dark:border-neutral-700"
      />
      <Result state={state} />
    </div>
  );
}

const secondaryButton =
  "rounded-lg border border-neutral-300 px-4 py-2 text-sm disabled:opacity-40 dark:border-neutral-700";

const subscribeNothing = () => () => {};

/**
 * The private draft preview link.
 *
 * The server renders this without knowing which address the owner opened the
 * dashboard on, so the full URL is filled in from the browser once hydrated.
 */
export function PreviewLink({ siteId, token }: { siteId: string; token: string | null }) {
  const [pending, start] = useTransition();
  const [state, setState] = useState<SiteState>({});
  const [copied, setCopied] = useState(false);
  const origin = useSyncExternalStore(subscribeNothing, () => window.location.origin, () => "");

  const run = (action: (siteId: string) => Promise<SiteState>) =>
    start(async () => {
      setCopied(false);
      setState(await action(siteId));
    });

  if (!token) {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" disabled={pending} onClick={() => run(createPreviewLink)} className={primaryButton}>
          {pending ? "Creating…" : "Create preview link"}
        </button>
        <Result state={state} />
      </div>
    );
  }

  const url = `${origin}/p/${token}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // No clipboard access (an http origin, say): the field is selectable.
    }
  };

  return (
    <div className="mt-3">
      <input
        readOnly
        value={url}
        aria-label="Preview link"
        onFocus={(e) => e.currentTarget.select()}
        className={`${inputClass} font-mono text-sm`}
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" onClick={copy} className={primaryButton}>
          {copied ? "Copied" : "Copy link"}
        </button>
        <ConfirmButton
          label="New link"
          question="Replace it? The current link stops working."
          confirmLabel="Replace"
          pending={pending}
          onConfirm={() => run(createPreviewLink)}
          className={secondaryButton}
        />
        <ConfirmButton
          label="Revoke"
          question="Turn the link off?"
          confirmLabel="Revoke"
          pending={pending}
          onConfirm={() => run(revokePreviewLink)}
          className={secondaryButton}
        />
        <Result state={state} />
      </div>
    </div>
  );
}

/**
 * Every published version, newest first, with the live one marked.
 *
 * Both actions ask first: opening a version in the editor overwrites the draft,
 * and publishing one changes the live page.
 */
export function VersionHistory({
  siteId, versions, livePublishedAt,
}: {
  siteId: string;
  versions: { id: string; publishedAt: string }[];
  /** The site's `publishedAt`; the version sharing it is the live one. Null when offline. */
  livePublishedAt: string | null;
}) {
  const [pending, start] = useTransition();
  const [state, setState] = useState<VersionState>({});

  if (versions.length === 0) {
    return (
      <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
        Nothing yet. Every publish from now on is kept here.
      </p>
    );
  }

  const run = (action: () => Promise<VersionState>) => start(async () => setState(await action()));
  const link = "text-sm underline-offset-4 hover:underline disabled:opacity-40";

  return (
    <div className="mt-3">
      <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
        {versions.map((version) => {
          const live = version.publishedAt === livePublishedAt;
          return (
            <li key={version.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2.5">
              <span className="text-sm">{formatDateTime(version.publishedAt)}</span>
              {live && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-950 dark:text-green-300">
                  Live
                </span>
              )}
              <div className="ml-auto flex flex-wrap items-center gap-4">
                <ConfirmButton
                  label="Open in editor"
                  question="Replace your draft with this version?"
                  confirmLabel="Replace draft"
                  pending={pending}
                  onConfirm={() => run(() => restoreToDraft(siteId, version.id))}
                  className={link}
                />
                {!live && (
                  <ConfirmButton
                    label="Publish this version"
                    question="Put this version live?"
                    confirmLabel="Publish"
                    pending={pending}
                    onConfirm={() => run(() => republishVersion(siteId, version.id))}
                    className={link}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-2">
        <Result state={state} />
      </div>
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
