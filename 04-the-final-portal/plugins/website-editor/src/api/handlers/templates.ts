// R006 — Template marketplace handlers.

import type { PluginCtx } from "../../lib/aquaPluginTypes";
import type { Block } from "../../types/block";
import {
  listAllTemplates,
  saveTemplate,
  deleteSavedTemplate,
} from "../../server/templateMarketplace";
import { fail, ok, readJsonBody, readQuery } from "../helpers";

// GET /templates — gallery feed (builtin + per-agency saved).
export async function handleListTemplates(_req: Request, ctx: PluginCtx): Promise<Response> {
  if (!ctx.agencyId) return fail("agency scope required", 400);
  const templates = await listAllTemplates(ctx.storage, ctx.agencyId);
  return ok({ templates });
}

// POST /templates — operator saves the current page as a template.
// body: { label, description?, tags?, coverUrl?, blocks }
export async function handleSaveTemplate(req: Request, ctx: PluginCtx): Promise<Response> {
  if (!ctx.agencyId) return fail("agency scope required", 400);
  const body = await readJsonBody<{
    label?: string;
    description?: string;
    tags?: string[];
    coverUrl?: string;
    blocks?: Block[];
  }>(req);
  if (!body?.label) return fail("label required", 400);
  if (!Array.isArray(body.blocks)) return fail("blocks (BlockTree[]) required", 400);
  const saved = await saveTemplate(ctx.storage, ctx.agencyId, {
    label: body.label,
    ...(body.description ? { description: body.description } : {}),
    ...(body.tags ? { tags: body.tags } : {}),
    ...(body.coverUrl ? { coverUrl: body.coverUrl } : {}),
    blocks: body.blocks,
    savedBy: String(ctx.actor ?? "u_unknown"),
  });
  return ok({ template: saved }, { status: 201 });
}

// DELETE /templates?id=...
export async function handleDeleteTemplate(req: Request, ctx: PluginCtx): Promise<Response> {
  if (!ctx.agencyId) return fail("agency scope required", 400);
  const q = readQuery(req);
  if (!q.id) return fail("id required", 400);
  const removed = await deleteSavedTemplate(ctx.storage, ctx.agencyId, q.id);
  if (!removed) return fail("template not found", 404);
  return ok({ id: q.id });
}
