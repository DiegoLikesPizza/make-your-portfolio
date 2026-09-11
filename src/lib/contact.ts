/**
 * What a visitor may send through a portfolio's contact form.
 *
 * Pure and dependency-free: the public page imports the limits for its
 * `maxLength`s, and pulling a validation library into every portfolio's bundle
 * for four fields isn't worth it.
 */

export const CONTACT_LIMITS = { name: 100, email: 254, message: 5000 };

/** A request body larger than any valid message could be. */
export const MAX_CONTACT_REQUEST_CHARS = 16_000;

export type ContactInput = { siteId: string; name: string; email: string; message: string };

export type ParsedContact =
  | { ok: true; data: ContactInput; /** The honeypot was filled in. */ spam: boolean }
  | { ok: false; error: string };

/**
 * An address a reply can go to. Deliberately stricter than the RFC: no spaces,
 * quotes, commas or `?`/`&`, so the address can't carry extra recipients or
 * mailto parameters into the owner's mail app.
 */
const EMAIL = /^[^\s@<>()[\]\\,;:"?&]+@[^\s@<>()[\]\\,;:"?&.]+(\.[^\s@<>()[\]\\,;:"?&.]+)+$/;

/** A control character: a newline in a name would become a new mail header. */
const CONTROL = /\p{Cc}/u;

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export function parseContact(raw: unknown): ParsedContact {
  if (typeof raw !== "object" || raw === null) return { ok: false, error: "That didn't look like a message." };
  const input = raw as Record<string, unknown>;

  const siteId = text(input.siteId);
  const name = text(input.name);
  const email = text(input.email);
  const message = text(input.message).replace(/\r\n?/g, "\n");

  if (!siteId || siteId.length > 64) return { ok: false, error: "This form isn't connected to a site." };
  if (name.length > CONTACT_LIMITS.name) {
    return { ok: false, error: `Your name can be up to ${CONTACT_LIMITS.name} characters.` };
  }
  if (CONTROL.test(name)) return { ok: false, error: "Your name has characters that can't be used." };
  if (email.length > CONTACT_LIMITS.email || !EMAIL.test(email)) {
    return { ok: false, error: "Enter the email address you'd like a reply at." };
  }
  if (!message) return { ok: false, error: "Write a message first." };
  if (message.length > CONTACT_LIMITS.message) {
    return { ok: false, error: `Messages can be up to ${CONTACT_LIMITS.message.toLocaleString("en")} characters.` };
  }

  return { ok: true, data: { siteId, name, email, message }, spam: text(input.website) !== "" };
}
