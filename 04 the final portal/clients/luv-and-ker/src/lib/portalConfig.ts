import "server-only";
import portalConfig from "../../portal-config.json";

export interface BrandKit {
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontHeading: string;
  fontBody: string;
  borderRadius: string;
  customCSS: string;
}

export interface InstalledPluginRef {
  id: string;
  version: string;
}

export interface PortalConfig {
  client: {
    id: string;
    slug: string;
    name: string;
    tagline: string;
    agencyId: string;
    websiteUrl: string;
  };
  brand: BrandKit;
  auth: {
    origin: string;
    embedLoginPath: string;
    loginPath: string;
    cookieName: string;
  };
  installedPlugins: InstalledPluginRef[];
  portalVariants: Record<string, string>;
  content: Record<string, string>;
}

export function getPortalConfig(): PortalConfig {
  return portalConfig as PortalConfig;
}

export function getContent(key: string, fallback = ""): string {
  const cfg = getPortalConfig();
  return cfg.content[key] ?? fallback;
}

export function hasPlugin(id: string): boolean {
  return getPortalConfig().installedPlugins.some(p => p.id === id);
}

export function getAuthOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_PORTAL_AUTH_ORIGIN ?? process.env.PORTAL_API_ORIGIN;
  return fromEnv ?? getPortalConfig().auth.origin;
}
