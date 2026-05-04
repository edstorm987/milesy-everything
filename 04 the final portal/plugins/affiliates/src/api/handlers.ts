// HTTP handlers for the affiliates plugin. Same response envelope as
// the other Aqua plugins.

import type { PluginCtx } from "../lib/aquaPluginTypes";
import { containerFor } from "../server/foundationAdapter";
import type {
  AffiliateFilter,
  AttributionFilter,
  CreateAffiliateInput,
  CreateReferralCodeInput,
  PayoutFilter,
  ReferralCodeFilter,
  UpdateAffiliatePatch,
  UpdateReferralCodePatch,
} from "../lib/domain";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
const badRequest = (m: string): Response => json({ ok: false, error: m }, 400);
const notFound = (m: string): Response => json({ ok: false, error: m }, 404);
const unprocessable = (m: string): Response => json({ ok: false, error: m }, 422);
function methodGuard(req: Request, expected: string): Response | null {
  return req.method === expected ? null : json({ ok: false, error: "method_not_allowed" }, 405);
}
async function safeJson<T>(req: Request): Promise<T | null> {
  try { return (await req.json()) as T; }
  catch { return null; }
}

function buildContainer(ctx: PluginCtx) {
  if (!ctx.clientId) throw new Error("affiliates handlers require a client scope.");
  return containerFor({ agencyId: ctx.agencyId, clientId: ctx.clientId, storage: ctx.storage, install: ctx.install });
}

function defaultCommissionFromConfig(ctx: PluginCtx): number {
  const v = ctx.install.config.defaultCommissionPercent;
  return typeof v === "number" ? v : 10;
}

// ─── Affiliates ──────────────────────────────────────────────────────────

export async function listAffiliatesHandler(req: Request, ctx: PluginCtx): Promise<Response> {
  if (req.method !== "GET") return json({ ok: false, error: "method_not_allowed" }, 405);
  const url = new URL(req.url);
  const filter: AffiliateFilter = {
    status: (url.searchParams.get("status") ?? undefined) as AffiliateFilter["status"],
    query: url.searchParams.get("q") ?? undefined,
  };
  return json({ ok: true, affiliates: await buildContainer(ctx).affiliates.list(filter) });
}

export async function createAffiliateHandler(req: Request, ctx: PluginCtx): Promise<Response> {
  const guard = methodGuard(req, "POST");
  if (guard) return guard;
  const body = await safeJson<CreateAffiliateInput>(req);
  if (!body || !body.endCustomerUserId || !body.displayName || !body.payoutEmail) {
    return badRequest("endCustomerUserId + displayName + payoutEmail required.");
  }
  try {
    const aff = await buildContainer(ctx).affiliates.enroll(body, ctx.actor);
    return json({ ok: true, affiliate: aff }, 201);
  } catch (err) {
    return unprocessable(err instanceof Error ? err.message : String(err));
  }
}

export async function updateAffiliateHandler(req: Request, ctx: PluginCtx): Promise<Response> {
  const guard = methodGuard(req, "PATCH");
  if (guard) return guard;
  const body = await safeJson<{ id: string; patch: UpdateAffiliatePatch }>(req);
  if (!body?.id) return badRequest("id required.");
  try {
    const aff = await buildContainer(ctx).affiliates.update(body.id, body.patch ?? {}, ctx.actor);
    return aff ? json({ ok: true, affiliate: aff }) : notFound("affiliate not found");
  } catch (err) {
    return unprocessable(err instanceof Error ? err.message : String(err));
  }
}

export async function deleteAffiliateHandler(req: Request, ctx: PluginCtx): Promise<Response> {
  const guard = methodGuard(req, "DELETE");
  if (guard) return guard;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return badRequest("id required.");
  const ok = await buildContainer(ctx).affiliates.delete(id, ctx.actor);
  return ok ? json({ ok: true }) : notFound("affiliate not found");
}

// ─── Codes ───────────────────────────────────────────────────────────────

