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
  // The app is reached through Caddy, by LAN IP, and on several hostnames, so
  // the Host header is what decides callback URLs rather than a fixed origin.
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
