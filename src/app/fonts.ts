import {
  Bricolage_Grotesque, DM_Sans, DM_Serif_Display, IBM_Plex_Mono, Inter,
  JetBrains_Mono, Libre_Baskerville, Manrope, Playfair_Display, Source_Sans_3,
  Space_Grotesk, Space_Mono,
} from "next/font/google";

/**
 * Every family behind a curated pairing in `src/lib/schema/tokens.ts`.
 *
 * next/font emits a hashed family name, so `tokensToCss` references these CSS
 * variables rather than family names. Options are written out per call because
 * next/font only accepts statically analysable literals — no shared spread.
 *
 * Only the three used by the default preset are preloaded; the rest declare
 * their @font-face and are fetched by whichever site references them.
 */
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], display: "swap", variable: "--font-space-grotesk" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-jetbrains-mono" });

const playfair = Playfair_Display({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-playfair" });
const manrope = Manrope({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-manrope" });
const spaceMono = Space_Mono({ subsets: ["latin"], display: "swap", preload: false, weight: ["400", "700"], variable: "--font-space-mono" });
const dmSerif = DM_Serif_Display({ subsets: ["latin"], display: "swap", preload: false, weight: "400", variable: "--font-dm-serif" });
const dmSans = DM_Sans({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-dm-sans" });
const libre = Libre_Baskerville({ subsets: ["latin"], display: "swap", preload: false, weight: ["400", "700"], variable: "--font-libre" });
const sourceSans = Source_Sans_3({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-source-sans" });
const ibmMono = IBM_Plex_Mono({ subsets: ["latin"], display: "swap", preload: false, weight: ["400", "500", "700"], variable: "--font-ibm-mono" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-bricolage" });

/** Applied to <body> so every variable is in scope for any document. */
export const fontVariables = [
  inter, spaceGrotesk, jetbrainsMono, playfair, manrope, spaceMono,
  dmSerif, dmSans, libre, sourceSans, ibmMono, bricolage,
]
  .map((f) => f.variable)
  .join(" ");
