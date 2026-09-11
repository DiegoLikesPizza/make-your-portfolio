"use client";

import { useState, useTransition } from "react";
import { deleteMessage, markMessageRead, type MessageState } from "@/app/actions/messages";
import { ConfirmButton } from "@/components/dashboard/ConfirmButton";
import { formatDateTime } from "@/lib/dates";

export type MessageRow = { id: string; name: string; email: string; body: string; createdAt: string; read: boolean };

/** Messages newest first. Replying is the visitor's address — it opens your mail app. */
export function MessageList({ siteId, messages }: { siteId: string; messages: MessageRow[] }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();

  if (messages.length === 0) {
    return (
      <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
        Nothing yet. Messages sent from the contact form on your published page arrive here.
      </p>
    );
  }

  const run = (action: () => Promise<MessageState>) => start(async () => setError((await action()).error));
  const link = "text-sm underline-offset-4 hover:underline disabled:opacity-40";

  return (
    <div className="mt-3">
      <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
        {messages.map((m) => (
          <li key={m.id} className="py-4">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              {!m.read && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  New
                </span>
              )}
              <span className="text-sm font-medium">{m.name || "No name given"}</span>
              <a href={`mailto:${m.email}`} className="text-sm text-neutral-500 underline-offset-4 hover:underline dark:text-neutral-400">
                {m.email}
              </a>
              <span className="ml-auto text-xs text-neutral-500">{formatDateTime(m.createdAt)}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm">{m.body}</p>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              {!m.read && (
                <button type="button" disabled={pending} onClick={() => run(() => markMessageRead(siteId, m.id))} className={link}>
                  Mark as read
                </button>
              )}
              <ConfirmButton
                label="Delete"
                question="Delete this message?"
                confirmLabel="Delete"
                pending={pending}
                onConfirm={() => run(() => deleteMessage(siteId, m.id))}
                className="text-sm text-red-600 underline-offset-4 hover:underline disabled:opacity-40 dark:text-red-400"
              />
            </div>
          </li>
        ))}
      </ul>
      {error && <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
