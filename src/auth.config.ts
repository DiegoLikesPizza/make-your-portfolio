import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";

/**
 * Which sign-in methods are available depends on what is configured.
 *
 * A provider whose credentials are missing is left out entirely rather than
 * rendered and then failing on click — the sign-in page asks this module what
 * to show, so the button and the capability can never disagree.
 */

export const hasGitHub = Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET);
export const hasGoogle = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
export const hasSmtp = Boolean(process.env.EMAIL_SERVER_HOST);

/** Magic links always work: without SMTP the link is printed to the server log. */
export const hasEmail = true;

export const enabledProviders = () =>
  [
    hasGitHub && { id: "github", label: "Continue with GitHub" },
    hasGoogle && { id: "google", label: "Continue with Google" },
  ].filter(Boolean) as { id: string; label: string }[];

const providers: NextAuthConfig["providers"] = [];

if (hasGitHub) {
  providers.push(GitHub({ clientId: process.env.AUTH_GITHUB_ID, clientSecret: process.env.AUTH_GITHUB_SECRET }));
}
if (hasGoogle) {
  providers.push(Google({ clientId: process.env.AUTH_GOOGLE_ID, clientSecret: process.env.AUTH_GOOGLE_SECRET }));
}

providers.push(
  Nodemailer({
    server: {
      host: process.env.EMAIL_SERVER_HOST ?? "localhost",
      port: Number(process.env.EMAIL_SERVER_PORT ?? 1025),
      auth: process.env.EMAIL_SERVER_USER
        ? { user: process.env.EMAIL_SERVER_USER, pass: process.env.EMAIL_SERVER_PASSWORD }
        : undefined,
    },
    from: process.env.EMAIL_FROM ?? "hello@example.localhost",
    async sendVerificationRequest({ identifier, url, provider, request }) {
      // No SMTP configured: print the link instead of failing. This keeps local
      // sign-in working with zero infrastructure, and refuses to do so in
      // production, where a link in a log file is a security problem.
      if (!hasSmtp) {
        if (process.env.NODE_ENV === "production") {
          throw new Error("Email sign-in requires EMAIL_SERVER_HOST in production");
        }
        console.log(`\n  Magic link for ${identifier}:\n  ${url}\n`);
        return;
      }

      const { createTransport } = await import("nodemailer");
      const transport = createTransport(provider.server);
      await transport.sendMail({
        to: identifier,
        from: provider.from,
        subject: "Your sign-in link",
        text: `Sign in to Make Your Portfolio:\n${url}\n\nIf you didn't request this, ignore it.`,
      });
      void request;
    },
  }),
);

export const authConfig = { providers } satisfies NextAuthConfig;
