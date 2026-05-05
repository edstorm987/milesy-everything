import "server-only";
// Plugin manifest dispatch. The shared portal at portal/_routeResolver
// owns the heavy machinery — sidebar layout, multi-tenant scoping, the
// admin chrome. The per-client portal is much thinner: it renders a
// fixed set of end-customer pages (account, orders, affiliates,
// storefront), and looks up which storefront blocks are available to
// render hand-coded variants when no published block tree exists yet.
//
// `getPluginManifest(id)` returns the lazily-imported manifest for a
// plugin listed in portal-config.json. `getStorefrontBlock(blockId)`
// looks the block up across all installed plugins. Heavy server logic
// stays on the shared portal — these helpers exist so per-client pages
// can ask "is this plugin installed?" / "what blocks did it ship?"
// without duplicating manifest contents.

import type { PortalConfig } from "@/lib/portalConfig";
import { getPortalConfig } from "@/lib/portalConfig";

interface MinimalManifest {
  id: string;
  storefront?: { blocks?: { id: string; label?: string }[] };
}

const manifestImports: Record<string, () => Promise<{ default: MinimalManifest }>> = {
  "website-editor": () => import("@aqua/plugin-website-editor"),
  "ecommerce": () => import("@aqua/plugin-ecommerce"),
  "memberships": () => import("@aqua/plugin-memberships"),
  "affiliates": () => import("@aqua/plugin-affiliates"),
  "client-crm": () => import("@aqua/plugin-client-crm"),
  "forms": () => import("@aqua/plugin-forms"),
};

const cache = new Map<string, MinimalManifest>();

export async function getPluginManifest(id: string): Promise<MinimalManifest | null> {
  const cfg: PortalConfig = getPortalConfig();
  if (!cfg.installedPlugins.some(p => p.id === id)) return null;
  if (cache.has(id)) return cache.get(id)!;
  const importer = manifestImports[id];
  if (!importer) return null;
  const mod = await importer();
  cache.set(id, mod.default);
  return mod.default;
}

export interface StorefrontBlockRef {
  pluginId: string;
  blockId: string;
  label?: string;
}

export async function listStorefrontBlocks(): Promise<StorefrontBlockRef[]> {
  const cfg = getPortalConfig();
  const out: StorefrontBlockRef[] = [];
  for (const ref of cfg.installedPlugins) {
    const manifest = await getPluginManifest(ref.id);
    if (!manifest) continue;
    for (const block of manifest.storefront?.blocks ?? []) {
      out.push({ pluginId: ref.id, blockId: block.id, label: block.label });
    }
  }
  return out;
}

export async function hasStorefrontBlock(blockId: string): Promise<boolean> {
  const blocks = await listStorefrontBlocks();
  return blocks.some(b => b.blockId === blockId);
}
