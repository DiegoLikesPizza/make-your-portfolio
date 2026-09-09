/**
 * Values shared by code that must not pull in the database client — the seed
 * script imports this rather than `auth.ts`, whose module graph constructs a
 * Prisma client on import.
 */

/** The user resolved by `getCurrentUser()` until real auth lands (step 2). */
export const DEV_USER_EMAIL = "dev@example.localhost";