export async function listCodesHandler(req: Request, ctx: PluginCtx): Promise<Response> {
  if (req.method !== "GET") return json({ ok: false, error: "method_not_allowed" }, 405);
  const url = new URL(req.url);
  const filter: ReferralCodeFilter = {
    affiliateId: url.searchParams.get("affiliateId") ?? undefined,
    status: (url.searchParams.get("status") ?? undefined) as ReferralCodeFilter["status"],
    query: url.searchParams.get("q") ?? undefined,
  };
  return json({ ok: true, codes: await buildContainer(ctx).codes.list(filter) });
}

export async function createCodeHandler(req: Request, ctx: PluginCtx): Promise<Response> {
  const guard = methodGuard(req, "POST");
  if (guard) return guard;
  const body = await safeJson<CreateReferralCodeInput>(req);
  if (!body?.affiliateId) return badRequest("affiliateId required.");
  try {
    const code = await buildContainer(ctx).codes.create(body, ctx.actor);
    return json({ ok: true, code }, 201);
  } catch (err) {
    return unprocessable(err instanceof Error ? err.message : String(err));
  }
}

export async function updateCodeHandler(req: Request, ctx: PluginCtx): Promise<Response> {
  const guard = methodGuard(req, "PATCH");
  if (guard) return guard;
  const body = await safeJson<{ id: string; patch: UpdateReferralCodePatch }>(req);
  if (!body?.id) return badRequest("id required.");
  try {
    const code = await buildContainer(ctx).codes.update(body.id, body.patch ?? {}, ctx.actor);
    return code ? json({ ok: true, code }) : notFound("code not found");
  } catch (err) {
    return unprocessable(err instanceof Error ? err.message : String(err));
  }
}

// ─── Attributions ────────────────────────────────────────────────────────

export async function listAttributionsHandler(req: Request, ctx: PluginCtx): Promise<Response> {
  if (req.method !== "GET") return json({ ok: false, error: "method_not_allowed" }, 405);
  const url = new URL(req.url);
  const filter: AttributionFilter = {
    affiliateId: url.searchParams.get("affiliateId") ?? undefined,
    orderId: url.searchParams.get("orderId") ?? undefined,
    status: (url.searchParams.get("status") ?? undefined) as AttributionFilter["status"],
  };
  return json({ ok: true, attributions: await buildContainer(ctx).attributions.list(filter) });
}

export async function approveAttributionHandler(req: Request, ctx: PluginCtx): Promise<Response> {
  const guard = methodGuard(req, "POST");
  if (guard) return guard;
  const body = await safeJson<{ id: string }>(req);
  if (!body?.id) return badRequest("id required.");
  const out = await buildContainer(ctx).attributions.approve(body.id, ctx.actor);
  return out ? json({ ok: true, attribution: out }) : notFound("attribution not found");
}

// ─── Payouts ─────────────────────────────────────────────────────────────

export async function listPayoutsHandler(req: Request, ctx: PluginCtx): Promise<Response> {
  if (req.method !== "GET") return json({ ok: false, error: "method_not_allowed" }, 405);
  const url = new URL(req.url);
  const filter: PayoutFilter = {
    affiliateId: url.searchParams.get("affiliateId") ?? undefined,
    status: (url.searchParams.get("status") ?? undefined) as PayoutFilter["status"],
  };
  return json({ ok: true, payouts: await buildContainer(ctx).payouts.list(filter) });
}

export async function schedulePayoutHandler(req: Request, ctx: PluginCtx): Promise<Response> {
  const guard = methodGuard(req, "POST");
  if (guard) return guard;
  const body = await safeJson<{ affiliateId: string; method?: "paypal" | "manual" | "stripe-connect"; scheduledFor?: number }>(req);
  if (!body?.affiliateId) return badRequest("affiliateId required.");
  try {
    const out = await buildContainer(ctx).payouts.schedule(
      { affiliateId: body.affiliateId, method: body.method, scheduledFor: body.scheduledFor },
      ctx.actor,
      (ctx.install.config.defaultPayoutMethod as "paypal" | "manual" | "stripe-connect" | undefined) ?? "manual",
    );
    if (!out) return unprocessable("No approved attributions outstanding for this affiliate.");
    return json({ ok: true, payout: out }, 201);
  } catch (err) {
    return unprocessable(err instanceof Error ? err.message : String(err));
  }
}

