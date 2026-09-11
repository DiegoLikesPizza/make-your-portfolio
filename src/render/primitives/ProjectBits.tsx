import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/lib/schema/sections";
import { StatusBadge } from "./StatusBadge";

/**
 * Pieces every projects variant repeats: the meta row, the tech list and the
 * outbound link. Kept here so eight layouts share one definition of "external
 * links get rel hardening" rather than eight copies that can drift.
 */

export function ProjectMeta({ project, align }: { project: Project; align?: "end" }) {
  if (!project.year && project.status === "none") return null;
  return (
    <div className={`flex items-center gap-3 ${align === "end" ? "justify-end" : ""}`}>
      {project.year && (
        <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--foreground-subtle)]">{project.year}</span>
      )}
      <StatusBadge status={project.status} />
    </div>
  );
}

export function TechList({ tech, className }: { tech: string[]; className?: string }) {
  if (tech.length === 0) return null;
  return (
    <ul className={`flex flex-wrap gap-x-4 gap-y-1 ${className ?? ""}`}>
      {tech.map((t) => (
        <li key={t} className="font-[family-name:var(--font-mono)] text-xs text-[var(--foreground-subtle)]">
          {t}
        </li>
      ))}
    </ul>
  );
}

export function ProjectLink({ project, className }: { project: Project; className?: string }) {
  if (!project.href) return null;
  const external = project.href.startsWith("http");
  return (
    <a
      href={project.href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer nofollow ugc" : undefined}
      className={`group/link inline-flex items-center gap-1.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:text-[var(--accent)] ${className ?? ""}`}
    >
      {project.linkLabel ?? "View"}
      <ArrowUpRight className="h-4 w-4 transition-transform group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5" />
    </a>
  );
}

export function Cover({
  assetId, src, srcSet, width, height, className,
}: {
  assetId?: string;
  src?: string;
  srcSet?: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  // A cover id with no upload behind it (a demo fixture, or a deleted file)
  // renders a neutral placeholder so the layout still reads correctly.
  if (!src) {
    return assetId ? <div className={`bg-[var(--background-secondary)] ${className ?? ""}`} aria-hidden /> : null;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} srcSet={srcSet} width={width} height={height} alt="" loading="lazy" className={className} />
  );
}
