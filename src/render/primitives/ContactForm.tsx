"use client";

import { useState } from "react";
import { CONTACT_LIMITS } from "@/lib/contact";

/**
 * The message form on a portfolio.
 *
 * On a published page (`siteId` set) it posts to /api/contact and the message
 * lands in the owner's dashboard. Where there is no site to deliver to — the
 * editor preview, the demos, an exported file — it composes a `mailto:` to
 * `address` instead, with everything encoded (a newline or an ampersand would
 * otherwise truncate the mail). With neither, it says where sending works.
 */
export function ContactForm({ siteId, address }: { siteId?: string; address: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  // The honeypot. Visitors never see it; a bot filling in every field does.
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string>();

  const field =
    "mt-1.5 w-full rounded-[var(--radius)] border border-[var(--border-color)] bg-[var(--surface)] px-3.5 py-2.5 text-[var(--foreground)] outline-none transition-colors focus:border-[var(--accent)]";
  const label = "block font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.12em] text-[var(--foreground-subtle)]";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!siteId) {
      if (!address) return;
      const subject = encodeURIComponent(name ? `Message from ${name}` : "Message from your site");
      const body = encodeURIComponent(`${message}\n\n— ${name}${email ? ` (${email})` : ""}`);
      window.location.href = `mailto:${address}?subject=${subject}&body=${body}`;
      return;
    }

    setStatus("sending");
    setError(undefined);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ siteId, name, email, message, website }),
      });
      if (response.ok) {
        setStatus("sent");
        return;
      }
      const json = await response.json().catch(() => ({}));
      setError(json.error ?? "Your message couldn't be sent. Please try again.");
    } catch {
      setError("Your message couldn't be sent. Check your connection and try again.");
    }
    setStatus("idle");
  };

  if (status === "sent") {
    return (
      <p role="status" className="text-lg text-[var(--foreground)]">
        Thanks — your message was sent.
      </p>
    );
  }

  const canSend = Boolean(siteId || address);

  return (
    <form
      onSubmit={submit}
      // Without JavaScript — an exported HTML file — the browser still hands a
      // mailto form to the visitor's mail app. With it, `submit` takes over.
      action={!siteId && address ? `mailto:${address}` : undefined}
      method={!siteId && address ? "post" : undefined}
      encType={!siteId && address ? "text/plain" : undefined}
      className="relative space-y-4"
    >
      <label className="block">
        <span className={label}>Name</span>
        <input className={field} name="name" value={name} maxLength={CONTACT_LIMITS.name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      </label>
      <label className="block">
        <span className={label}>Email</span>
        <input
          className={field}
          type="email"
          name="email"
          value={email}
          maxLength={CONTACT_LIMITS.email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required={Boolean(siteId)}
        />
      </label>
      <label className="block">
        <span className={label}>Message</span>
        <textarea
          className={field}
          rows={5}
          name="message"
          value={message}
          maxLength={CONTACT_LIMITS.message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
      </label>
      {siteId && (
        <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
          <label>
            Website
            <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </label>
        </div>
      )}
      <button
        type="submit"
        disabled={status === "sending" || !canSend}
        className="rounded-[var(--radius)] bg-[var(--accent)] px-6 py-3 font-medium text-[var(--accent-foreground)] transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Send message"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-[var(--foreground)]">
          {error}
        </p>
      )}
      {!siteId && (
        <p className="text-xs text-[var(--foreground-subtle)]">
          {address ? "Opens in your email app." : "Sending works on the published page."}
        </p>
      )}
    </form>
  );
}
