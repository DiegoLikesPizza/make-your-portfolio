import { redirect } from "next/navigation";
import { getMySite } from "@/lib/auth";
import { APP_DOMAIN } from "@/lib/hosts";
import { ClaimForm } from "./ClaimForm";

export const metadata = { title: "Choose your address" };

/**
 * The one thing a new account must decide before it has a site: its address.
 * Everything else has a sensible default and is editable later.
 */
export default async function OnboardingPage() {
  const me = await getMySite();
  if (!me?.user) redirect("/signin");
  if (me.site) redirect(`/dashboard/${me.site.id}/edit`);

  const suggestion = (me.user.name ?? me.user.email?.split("@")[0] ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/^-+|-+$/g, "");

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-[-0.02em] text-neutral-900 dark:text-white">
        Pick your address
      </h1>
      <p className="mt-3 text-neutral-600 dark:text-neutral-400">
        This is where your portfolio lives. You can add your own domain later.
      </p>
      <ClaimForm domain={APP_DOMAIN} suggestion={suggestion} />
    </main>
  );
}
