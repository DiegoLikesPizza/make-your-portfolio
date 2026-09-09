import Link from "next/link";
import { hasSmtp } from "@/auth.config";

export const metadata = { title: "Check your email" };

export default function CheckEmailPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16 text-center">
      <h1 className="text-3xl font-semibold tracking-[-0.02em] text-neutral-900 dark:text-white">
        Check your email
      </h1>
      <p className="mt-3 text-neutral-600 dark:text-neutral-400">
        {hasSmtp
          ? "We sent you a sign-in link. It expires in 24 hours."
          : "No mail server is configured, so the link was printed to the server console — copy it from there."}
      </p>
      <Link href="/signin" className="mt-8 text-sm text-neutral-500 underline-offset-4 hover:underline">
        Use a different address
      </Link>
    </main>
  );
}
