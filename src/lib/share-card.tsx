import { ImageResponse } from "next/og";
import type { PortfolioDoc } from "@/lib/schema/portfolio";
import { plain } from "@/lib/text";
import { SHARE_CARD_SIZE } from "@/lib/seo";

/**
 * The picture a shared portfolio link unfolds into: the owner's name, role and
 * headline in the site's own colours.
 *
 * Drawn with ImageResponse's built-in font. It only reads TTF, OTF or WOFF, and
 * the site's fonts are self-hosted woff2 through next/font; a clean sans that
 * renders beats a matching one that fails.
 */

const truncate = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

export function shareCard(doc: PortfolioDoc): ImageResponse {
  const { palette } = doc.design.tokens;
  const dark = doc.design.colorScheme === "dark";
  const background = dark ? palette.backgroundDark : palette.background;
  const foreground = dark ? palette.foregroundDark : palette.foreground;
  const accent = dark ? palette.accentDark : palette.accent;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background,
          color: foreground,
        }}
      >
        <div style={{ display: "flex", width: 96, height: 12, background: accent }} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 700, lineHeight: 1.1 }}>
            {truncate(doc.profile.name, 40)}
          </div>
          {doc.profile.headline && (
            <div style={{ display: "flex", marginTop: 28, fontSize: 38, lineHeight: 1.35, opacity: 0.78 }}>
              {truncate(plain(doc.profile.headline), 140)}
            </div>
          )}
        </div>
        <div style={{ display: "flex", fontSize: 28, color: accent }}>
          {doc.profile.eyebrow ? truncate(plain(doc.profile.eyebrow), 60) : ""}
        </div>
      </div>
    ),
    // Cached for an hour: a publish shows up in new shares soon, without redrawing per crawler hit.
    { ...SHARE_CARD_SIZE, headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
