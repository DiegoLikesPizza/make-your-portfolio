import type { Metadata } from "next";
import { connection } from "next/server";
import { appOrigin } from "@/lib/hosts";
import { fontVariables } from "./fonts";
import "./globals.css";

const origin = appOrigin();

export const metadata: Metadata = {
  // Relative image URLs in page metadata resolve against this.
  ...(origin && { metadataBase: new URL(origin) }),
  title: "Make Your Portfolio",
  description: "Build and publish a one-page portfolio in minutes.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Every page renders per request. The Content-Security-Policy carries a nonce
  // minted for each response (src/proxy.ts), and a page prerendered at build
  // time would ship its scripts without one — which the policy refuses to run.
  await connection();

  return (
    <html lang="en" suppressHydrationWarning>
      {/* The app shell must paint its own background. Several pages use
          `dark:text-white`, so without a matching dark background the text was
          white on white for anyone whose device is in dark mode. Published
          portfolios override this from their own tokens. */}
      <body className={`${fontVariables} bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50`}>
        {children}
      </body>
    </html>
  );
}
