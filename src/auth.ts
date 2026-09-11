import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { authConfig } from "@/auth.config";

/**
 * Auth.js wiring.
 *
 * Database sessions rather than JWTs: a session is a row we can revoke, and the
 * adapter is already storing users and accounts. The cost is a query per
 * request, which is fine for a dashboard.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  // For the dev server, which is reached by LAN IP and on several hostnames. In
  // production AUTH_URL takes precedence over the Host header for every URL
  // Auth.js builds, sign-in links included — and src/instrumentation.ts refuses
  // to serve anything without it, because a Host header is whatever the client
  // sends.
  trustHost: true,
  session: { strategy: "database" },
  pages: {
    signIn: "/signin",
    verifyRequest: "/signin/check-email",
    error: "/signin",
  },
  callbacks: {
    session({ session, user }) {
      // The app keys everything off user id; make sure it is on the session.
      if (session.user) session.user.id = user.id;
      return session;
    },
  },
});
