import "server-only";
// Plugin manifest dispatch — slim variant for Compass Coaching's
// 4-plugin set (vs Luv & Ker's 6). Same loose-typing approach: each
// plugin's manifest shape varies in block-descriptor field names, so
// we treat the manifests as unstructured JSON.

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
  "memberships": () => import("@aqua/plugin-memberships"),
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
