"use client";

import { useState, useTransition } from "react";
import { importGithubProjects } from "@/app/actions/github";
import { ConfirmButton } from "@/components/dashboard/ConfirmButton";
import { IMPORTED_PROJECTS, type ProjectItem } from "@/lib/github";
import { useEditorAssets } from "./assets-context";
import { Field, inputClass } from "./fields";

const button =
  "rounded-md border border-neutral-300 px-3 py-1.5 text-sm transition-colors hover:border-neutral-900 disabled:opacity-40 " +
  "dark:border-neutral-700 dark:hover:border-neutral-100";

/**
 * Fill the Projects section from a GitHub account's top public repositories.
 *
 * Replaces the list, so it asks first when there are projects to lose. Only the
 * draft changes; the imported projects are edited like any others.
 */
export function GithubImport({ projectCount, onImport }: { projectCount: number; onImport: (projects: ProjectItem[]) => void }) {
  const { siteId } = useEditorAssets();
  const [username, setUsername] = useState("");
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ error?: string; ok?: string }>({});

  const run = () =>
    start(async () => {
      setResult({});
      const response = await importGithubProjects(siteId, username);
      if (!response.ok) {
        setResult({ error: response.error });
        return;
      }
      onImport(response.projects);
      setResult({ ok: `Imported ${response.projects.length}. Edit them below; nothing is published until you press Publish.` });
    });

  const disabled = pending || !username.trim();

  return (
    <div className="rounded-md border border-dashed border-neutral-300 p-3 dark:border-neutral-700">
      <Field
        label="Import from GitHub"
        hint={`Your ${IMPORTED_PROJECTS} most-starred public repositories, forks skipped.`}
        error={result.error}
      >
        <input
          className={inputClass}
          value={username}
          placeholder="GitHub username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => {
            // Enter would otherwise do nothing useful here; import when it's safe to.
            if (e.key === "Enter" && !disabled && projectCount === 0) {
              e.preventDefault();
              run();
            }
          }}
        />
      </Field>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        {projectCount > 0 ? (
          <ConfirmButton
            label={pending ? "Importing…" : "Import"}
            question={`Replace your ${projectCount} project${projectCount === 1 ? "" : "s"}?`}
            confirmLabel="Replace"
            pending={disabled}
            onConfirm={run}
            className={button}
          />
        ) : (
          <button type="button" disabled={disabled} onClick={run} className={button}>
            {pending ? "Importing…" : "Import"}
          </button>
        )}
        {result.ok && <span className="text-xs text-green-700 dark:text-green-400">{result.ok}</span>}
      </div>
    </div>
  );
}
