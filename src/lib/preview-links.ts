import { randomBytes } from "node:crypto";

/**
 * Private draft preview links: /p/<token>.
 *
 * The token is the whole of the access control — anyone who has the link sees
 * the draft — so it has to be unguessable: 32 random bytes, base64url.
 */

/** 32 bytes of base64url is always 43 characters from this alphabet. */
const PREVIEW_TOKEN = /^[A-Za-z0-9_-]{43}$/;

export function newPreviewToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Could this be a token at all? Anything else is a 404 without a database query. */
export function isPreviewToken(value: string): boolean {
  return PREVIEW_TOKEN.test(value);
}
