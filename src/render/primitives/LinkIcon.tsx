import {
  AppWindow, AtSign, BookOpen, Camera, Cloud, Code, Cpu, Database, Gauge,
  Globe, LineChart, Mail, Megaphone, Palette, PenTool, Server, Shield,
  Smartphone, Sparkles, Terminal, Users, Wrench, Zap,
  type LucideIcon,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

/**
 * The icon allowlist, resolved.
 *
 * Users pick from this fixed set — never a free-form icon name — so a document
 * can't reference something that isn't bundled. A test keeps this map and the
 * schema enum in sync.
 *
 * lucide 1.x removed brand marks for trademark reasons, so the five social
 * glyphs are inlined here rather than pinning the library to an old version.
 */

type IconProps = SVGProps<SVGSVGElement> & { strokeWidth?: number };

const brand = (path: string): ComponentType<IconProps> =>
  function BrandIcon({ className, ...rest }: IconProps) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className} {...rest}>
        <path d={path} />
      </svg>
    );
  };

const Github = brand(
  "M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.1 4.9 18.1 5.2 18.1 5.2c.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z",
);
const Linkedin = brand(
  "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM2.4 21.5h5.2V9.3H2.4v12.2Zm7.4-12.2h5v1.7h.1a5.5 5.5 0 0 1 4.9-2.7c5.2 0 6.2 3.4 6.2 7.9v7.3h-5.2v-6.5c0-1.5 0-3.5-2.2-3.5s-2.5 1.7-2.5 3.4v6.6H9.8V9.3Z",
);
const XMark = brand(
  "M18.9 2H22l-7 8 8.3 12h-6.5l-5-7.3L5.9 22H2.8l7.5-8.6L2.3 2h6.6l4.6 6.7L18.9 2Zm-1.1 18h1.7L7.3 3.8H5.5L17.8 20Z",
);
const Instagram = brand(
  "M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.3 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c0 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2 0-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2-.1-1.3-.1-1.7-.1-4.9s0-3.6.1-4.9c0-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4 1.3-.1 1.7-.1 4.9-.1Zm0 3.8a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm0 9.9a3.9 3.9 0 1 1 0-7.8 3.9 3.9 0 0 1 0 7.8Zm7.6-10.1a1.4 1.4 0 1 1-2.8 0 1.4 1.4 0 0 1 2.8 0Z",
);
const Dribbble = brand(
  "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.6 4.6a8.4 8.4 0 0 1 1.9 5.3c-.3-.1-3.1-.6-5.9-.3l-.5-1.2a26 26 0 0 0 4.5-3.8ZM12 3.5c2 0 3.9.8 5.3 2a22 22 0 0 1-4.2 3.5A44 44 0 0 0 9.9 4a8.5 8.5 0 0 1 2.1-.5ZM8.2 4.6a52 52 0 0 1 3.2 5A32 32 0 0 1 3.7 10a8.5 8.5 0 0 1 4.5-5.4ZM3.5 12v-.3c.5 0 4.9.1 8.6-1 .2.5.4.9.6 1.4-3.3 1-6.2 3.7-7.5 5.6A8.4 8.4 0 0 1 3.5 12Zm8.5 8.5c-1.9 0-3.7-.7-5.1-1.8 1-1.7 3.5-4.1 7-5.2a35 35 0 0 1 1.8 6.4c-1.1.4-2.4.6-3.7.6Zm5.2-1.4a37 37 0 0 0-1.7-6.1c2.6-.4 4.9.3 5.2.4a8.5 8.5 0 0 1-3.5 5.7Z",
);

const ICONS: Record<string, LucideIcon | ComponentType<IconProps>> = {
  "app-window": AppWindow, wrench: Wrench, gauge: Gauge, code: Code,
  database: Database, cloud: Cloud, cpu: Cpu, palette: Palette,
  "pen-tool": PenTool, camera: Camera, megaphone: Megaphone,
  "line-chart": LineChart, shield: Shield, smartphone: Smartphone,
  server: Server, sparkles: Sparkles, zap: Zap, users: Users,
  "book-open": BookOpen, terminal: Terminal,
  github: Github, linkedin: Linkedin, mail: Mail, x: XMark,
  globe: Globe, instagram: Instagram, dribbble: Dribbble, email: AtSign,
};

export function LinkIcon({ name, className }: { name?: string; className?: string }) {
  const Icon = name ? ICONS[name] : undefined;
  return Icon ? <Icon className={className} strokeWidth={1.75} /> : null;
}

export const ICON_IDS = Object.keys(ICONS);
