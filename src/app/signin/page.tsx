import { redirect } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/auth";
import { getMySite } from "@/lib/auth";
import { enabledProviders, hasSmtp } from "@/auth.config";

export const metadata = { title: "Sign in" };

/**
 * One page for both sign-in and sign-up.
 *
 * With OAuth and magic links there is no meaningful difference — the first time
 * you arrive an account is created, and after that it isn't. Presenting two
 * separate forms would only make people wonder which one they need.
 */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const me = await getMySite();
  if (me?.user) redirect(me.site ? `/dashboard/${me.site.id}/edit` : "/onboarding");

  const { error } = await searchParams;
  const providers = enabledProviders();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <Link href="/" className="text-sm text-neutral-500 transition-colors hover:text-neutral-900 dark:hover:text-white">
        ← Back
      </Link>

      <h1 className="mt-8 text-3xl font-semibold tracking-[-0.02em] text-neutral-900 dark:text-white">
        Sign in
      </h1>
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">
        New here? Signing in creates your account.
      </p>

      {error && (
        <p role="alert" className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          That didn&apos;t work. Please try again.
        </p>
      )}

      {providers.length > 0 && (
        <div className="mt-8 space-y-3">
          {providers.map((p) => (
            <form
              key={p.id}
              action={async () => {
                "use server";
                await signIn(p.id, { redirectTo: "/onboarding" });
              }}
            >
              <button
                type="submit"
                className="w-full rounded-lg border border-neutral-300 px-4 py-3 font-medium text-neutral-900 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-900"
              >
                {p.label}
              </button>
            </form>
          ))}

          <div className="flex items-center gap-3 py-2">
            <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
            <span className="text-xs uppercase tracking-wider text-neutral-400">or</span>
            <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
          </div>
        </div>
      )}

      <form
        className={providers.length > 0 ? "" : "mt-8"}
        action={async (formData: FormData) => {
          "use server";
          await signIn("nodemailer", {
            email: String(formData.get("email") ?? ""),
            redirectTo: "/onboarding",
          });
        }}
      >
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="mt-1.5 w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-900 outline-none transition-colors focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white dark:focus:border-white"
          />
        </label>
        <button
          type="submit"
          className="mt-3 w-full rounded-lg bg-neutral-900 px-4 py-3 font-medium text-white transition-colors hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          Email me a sign-in link
        </button>
      </form>

      {!hasSmtp && (
        <p className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          No mail server is configured, so the sign-in link is printed to the server console instead
          of being emailed. Fine for local development; set <code>EMAIL_SERVER_HOST</code> before deploying.
        </p>
      )}

      {providers.length === 0 && (
        <p className="mt-4 text-xs text-neutral-400">
          GitHub and Google sign-in appear here once their credentials are set in <code>.env</code>.
        </p>
      )}
    </main>
  );
}
