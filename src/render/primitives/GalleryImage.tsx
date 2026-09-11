import { asset, type RenderCtx } from "../context";

/**
 * One gallery image, optionally linked.
 *
 * An item with no image behind it yet — just added, or its upload cleared —
 * renders a neutral block at the right aspect ratio, so the layout stays honest
 * instead of collapsing to nothing.
 */
export function GalleryImage({
  item, ctx, className, aspect,
}: {
  item: { assetId: string; caption?: string; href?: string };
  ctx: RenderCtx;
  className?: string;
  aspect?: string;
}) {
  const image = asset(ctx, item.assetId);

  const media = image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image.src}
      srcSet={image.srcSet}
      alt={item.caption ?? ""}
      width={image.width}
      height={image.height}
      loading="lazy"
      className={`w-full rounded-[var(--radius)] object-cover ${className ?? ""}`}
      style={{ aspectRatio: aspect }}
    />
  ) : (
    <div
      className={`w-full rounded-[var(--radius)] bg-[var(--background-secondary)] ${className ?? ""}`}
      style={{ aspectRatio: aspect ?? "4 / 3" }}
      aria-hidden
    />
  );

  const inner = (
    <figure>
      {media}
      {item.caption && (
        <figcaption className="mt-2 font-[family-name:var(--font-mono)] text-xs text-[var(--foreground-subtle)]">
          {item.caption}
        </figcaption>
      )}
    </figure>
  );

  if (!item.href) return inner;
  const external = item.href.startsWith("http");
  return (
    <a
      href={item.href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer nofollow ugc" : undefined}
      className="block transition-opacity hover:opacity-90"
    >
      {inner}
    </a>
  );
}
