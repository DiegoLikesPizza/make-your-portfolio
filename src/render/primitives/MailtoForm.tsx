"use client";

import { useState } from "react";

/**
 * A contact form that composes a `mailto:` link.
 *
 * No submissions endpoint exists, so rather than POST into the void this opens
 * the visitor's mail client with the subject and body prefilled. Everything is
 * encoded with encodeURIComponent — a newline or an ampersand in the message
 * would otherwise truncate the mail.
 */
export function MailtoForm({ address }: { address: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const field =
    "mt-1.5 w-full rounded-[var(--radius)] border border-[var(--border-color)] bg-[var(--surface)] px-3.5 py-2.5 text-[var(--foreground)] outline-none transition-colors focus:border-[var(--accent)]";
  const label = "block font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.12em] text-[var(--foreground-subtle)]";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(name ? `Message from ${name}` : "Message from your site");
    const body = encodeURIComponent(`${message}\n\n— ${name}${email ? ` (${email})` : ""}`);
    window.location.href = `mailto:${address}?subject=${subject}&body=${body}`;
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className={label}>Name</span>
        <input className={field} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      </label>
      <label className="block">
        <span className={label}>Email</span>
        <input className={field} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </label>
      <label className="block">
        <span className={label}>Message</span>
        <textarea className={field} rows={5} value={message} onChange={(e) => setMessage(e.target.value)} required />
      </label>
      <button
        type="submit"
        className="rounded-[var(--radius)] bg-[var(--accent)] px-6 py-3 font-medium text-[var(--accent-foreground)] transition-colors hover:bg-[var(--accent-hover)]"
      >
        Send message
      </button>
      <p className="text-xs text-[var(--foreground-subtle)]">Opens in your email app.</p>
    </form>
  );
}
