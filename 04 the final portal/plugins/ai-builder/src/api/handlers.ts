// ai-builder API handlers. Round-7.

import type { PluginCtx } from "../lib/aquaPluginTypes";
import { buildContainer } from "../server/generationService";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function methodGuard(req: Request, allowed: string): Response | null {
  if (req.method === allowed) return null;
  return json({ ok: false, error: "method_not_allowed" }, 405);
}

async function safeJson<T>(req: Request): Promise<T | null> {
  try { return await req.json() as T; }
  catch { return null; }
}

// GET /status — light probe for the editor topbar's ✨ Generate
// button. `ready` is true only when the API key is configured;
// otherwise the button stays hidden so operators don't hit a 500.
export async function statusHandler(req: Request, ctx: PluginCtx): Promise<Response> {
  if (req.method !== "GET") return json({ ok: false, error: "method_not_allowed" }, 405);
  const config = (ctx.install.config ?? {}) as { anthropicApiKey?: string };
  return json({ ok: true, ready: Boolean(config.anthropicApiKey) });
}

// POST /generate — body { prompt, contextHints?, modelOverride? }
export async function generateHandler(req: Request, ctx: PluginCtx): Promise<Response> {
  const guard = methodGuard(req, "POST");
  if (guard) return guard;
  const body = await safeJson<{ prompt: string; contextHints?: string; modelOverride?: string }>(req);
  if (!body?.prompt) return json({ ok: false, error: "prompt required" }, 400);
  const c = buildContainer(ctx);
  const result = await c.generations.generate({
    prompt: body.prompt,
    ...(body.contextHints ? { contextHints: body.contextHints } : {}),
    ...(body.modelOverride ? { modelOverride: body.modelOverride } : {}),
  });
  return json({ ok: true, generation: result });
}

// GET /generations — list recent generations.
export async function listGenerationsHandler(req: Request, ctx: PluginCtx): Promise<Response> {
  if (req.method !== "GET") return json({ ok: false, error: "method_not_allowed" }, 405);
  const url = new URL(req.url);
  const limit = Math.max(1, Math.min(200, Number(url.searchParams.get("limit") ?? 50)));
  const c = buildContainer(ctx);
  const rows = await c.generations.list(limit);
  return json({ ok: true, generations: rows });
}

// GET /generations/get?id=...
export async function getGenerationHandler(req: Request, ctx: PluginCtx): Promise<Response> {
  if (req.method !== "GET") return json({ ok: false, error: "method_not_allowed" }, 405);
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return json({ ok: false, error: "id required" }, 400);
  const c = buildContainer(ctx);
  const record = await c.generations.get(id);
  if (!record) return json({ ok: false, error: "not found" }, 404);
  return json({ ok: true, generation: record });
}

// GET /metrics — running cache-hit + cost-cents totals.
export async function metricsHandler(req: Request, ctx: PluginCtx): Promise<Response> {
  if (req.method !== "GET") return json({ ok: false, error: "method_not_allowed" }, 405);
  const c = buildContainer(ctx);
  return json({ ok: true, metrics: await c.generations.metrics() });
}

// GET /settings — returns the per-install config (with the API key
// masked) so the Settings page can render its current state.
export async function getSettingsHandler(req: Request, ctx: PluginCtx): Promise<Response> {
  if (req.method !== "GET") return json({ ok: false, error: "method_not_allowed" }, 405);
  const config = (ctx.install.config ?? {}) as Record<string, unknown>;
  const apiKey = (config.anthropicApiKey as string | undefined) ?? "";
  const masked = apiKey ? `${apiKey.slice(0, 7)}…${apiKey.slice(-4)}` : "";
  return json({
    ok: true,
    settings: {
      ...config,
      anthropicApiKey: masked,
      hasApiKey: apiKey.length > 0,
    },
  });
}

// POST /settings — updates the per-install config. Skips the API key
// when the body sends back the masked value (sentinel pattern).
export async function saveSettingsHandler(req: Request, ctx: PluginCtx): Promise<Response> {
  const guard = methodGuard(req, "POST");
  if (guard) return guard;
  const body = await safeJson<Record<string, unknown>>(req);
  if (!body) return json({ ok: false, error: "body required" }, 400);
  // Don't overwrite the API key when the payload sends the masked
  // placeholder back (it means the operator didn't change it).
  const next: Record<string, unknown> = { ...(ctx.install.config ?? {}) };
  for (const [k, v] of Object.entries(body)) {
    if (k === "anthropicApiKey" && typeof v === "string" && v.includes("…")) continue;
    if (k === "hasApiKey") continue;
    next[k] = v;
  }
  // Foundation pluginRuntime port shape isn't fully typed in this
  // plugin's vendored types — cast through unknown for the call. The
  // foundation broker accepts the standard updateInstallConfig payload.
  const runtime = ctx.services.pluginRuntime as unknown as {
    updateInstallConfig?(input: { agencyId: string; clientId?: string; pluginId: string; config: Record<string, unknown> }): Promise<void>;
  };
  if (runtime?.updateInstallConfig) {
    await runtime.updateInstallConfig({
      agencyId: ctx.agencyId,
      ...(ctx.clientId ? { clientId: ctx.clientId } : {}),
      pluginId: "ai-builder",
      config: next,
    });
  } else {
    // Fall back to direct storage write under a settings key if the
    // foundation runtime port isn't injected (rare).
    await ctx.storage.set(`t/${ctx.agencyId}/${ctx.clientId ?? "_agency"}/ai-builder/settings`, next);
  }
  return json({ ok: true });
}
