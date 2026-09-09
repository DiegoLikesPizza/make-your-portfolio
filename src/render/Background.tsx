import type { CSSProperties } from "react";
import type { BackgroundConfig, Background as Bg } from "@/lib/schema/background";
import { MIN_MEDIA_OVERLAY_OPACITY } from "@/lib/schema/background";
import { asset, type RenderCtx } from "./context";

/**
 * Paints one background layer behind its container.
 *
 * The light/dark pair is rendered as two absolutely-positioned layers toggled
 * by CSS, rather than picked in JS — the server has no idea which scheme the
 * visitor is in when `colorScheme` is "auto".
 */

function gradientCss(bg: Extract<Bg, { kind: "gradient" }>): string {
  const stops = bg.stops
    .slice()
    .sort((a, b) => a.pos - b.pos)
    .map((s) => `${s.color} ${s.pos}%`)
    .join(", ");
  if (bg.type === "linear") return `linear-gradient(${bg.angle}deg, ${stops})`;
  if (bg.type === "radial") return `radial-gradient(circle at center, ${stops})`;
  return `conic-gradient(from ${bg.angle}deg at center, ${stops})`;
}

function patternCss(bg: Extract<Bg, { kind: "pattern" }>): CSSProperties {
  const size = `${bg.scale * 8}px`;
  const c = bg.color;
  switch (bg.style) {
    case "dots":
      return { backgroundImage: `radial-gradient(${c} 1px, transparent 1px)`, backgroundSize: `${size} ${size}` };
    case "grid":
      return {
        backgroundImage: `linear-gradient(${c} 1px, transparent 1px), linear-gradient(90deg, ${c} 1px, transparent 1px)`,
        backgroundSize: `${size} ${size}`,
      };
    case "stripes":
      return { backgroundImage: `repeating-linear-gradient(45deg, ${c} 0 2px, transparent 2px ${size})` };
    case "topo":
      return {
        backgroundImage: `repeating-radial-gradient(circle at 50% 50%, transparent 0 ${size}, ${c} ${size} calc(${size} + 1px))`,
      };
    case "noise":
      // A tiny inline SVG turbulence: no network request, no extra asset.
      return {
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.8'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
      };
  }
}

function Layer({ bg, ctx }: { bg: Bg; ctx: RenderCtx }) {
  if (bg.kind === "none") return null;

  if (bg.kind === "solid") {
    return <div className="absolute inset-0" style={{ background: bg.color }} />;
  }

  if (bg.kind === "gradient") {
    return <div className="absolute inset-0" style={{ background: gradientCss(bg) }} />;
  }

  if (bg.kind === "pattern") {
    return <div className="absolute inset-0" style={{ ...patternCss(bg), opacity: bg.opacity }} />;
  }

  const media = asset(ctx, bg.assetId);
  // The overlay is never optional on media: text has to stay readable even if
  // the image fails to load or the user dragged opacity to zero.
  const opacity = Math.max(bg.overlay.opacity, MIN_MEDIA_OVERLAY_OPACITY);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {media && bg.kind === "animated" && media.video ? (
        <video
          className="h-full w-full object-cover"
          style={{ objectPosition: bg.position.replace("-", " "), filter: bg.blur ? `blur(${bg.blur}px)` : undefined }}
          src={media.video}
          poster={media.poster}
          autoPlay
          muted
          loop
          playsInline
          // Reduced motion is honoured by the client controller in Shell.
          data-motion="background"
        />
      ) : media ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="h-full w-full"
          style={{
            objectFit: bg.fit === "tile" ? undefined : bg.fit,
            objectPosition: bg.position.replace("-", " "),
            filter: bg.blur ? `blur(${bg.blur}px)` : undefined,
          }}
          src={media.src}
          srcSet={media.srcSet}
          alt=""
          aria-hidden
          loading="lazy"
        />
      ) : null}
      <div className="absolute inset-0" style={{ background: bg.overlay.color, opacity }} />
    </div>
  );
}

export function Background({ config, ctx }: { config: BackgroundConfig | undefined; ctx: RenderCtx }) {
  if (!config) return null;
  const { light, dark, sameInBoth } = config;
  if (light.kind === "none" && (sameInBoth || dark.kind === "none")) return null;

  return (
    <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
      <div className="absolute inset-0" data-bg={sameInBoth ? undefined : "light"}>
        <Layer bg={light} ctx={ctx} />
      </div>
      {!sameInBoth && (
        <div className="absolute inset-0" data-bg="dark">
          <Layer bg={dark} ctx={ctx} />
        </div>
      )}
    </div>
  );
}
