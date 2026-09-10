"use client";

import { useActionState, useState, useTransition } from "react";
import { addDomain, removeDomain, verifyDomain, type DomainState } from "@/app/actions/domains";
import { formatDateTime } from "@/lib/dates";

type DomainRow = {
  id: string;
  hostname: string;
  verified: boolean;
  lastCheckedAt: string | null;
  record: { type: "A" | "CNAME"; name: string; value: string };
};

/**
 * Connecting a customer's own domain.
 *
 * The DNS record is shown verbatim in the shape a registrar's panel asks for,
 * because "point your domain at us" is where people get stuck.
 */
export function DomainManager({
  siteId, domains, serverIp,
}: {
  siteId: string;
  domains: DomainRow[];
  serverIp?: string;
}) {
  const [state, action, pending] = useActionState<DomainState, FormData>(
    (prev, formData) => addDomain(siteId, prev, formData),
    {},
  );
  const [busy, startTransition] = useTransition();
  const [rowState, setRowState] = useState<DomainState>({});

  const run = (fn: () => Promise<DomainState>) =>
    startTransition(async () => setRowState(await fn()));

  return (
    <>
      <div>
        <form action={action} className="mt-3 flex gap-2">
          <input
            name="hostname"
            placeholder="portfolio.yourdomain.com"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="min-w-0 flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-white"
          />
          <button
            type="submit"
            disabled={pending}
            className="shrink-0 rounded-lg bg-neutral-900 px-5 py-2.5 font-medium text-white disabled:opacity-40 dark:bg-white dark:text-neutral-900"
          >
            Add
          </button>
        </form>

        {(state.error ?? rowState.error) && (
          <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">{state.error ?? rowState.error}</p>
        )}
        {(state.ok ?? rowState.ok) && (
          <p className="mt-2 text-sm text-green-700 dark:text-green-400">{state.ok ?? rowState.ok}</p>
        )}

        {!serverIp && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
            <code>SERVER_IP</code> isn&apos;t set, so apex domains can&apos;t be verified and the A record
            below shows a placeholder. Set it in the server&apos;s <code>.env</code>.
          </p>
        )}
      </div>

      <ul className="mt-6 space-y-4">
        {domains.map((d) => (
          <li key={d.id} className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-mono text-sm text-neutral-900 dark:text-white">{d.hostname}</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  d.verified
                    ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                }`}
              >
                {d.verified ? "Verified" : "Pending DNS"}
              </span>
            </div>

            {!d.verified && (
              <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-md bg-neutral-50 p-3 font-mono text-xs dark:bg-neutral-900">
                <dt className="text-neutral-500">Type</dt>
                <dd className="text-neutral-900 dark:text-white">{d.record.type}</dd>
                <dt className="text-neutral-500">Name</dt>
                <dd className="text-neutral-900 dark:text-white">{d.record.name}</dd>
                <dt className="text-neutral-500">Value</dt>
                <dd className="break-all text-neutral-900 dark:text-white">{d.record.value}</dd>
              </dl>
            )}

            <div className="mt-3 flex items-center gap-4">
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => verifyDomain(siteId, d.id))}
                className="text-sm font-medium text-neutral-900 underline-offset-4 hover:underline disabled:opacity-40 dark:text-white"
              >
                {busy ? "Checking…" : d.verified ? "Re-check" : "Verify"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => removeDomain(siteId, d.id))}
                className="text-sm text-neutral-500 underline-offset-4 hover:underline disabled:opacity-40"
              >
                Remove
              </button>
              {d.lastCheckedAt && (
                <span className="text-xs text-neutral-400">
                  Checked {formatDateTime(d.lastCheckedAt)}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>

      {domains.length === 0 && (
        <p className="mt-4 text-sm text-neutral-500">
          Cloudflare users: set the record to <strong>DNS only</strong> (grey cloud), otherwise Cloudflare
          terminates TLS itself and the certificate can&apos;t be issued.
        </p>
      )}
    </>
  );
}
