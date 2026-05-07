// Assets — Round 003 implementation. Replaces R1's 501 stubs.
//
// Storage layout (per agency × client tenant via ctx.storage):
//   assets/index           → string[] of asset ids (most-recent first)
//   assets/by-id/<id>      → PortalAsset record
//
// dataUrl is persisted inline (data:image/...;base64,...). Operators
// bring CDN-hosted URLs for large media; this path is for the cover
// imagery the editor toolbar uploads inline. Cap: 8 MiB per file +
// 64 MiB per client. Final CDN-backed pipeline lands when T1 ships
// the storage adapter — drop-in replacement for the inline dataUrl.

import type { PluginCtx, PluginStorage } from "../../lib/aquaPluginTypes";
import { fail, ok, readJsonBody, requireClientScope } from "../helpers";
import { assetId as makeAssetId } from "../../lib/ids";

export interface PortalAsset {
  id: string;
  agencyId: string;
  clientId: string;
  filename: string;
  contentType: string;
  size: number;
  dataUrl: string;
  uploadedAt: number;
  uploadedBy?: string;
  width?: number;
  height?: number;
  alt?: string;
}

export const PER_FILE_CAP_BYTES = 8 * 1024 * 1024;
export const PER_CLIENT_CAP_BYTES = 64 * 1024 * 1024;

const indexKey = (): string => "assets/index";
const byIdKey  = (id: string): string => `assets/by-id/${id}`;

async function loadIndex(storage: PluginStorage): Promise<string[]> {
  const raw = await storage.get<string[]>(indexKey());
  return Array.isArray(raw) ? raw : [];
}

async function loadAssetById(storage: PluginStorage, id: string): Promise<PortalAsset | undefined> {
  return storage.get<PortalAsset>(byIdKey(id));
}

async function loadAllAssets(storage: PluginStorage): Promise<PortalAsset[]> {
  const ids = await loadIndex(storage);
  const out: PortalAsset[] = [];
  for (const id of ids) {
    const a = await loadAssetById(storage, id);
    if (a) out.push(a);
  }
  return out;
}

export function decodeDataUrlSize(dataUrl: string): number {
  const idx = dataUrl.indexOf(",");
  if (idx < 0) return 0;
  const payload = dataUrl.slice(idx + 1);
  const padding = (payload.match(/=+$/)?.[0]?.length ?? 0);
  return Math.floor(payload.length * 3 / 4) - padding;
}

export async function handleListAssets(_req: Request, ctx: PluginCtx): Promise<Response> {
  const scope = requireClientScope(ctx);
  if (!scope.ok) return scope.res;
  const assets = await loadAllAssets(ctx.storage);
  const usedBytes = assets.reduce((acc, a) => acc + a.size, 0);
  return ok({ assets, usedBytes, capBytes: PER_CLIENT_CAP_BYTES });
}

interface UploadBody {
  filename?: string;
  contentType?: string;
  dataUrl?: string;
  alt?: string;
  width?: number;
  height?: number;
  uploadedBy?: string;
}

export async function handleUploadAsset(req: Request, ctx: PluginCtx): Promise<Response> {
  const scope = requireClientScope(ctx);
  if (!scope.ok) return scope.res;
  const body = await readJsonBody<UploadBody>(req);
  if (!body?.dataUrl || !body.filename || !body.contentType) {
    return fail("filename, contentType, dataUrl required", 400);
  }
  if (!body.dataUrl.startsWith("data:")) {
    return fail("dataUrl must be a data: URI", 400);
  }
  const size = decodeDataUrlSize(body.dataUrl);
  if (size > PER_FILE_CAP_BYTES) {
    return fail(`file exceeds ${PER_FILE_CAP_BYTES} byte cap`, 413);
  }
  const existing = await loadAllAssets(ctx.storage);
  const usedBytes = existing.reduce((acc, a) => acc + a.size, 0);
  if (usedBytes + size > PER_CLIENT_CAP_BYTES) {
    return fail(`client storage cap reached`, 413);
  }

  const id = makeAssetId();
  const asset: PortalAsset = {
    id,
    agencyId: scope.agencyId,
    clientId: scope.clientId,
    filename: body.filename,
    contentType: body.contentType,
    size,
    dataUrl: body.dataUrl,
    uploadedAt: Date.now(),
    uploadedBy: body.uploadedBy,
    width: body.width,
    height: body.height,
    alt: body.alt,
  };
  await ctx.storage.set(byIdKey(id), asset);
  const ids = await loadIndex(ctx.storage);
  await ctx.storage.set(indexKey(), [id, ...ids]);
  return ok({ asset });
}

export async function handleDeleteAsset(req: Request, ctx: PluginCtx): Promise<Response> {
  const scope = requireClientScope(ctx);
  if (!scope.ok) return scope.res;
  const url = new URL(req.url);
  const m = url.pathname.match(/\/assets\/([^/?#]+)$/);
  const id = m?.[1] ?? url.searchParams.get("id");
  if (!id) return fail("asset id required (path or ?id=)", 400);
  const existing = await loadAssetById(ctx.storage, id);
  if (!existing || existing.agencyId !== scope.agencyId || existing.clientId !== scope.clientId) {
    return fail("not found", 404);
  }
  await ctx.storage.del(byIdKey(id));
  const ids = await loadIndex(ctx.storage);
  await ctx.storage.set(indexKey(), ids.filter(x => x !== id));
  return ok({ deleted: true });
}
