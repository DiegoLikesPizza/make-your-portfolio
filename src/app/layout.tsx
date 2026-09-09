import type { Metadata } from "next";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Make Your Portfolio",
  description: "Build and publish a one-page portfolio in minutes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