export async function markPayoutPaidHandler(req: Request, ctx: PluginCtx): Promise<Response> {
  const guard = methodGuard(req, "POST");
  if (guard) return guard;
  const body = await safeJson<{ id: string; externalRef: string; method?: "paypal" | "manual" | "stripe-connect" }>(req);
  if (!body?.id || !body.externalRef) return badRequest("id + externalRef required.");
  try {
    const out = await buildContainer(ctx).payouts.markPaid(body.id, { externalRef: body.externalRef, method: body.method }, ctx.actor);
    return out ? json({ ok: true, payout: out }) : notFound("payout not found");
  } catch (err) {
    return unprocessable(err instanceof Error ? err.message : String(err));
  }
}

// ─── Customer-facing ─────────────────────────────────────────────────────

export async function meEnrollHandler(req: Request, ctx: PluginCtx): Promise<Response> {
  const guard = methodGuard(req, "POST");
  if (guard) return guard;
  const body = await safeJson<{ payoutEmail: string; displayName?: string }>(req);
  if (!body?.payoutEmail) return badRequest("payoutEmail required.");
  try {
    const c = buildContainer(ctx);
    const aff = await c.affiliates.enroll({
      endCustomerUserId: ctx.actor,
      displayName: body.displayName ?? ctx.actor,
      payoutEmail: body.payoutEmail.trim(),
    }, ctx.actor);
    return json({ ok: true, affiliate: aff }, 201);
  } catch (err) {
    return unprocessable(err instanceof Error ? err.message : String(err));
  }
}

export async function meHandler(req: Request, ctx: PluginCtx): Promise<Response> {
  if (req.method !== "GET") return json({ ok: false, error: "method_not_allowed" }, 405);
  const c = buildContainer(ctx);
  const affiliate = await c.affiliates.getByUser(ctx.actor);
  if (!affiliate) return json({ ok: true, affiliate: null });
  const [codes, attributions, payouts] = await Promise.all([
    c.codes.list({ affiliateId: affiliate.id }),
    c.attributions.listForAffiliate(affiliate.id),
    c.payouts.listForAffiliate(affiliate.id),
  ]);
  return json({ ok: true, affiliate, codes, attributions, payouts });
}

export async function meCreateCodeHandler(req: Request, ctx: PluginCtx): Promise<Response> {
  const guard = methodGuard(req, "POST");
  if (guard) return guard;
  const body = await safeJson<{ code?: string; destinationPath?: string }>(req);
  const c = buildContainer(ctx);
  const affiliate = await c.affiliates.getByUser(ctx.actor);
  if (!affiliate) return notFound("not enrolled as an affiliate");
  if (affiliate.status !== "active") return unprocessable(`affiliate status is ${affiliate.status}`);
  try {
    const code = await c.codes.create(
      { affiliateId: affiliate.id, code: body?.code, destinationPath: body?.destinationPath },
      ctx.actor,
    );
    return json({ ok: true, code }, 201);
  } catch (err) {
    return unprocessable(err instanceof Error ? err.message : String(err));
  }
}

// Hook called by foundation when ecommerce emits `order.created`.
// Mounted as a regular handler so foundation can dispatch via the
// catch-all + an internal "fan-out" route. Until that lands, the
// handler is also reachable via POST /attributions/record.
export async function recordOrderHandler(req: Request, ctx: PluginCtx): Promise<Response> {
  const guard = methodGuard(req, "POST");
  if (guard) return guard;
  const body = await safeJson<{ orderId: string; code?: string; referralCodeId?: string }>(req);
  if (!body?.orderId) return badRequest("orderId required.");
  const out = await buildContainer(ctx).attributions.recordOrder({
    orderId: body.orderId,
    code: body.code,
    referralCodeId: body.referralCodeId,
    defaultCommissionPercent: defaultCommissionFromConfig(ctx),
  });
  return out ? json({ ok: true, attribution: out }) : json({ ok: true, attribution: null });
}
