import Link from "next/link";
import { getMySite } from "@/lib/auth";
import { PRESETS } from "@/presets";
import { SECTION_VARIANTS } from "@/lib/schema/sections";
import { PresetSwatch } from "@/components/marketing/PresetSwatch";

export const metadata = {
  title: "Make Your Portfolio",
  description: "Build a one-page portfolio and publish it to your own domain. Pick a preset, then change anything.",
};

const variantCount = Object.values(SECTION_VARIANTS).reduce((n, v) => n + v.length, 0);

export default async function Home() {
  // Signed in already? Send them to their work, not to a pitch.
  const me = await getMySite();

  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <span className="font-semibold tracking-tight">Make Your Portfolio</span>
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/layouts" className="rounded-lg px-3 py-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">
            Layouts
          </Link>
          {me?.user ? (
            <Link
              href={me.site ? `/dashboard/${me.site.id}/edit` : "/onboarding"}
              className="rounded-lg bg-neutral-900 px-4 py-2 font-medium text-white dark:bg-white dark:text-neutral-900"
            >
              Open editor
            </Link>
          ) : (
            <>
              <Link href="/signin" className="rounded-lg px-3 py-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">
                Log in
              </Link>
              <Link
                href="/signin"
                className="rounded-lg bg-neutral-900 px-4 py-2 font-medium text-white transition-colors hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6">
        <section className="py-16 sm:py-24">
          <h1 className="max-w-[16ch] text-4xl font-semibold leading-[1.05] tracking-[-0.035em] sm:text-6xl">
            A portfolio that doesn&apos;t look like everyone else&apos;s.
          </h1>
          <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
            Fill in a form, watch it render live, publish it to your own address. Start from a
            preset, then change anything — top bar or floating side rail, sharp corners or round,
            a numbered list or a grid, a gradient or a GIF behind it.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              href="/signin"
              className="rounded-lg bg-neutral-900 px-6 py-3.5 font-medium text-white transition-colors hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              Start building — it&apos;s free
            </Link>
            <Link
              href="/layouts"
              className="rounded-lg border border-neutral-300 px-6 py-3.5 font-medium transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
            >
              Browse the layouts
            </Link>
          </div>

          <dl className="mt-14 flex flex-wrap gap-x-12 gap-y-4">
            {[
              [`${variantCount}`, "section layouts"],
              ["8", "navigation styles"],
              [`${Object.keys(PRESETS).length}`, "presets"],
              ["1", "page, done properly"],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="text-3xl font-semibold tracking-tight">{value}</dt>
                <dd className="mt-1 text-xs uppercase tracking-[0.1em] text-neutral-500">{label}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="border-t border-neutral-200 py-16 dark:border-neutral-800">
          <h2 className="text-2xl font-semibold tracking-tight">Start from a look, then make it yours</h2>
          <p className="mt-3 max-w-[54ch] text-neutral-600 dark:text-neutral-400">
            A preset is just a starting point — colours, corners, type, navigation and spacing all
            stay editable afterwards.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(PRESETS).map(([id, preset]) => (
              <li key={id}>
                <PresetSwatch id={id} label={preset.label} description={preset.description} design={preset.design} />
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t border-neutral-200 py-16 dark:border-neutral-800">
          <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
          <ol className="mt-8 grid gap-8 sm:grid-cols-3">
            {[
              ["Pick your address", "yourname.example.com, free, yours the moment you sign up."],
              ["Fill in the form", "Your work, your background, your links. The page renders as you type."],
              ["Publish", "One button. Add your own domain whenever you like."],
            ].map(([title, body], i) => (
              <li key={title}>
                <span className="font-mono text-xs text-neutral-400">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-2 font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{body}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 border-t border-neutral-200 px-6 py-8 text-sm text-neutral-500 dark:border-neutral-800">
        <span>Make Your Portfolio</span>
        <Link href="/signin" className="hover:text-neutral-900 dark:hover:text-white">
          Sign in
        </Link>
      </footer>
    </div>
  );
}
