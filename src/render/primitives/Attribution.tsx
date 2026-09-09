import { asset, type RenderCtx } from "../context";

/** Name, role and optional avatar — shared by every testimonial layout. */
export function Attribution({
  name, role, avatarId, ctx, className,
}: {
  name: string;
  role?: string;
  avatarId?: string;
  ctx: RenderCtx;
  className?: string;
}) {
  const avatar = asset(ctx, avatarId);
  return (
    <figcaption className={`flex items-center gap-3 ${className ?? ""}`}>
      {avatar && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar.src} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
      )}
      <span>
        <span className="block text-sm font-medium text-[var(--foreground)]">{name}</span>
        {role && (
          <span className="block font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
            {role}
          </span>
        )}
      </span>
    </figcaption>
  );
}
