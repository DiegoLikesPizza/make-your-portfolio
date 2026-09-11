"use client";

import { nanoid } from "nanoid";
import type { Section } from "@/lib/schema/sections";
import { Select, TextArea, TextInput, UrlInput } from "./fields";
import { ListEditor } from "./ListEditor";
import { CommaListInput, keepIds, LineListInput } from "./TokenField";
import { RichTextArea } from "./RichText";
import { ICON_OPTIONS, STATUS_OPTIONS } from "./options";

/**
 * The form for whichever section is selected.
 *
 * One form per section *type*, never per variant — variants of a type share
 * their data, so switching layout must never change the form. Where a variant
 * ignores a field, the hint says so rather than the field vanishing.
 */
export function SectionForm({ section, onChange }: { section: Section; onChange: (next: Section) => void }) {
  switch (section.type) {
    case "about": {
      const d = section.data;
      const set = (patch: Partial<typeof d>) => onChange({ ...section, data: { ...d, ...patch } });
      return (
        <div className="space-y-4">
          <RichTextArea
            label="Lead"
            rows={3}
            value={d.lead}
            hint="The one big sentence. Select words and use the buttons."
            onChange={(lead) => set({ lead })}
          />
          <TextArea label="Body" rows={8} value={d.body} hint="Blank line between paragraphs." onChange={(body) => set({ body })} />
          <TextInput
            label="Footnote"
            value={d.footnote ?? ""}
            hint="Shown by Two-col index and Centered narrow."
            onChange={(footnote) => set({ footnote })}
          />
          <ListEditor
            label="Stat"
            items={d.stats}
            hint="Only Stat strip displays these."
            onChange={(stats) => set({ stats })}
            create={() => ({ id: nanoid(8), value: "", label: "" })}
            title={(s) => s.label || "Stat"}
            render={(s, update) => (
              <>
                <TextInput label="Value" value={s.value} onChange={(value) => update({ value })} />
                <TextInput label="Label" value={s.label} onChange={(label) => update({ label })} />
              </>
            )}
          />
        </div>
      );
    }

    case "capabilities": {
      const d = section.data;
      const set = (patch: Partial<typeof d>) => onChange({ ...section, data: { ...d, ...patch } });
      return (
        <div className="space-y-4">
          <TextInput label="Headline" value={d.headline ?? ""} onChange={(headline) => set({ headline })} />
          <ListEditor
            label="Capability"
            items={d.items}
            onChange={(items) => set({ items })}
            create={() => ({ id: nanoid(8), icon: "code" as const, title: "", body: "" })}
            title={(i) => i.title || "Capability"}
            render={(i, update) => (
              <>
                <TextInput label="Title" value={i.title} onChange={(title) => update({ title })} />
                <TextArea label="Body" rows={2} value={i.body} onChange={(body) => update({ body })} />
                <Select label="Icon" value={i.icon as string} options={ICON_OPTIONS} onChange={(v) => update({ icon: v as typeof i.icon })} />
              </>
            )}
          />
          <ListEditor
            label="Chip"
            items={d.chips}
            onChange={(chips) => set({ chips })}
            create={() => ({ id: nanoid(8), label: "" })}
            title={(c) => c.label || "Chip"}
            render={(c, update) => <TextInput label="Label" value={c.label} onChange={(label) => update({ label })} />}
          />
        </div>
      );
    }

    case "projects":
      return (
        <ListEditor
          label="Project"
          items={section.data.items}
          onChange={(items) => onChange({ ...section, data: { items } })}
          create={() => ({ id: nanoid(8), title: "", summary: "", tech: [], status: "none" as const, featured: false })}
          title={(p) => p.title || "Project"}
          render={(p, update) => (
            <>
              <TextInput label="Title" value={p.title} onChange={(title) => update({ title })} />
              <TextArea label="Summary" rows={3} value={p.summary} onChange={(summary) => update({ summary })} />
              <CommaListInput label="Tech" value={p.tech} onChange={(tech) => update({ tech })} />
              <TextInput label="Year" value={p.year ?? ""} onChange={(year) => update({ year })} />
              <Select label="Status" value={p.status} options={STATUS_OPTIONS} onChange={(status) => update({ status })} />
              <UrlInput label="Link" value={p.href ?? ""} onChange={(href) => update({ href })} />
              <TextInput label="Link label" value={p.linkLabel ?? ""} onChange={(linkLabel) => update({ linkLabel })} />
            </>
          )}
        />
      );

    case "contact": {
      const d = section.data;
      const set = (patch: Partial<typeof d>) => onChange({ ...section, data: { ...d, ...patch } });
      return (
        <div className="space-y-4">
          <RichTextArea
            label="Headline"
            rows={2}
            value={d.headline ?? ""}
            hint="Select words and use the buttons."
            onChange={(headline) => set({ headline })}
          />
          <TextArea label="Blurb" rows={3} value={d.blurb ?? ""} onChange={(blurb) => set({ blurb })} />
          <ListEditor
            label="Channel"
            items={d.channels}
            onChange={(channels) => set({ channels })}
            create={() => ({ id: nanoid(8), label: "", href: "", icon: "mail" as const })}
            title={(c) => c.label || "Channel"}
            render={(c, update) => (
              <>
                <TextInput label="Label" value={c.label} onChange={(label) => update({ label })} />
                <UrlInput label="Link" value={c.href} onChange={(href) => update({ href })} />
                <Select label="Icon" value={c.icon as string} options={ICON_OPTIONS} onChange={(v) => update({ icon: v as typeof c.icon })} />
              </>
            )}
          />
        </div>
      );
    }

    case "skills":
      return (
        <ListEditor
          label="Group"
          items={section.data.groups}
          onChange={(groups) => onChange({ ...section, data: { groups } })}
          create={() => ({ id: nanoid(8), label: "", items: [] })}
          title={(g) => g.label || "Group"}
          render={(g, update) => (
            <>
              <TextInput label="Group label" value={g.label} onChange={(label) => update({ label })} />
              <CommaListInput
                label="Skills"
                value={g.items.map((i) => i.label)}
                onChange={(labels) =>
                  update({ items: keepIds(g.items, labels, (label, id) => ({ id, label }), () => nanoid(8)) })
                }
              />
            </>
          )}
        />
      );

    case "text":
      return (
        <TextArea
          label="Body"
          rows={12}
          value={section.data.body}
          hint="Blank line between paragraphs."
          onChange={(body) => onChange({ ...section, data: { body } })}
        />
      );

    case "experience": {
      const d = section.data;
      return (
        <ListEditor
          label="Role"
          items={d.items}
          onChange={(items) => onChange({ ...section, data: { items } })}
          create={() => ({ id: nanoid(8), role: "", org: "", start: "", bullets: [] })}
          title={(j) => j.role || "Role"}
          render={(j, update) => (
            <>
              <TextInput label="Role" value={j.role} onChange={(role) => update({ role })} />
              <TextInput label="Organisation" value={j.org} onChange={(org) => update({ org })} />
              <UrlInput label="Organisation link" value={j.orgHref ?? ""} onChange={(orgHref) => update({ orgHref })} />
              <TextInput label="Start" value={j.start} onChange={(start) => update({ start })} />
              <TextInput label="End" value={j.end ?? ""} hint="Leave blank for Present." onChange={(end) => update({ end })} />
              <TextArea label="Summary" rows={3} value={j.summary ?? ""} onChange={(summary) => update({ summary })} />
              <LineListInput
                label="Highlights"
                value={j.bullets.map((b) => b.text)}
                hint="One per line. Not shown by the Table layout."
                onChange={(lines) =>
                  update({ bullets: keepIds(j.bullets, lines, (text, id) => ({ id, text }), () => nanoid(8)) })
                }
              />
            </>
          )}
        />
      );
    }

    case "education": {
      const d = section.data;
      return (
        <ListEditor
          label="Qualification"
          items={d.items}
          onChange={(items) => onChange({ ...section, data: { items } })}
          create={() => ({ id: nanoid(8), qualification: "", institution: "", start: "" })}
          title={(e) => e.qualification || "Qualification"}
          render={(e, update) => (
            <>
              <TextInput label="Qualification" value={e.qualification} onChange={(qualification) => update({ qualification })} />
              <TextInput label="Institution" value={e.institution} onChange={(institution) => update({ institution })} />
              <TextInput label="Start" value={e.start} onChange={(start) => update({ start })} />
              <TextInput label="End" value={e.end ?? ""} onChange={(end) => update({ end })} />
              <TextArea label="Summary" rows={3} value={e.summary ?? ""} onChange={(summary) => update({ summary })} />
            </>
          )}
        />
      );
    }

    case "stats": {
      const d = section.data;
      return (
        <ListEditor
          label="Stat"
          items={d.items}
          onChange={(items) => onChange({ ...section, data: { items } })}
          create={() => ({ id: nanoid(8), value: "", label: "" })}
          title={(s) => s.label || "Stat"}
          render={(s, update) => (
            <>
              <TextInput label="Value" value={s.value} onChange={(value) => update({ value })} />
              <TextInput label="Suffix" value={s.suffix ?? ""} hint="Rendered in the accent colour, e.g. +" onChange={(suffix) => update({ suffix })} />
              <TextInput label="Label" value={s.label} onChange={(label) => update({ label })} />
            </>
          )}
        />
      );
    }

    case "testimonials": {
      const d = section.data;
      return (
        <ListEditor
          label="Quote"
          items={d.items}
          onChange={(items) => onChange({ ...section, data: { items } })}
          create={() => ({ id: nanoid(8), quote: "", author: "" })}
          title={(t) => t.author || "Quote"}
          render={(t, update) => (
            <>
              <TextArea label="Quote" rows={4} value={t.quote} onChange={(quote) => update({ quote })} />
              <TextInput label="Author" value={t.author} onChange={(author) => update({ author })} />
              <TextInput label="Role" value={t.role ?? ""} onChange={(role) => update({ role })} />
            </>
          )}
        />
      );
    }

    case "gallery": {
      const d = section.data;
      return (
        <ListEditor
          label="Image"
          items={d.items}
          hint="Uploads land in step 7; captions and links work now."
          onChange={(items) => onChange({ ...section, data: { items } })}
          create={() => ({ id: nanoid(8), assetId: "" })}
          title={(g) => g.caption || "Image"}
          render={(g, update) => (
            <>
              <TextInput label="Caption" value={g.caption ?? ""} onChange={(caption) => update({ caption })} />
              <UrlInput label="Link" value={g.href ?? ""} onChange={(href) => update({ href })} />
            </>
          )}
        />
      );
    }

    default:
      return <p className="text-sm text-neutral-500">No form for this section type yet.</p>;
  }
}
