"use client";

import { useActionState } from "react";
import Link from "next/link";
import { writeDraft, type AssistState } from "@/app/actions/assist";

export function AssistForm({ siteId }: { siteId: string }) {
  const [state, action, pending] = useActionState<AssistState, FormData>(
    (prev, formData) => writeDraft(siteId, prev, formData),
    {},
  );

  return (
    <form action={action} className="mt-4">
      <label className="block">
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">About you</span>
        <textarea
          name="about"
          rows={12}
          placeholder={
            "Paste your CV, or just write it out. What you do, who for, what you've built, " +
            "what you want people to come away thinking. Rough is fine — it doesn't have to read well."
          }
          className={
            "mt-2 w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-900 outline-none " +
            "placeholder:text-neutral-400 focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 " +
            "dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-white"
          }
        />
      </label>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40 dark:bg-white dark:text-neutral-900"
        >
          {pending ? "Writing…" : "Write my draft"}
        </button>
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          {pending ? "This takes a few seconds." : "Replaces the draft. Nothing goes live."}
        </span>
      </div>

      {state.error && (
        <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="mt-4 text-sm text-green-700 dark:text-green-400">
          {state.ok}{" "}
          <Link href={`/dashboard/${siteId}/edit`} className="underline underline-offset-2">
            Open the editor
          </Link>
          .
        </p>
      )}
    </form>
  );
}
