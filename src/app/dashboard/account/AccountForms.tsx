"use client";

import { useActionState } from "react";
import { deleteAccount, renameAccount, type AccountState } from "@/app/actions/account";

const inputClass =
  "mt-2 w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-neutral-900 outline-none " +
  "placeholder:text-neutral-400 focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 " +
  "dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-white";

export function NameForm({ name }: { name: string }) {
  const [state, action, pending] = useActionState<AccountState, FormData>(renameAccount, {});

  return (
    <form action={action} className="mt-3">
      <label className="block">
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">Display name</span>
        <input name="name" defaultValue={name} placeholder="Your name" className={inputClass} />
      </label>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-neutral-900 px-5 py-2 text-sm font-medium text-white disabled:opacity-40 dark:bg-white dark:text-neutral-900"
        >
          Save
        </button>
        {state.ok && <span className="text-sm text-green-700 dark:text-green-400">{state.ok}</span>}
        {state.error && (
          <span role="alert" className="text-sm text-red-600 dark:text-red-400">
            {state.error}
          </span>
        )}
      </div>
    </form>
  );
}

/**
 * Deletion, gated on typing the account's own email address.
 *
 * A "yes/no" dialog is the wrong control for something with no undo: it can be
 * dismissed by reflex. Typing the address takes reading the page.
 */
export function DeleteAccountForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState<AccountState, FormData>(deleteAccount, {});

  return (
    <form action={action} className="mt-3">
      <label className="block">
        <span className="text-sm text-neutral-600 dark:text-neutral-400">
          Type <span className="font-mono text-neutral-900 dark:text-white">{email}</span> to confirm.
        </span>
        <input
          name="confirm"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder={email}
          className={inputClass}
        />
      </label>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-40 hover:bg-red-700"
        >
          {pending ? "Deleting…" : "Delete everything"}
        </button>
        {state.error && (
          <span role="alert" className="text-sm text-red-600 dark:text-red-400">
            {state.error}
          </span>
        )}
      </div>
    </form>
  );
}
