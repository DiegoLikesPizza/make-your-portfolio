"use client";

import { nanoid } from "nanoid";
import type { PortfolioDoc } from "@/lib/schema/portfolio";
import { Select, TextArea, TextInput, UrlInput } from "./fields";
import { AssetInput } from "./AssetInput";
import { BackgroundEditor } from "./BackgroundEditor";
import { ListEditor } from "./ListEditor";
import { RichTextArea } from "./RichText";
import { ICON_OPTIONS } from "./options";

const HERO_VARIANTS = [
  "split-left", "centered-stack", "full-bleed-background", "portrait-side",
  "oversized-type", "terminal-prompt", "image-right-split", "minimal-line",
] as const;

const CTA_STYLES = [
  { value: "solid", label: "Solid" },
  { value: "outline", label: "Outline" },
  { value: "text", label: "Text" },
] as const;

/** Profile, hero layout and SEO — the things that live outside `sections`. */
export function ProfileForm({ doc, onChange }: { doc: PortfolioDoc; onChange: (next: PortfolioDoc) => void }) {
  const p = doc.profile;
  const setProfile = (patch: Partial<typeof p>) => onChange({ ...doc, profile: { ...p, ...patch } });
  const setMeta = (patch: Partial<typeof doc.meta>) => onChange({ ...doc, meta: { ...doc.meta, ...patch } });

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-900 dark:text-neutral-50">Hero</h3>
        <Select
          label="Layout"
          value={doc.hero.variant}
          options={HERO_VARIANTS.map((v) => ({ value: v, label: v.replace(/-/g, " ") }))}
          onChange={(variant) => onChange({ ...doc, hero: { ...doc.hero, variant } })}
        />
        <TextInput label="Name" value={p.name} onChange={(name) => setProfile({ name })} />
        <TextInput label="Initials" value={p.initials ?? ""} hint="Used for the monogram." onChange={(initials) => setProfile({ initials })} />
        <TextInput label="Eyebrow" value={p.eyebrow ?? ""} onChange={(eyebrow) => setProfile({ eyebrow })} />
        <RichTextArea
          label="Headline"
          rows={3}
          value={p.headline}
          hint="Select words and use the buttons — bold, italic, accent colour, muted."
          onChange={(headline) => setProfile({ headline })}
        />
        <TextArea label="Intro" rows={3} value={p.bio} onChange={(bio) => setProfile({ bio })} />
        <AssetInput
          label="Portrait"
          value={p.avatarAssetId}
          hint="Shown by the hero layouts that have a portrait."
          onChange={(avatarAssetId) => setProfile({ avatarAssetId })}
        />
      </section>

      <section className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-900 dark:text-neutral-50">Hero background</h3>
        <BackgroundEditor
          value={doc.hero.background}
          noneLabel="Same as the page"
          onChange={(background) => onChange({ ...doc, hero: { ...doc.hero, background } })}
        />
      </section>

      <ListEditor
        label="Button"
        items={p.ctas}
        hint="Up to two."
        onChange={(ctas) => setProfile({ ctas: ctas.slice(0, 2) })}
        create={() => ({ id: nanoid(8), label: "", target: "", style: "solid" as const })}
        title={(c) => c.label || "Button"}
        render={(c, update) => (
          <>
            <TextInput label="Label" value={c.label} onChange={(label) => update({ label })} />
            <UrlInput
              label="Target"
              value={c.target}
              hint="A section slug, a URL, or mailto:you@example.com"
              onChange={(target) => update({ target })}
            />
            <Select label="Style" value={c.style} options={CTA_STYLES} onChange={(style) => update({ style })} />
          </>
        )}
      />

      <ListEditor
        label="Link"
        items={p.links}
        onChange={(links) => setProfile({ links })}
        create={() => ({ id: nanoid(8), label: "", href: "", icon: "globe" as const })}
        title={(l) => l.label || "Link"}
        render={(l, update) => (
          <>
            <TextInput label="Label" value={l.label} onChange={(label) => update({ label })} />
            <UrlInput label="URL" value={l.href} onChange={(href) => update({ href })} />
            <Select label="Icon" value={l.icon as string} options={ICON_OPTIONS} onChange={(v) => update({ icon: v as typeof l.icon })} />
          </>
        )}
      />

      <section className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-900 dark:text-neutral-50">Search &amp; sharing</h3>
        <TextInput label="Page title" value={doc.meta.title} onChange={(title) => setMeta({ title })} />
        <TextArea label="Description" rows={3} value={doc.meta.description} onChange={(description) => setMeta({ description })} />
      </section>
    </div>
  );
}
