import "server-only";
// Plugin manifest dispatch. The shared portal at portal/_routeResolver
// owns the heavy machinery — sidebar layout, multi-tenant scoping, the
// admin chrome. The per-client portal is much thinner: it renders a
// fixed set of end-customer pages (account / orders / affiliates /
// storefront) and looks up which storefront blocks each installed
// plugin contributed so hand-coded variants can opt into the same
// catalogue when no published block tree exists yet.
//
// Each plugin exports its own AquaPlugin manifest shape — the field
// names differ slightly across plugins (e.g. block descriptors use
// `type`, not `id`). We treat the manifest as unstructured JSON here
// and only read the bits the per-client portal cares about.

import { getPortalConfig } from "@/lib/portalConfig";

interface RawBlock {
  type?: string;
  id?: string;
  label?: string;
}

interface RawManifest {
  id?: string;
  storefront?: { blocks?: RawBlock[] };
}

const manifestImports: Record<string, () => Promise<unknown>> = {
  "website-editor": () => import("@aqua/plugin-website-editor"),
  "ecommerce": () => import("@aqua/plugin-ecommerce"),
  "memberships": () => import("@aqua/plugin-memberships"),
  "affiliates": () => import("@aqua/plugin-affiliates"),
  "client-crm": () => import("@aqua/plugin-client-crm"),
  "forms": () => import("@aqua/plugin-forms"),
};

const cache = new Map<string, RawManifest>();

export async function getPluginManifest(id: string): Promise<RawManifest | null> {
  const cfg = getPortalConfig();
  if (!cfg.installedPlugins.some(p => p.id === id)) return null;
  if (cache.has(id)) return cache.get(id)!;
  const importer = manifestImports[id];
  if (!importer) return null;
  const mod = (await importer()) as { default?: RawManifest };
  const manifest = mod?.default ?? null;
  if (!manifest) return null;
  cache.set(id, manifest);
  return manifest;
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
      const blockId = block.type ?? block.id;
      if (!blockId) continue;
      out.push({ pluginId: ref.id, blockId, label: block.label });
    }
  }
  return out;
}

export async function hasStorefrontBlock(blockId: string): Promise<boolean> {
  const blocks = await listStorefrontBlocks();
  return blocks.some(b => b.blockId === blockId);
}
