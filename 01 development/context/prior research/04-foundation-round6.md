# `04` foundation — Round 6 (T1 — mass plugin wire-up + event router)

After R5 the foundation hosted three live plugins (fulfillment +
ecommerce + website-editor) while T2 had landed six more on disk
without anything wiring them in. R6 catches the foundation up: every
plugin T2 has shipped is now mounted, registered, and reachable
end-to-end. The cross-plugin event-bus router that the architecture
has needed since R3 also lands — `subscribeForPlugin` with
tenant-filtered fan-out.

> Built by T1 on 2026-05-05, on top of Round 5 chapter 35
> ([04-end-customer-flow.md](04-end-customer-flow.md)).

## 1. Plugins live after R6 (9)

```
agency-scoped (4)             client-scoped (5)
─────────────────             ─────────────────
fulfillment    (core)         website-editor
agency-hr                     ecommerce
agency-finance                memberships
agency-marketing              affiliates
                              client-crm
```

`fulfillment` keeps its `core: true` flag so `bootstrapAgency`
auto-installs it for every new agency. The other three agency-side
plugins (HR / finance / marketing) and all five client-side plugins
land via the demo seed in dev (or via the marketplace UI in real
agencies — that's fulfillment's surface).

## 2. Plugin wire-up checklist (replicate for any future plugin)

```
 1. plugins/<id>/                            # plugin source from T2/T3
 2. portal/package.json                      # add file:.. dep
 3. portal/next.config.ts.transpilePackages  # add the package id
 4. portal/src/plugins/_registry.ts          # import manifest, push to PLUGINS
 5. portal/src/plugins/foundation-adapters/<id>Foundation.ts
                                             # register*Foundation call
 6. portal/src/plugins/_registry.ts          # side-effect import the adapter
 7. portal/src/server/types.ts               # ActivityCategory += "<cat>"
 8. portal/src/plugins/foundation-adapters/_eventSubscribers.ts
                                             # cross-plugin subscribers (if any)
 9. (refresh node_modules: rm -rf node_modules/@aqua/plugin-<id> && npm install)
10. tsc + npm run smoke
```

R6 ran this for six plugins in one round. The checklist gets shorter
as the foundation matures (steps 7 and the `as unknown as ...` cast
on step 5 disappear once T1's canonical types are imported by every
plugin instead of vendored).

## 3. Shared port objects

`src/plugins/foundation-adapters/_foundationPorts.ts` exports five
small ports every plugin reuses:

```ts
tenantPort         // getClient / getClientForAgency
activityPort       // logActivity / listActivity (cast to unknown — see §6)
eventBusPort       // emit (string-typed name, plugin-defined names allowed)
pluginInstallStorePort  // getInstall
userPort           // getUserById → EndCustomerProfile projection
```

Per-plugin adapter files (`agencyHrFoundation.ts`,
`membershipsFoundation.ts`, …) bind these plus the unique deps each
plugin declares (Stripe factory, ecommerce-orders projection,
membership-benefits projection). Mirror the pattern when adding a new
plugin.

## 4. Cross-plugin port adapters

`_crossPluginPorts.ts` brokers reads across plugin boundaries:

| Adapter                              | Reader              | Reads from         |
|--------------------------------------|---------------------|--------------------|
| `ecommerceOrdersPortForAffiliates`   | affiliates          | ecommerce          |
| `ecommerceOrdersPortForCrm`          | client-crm          | ecommerce          |
| `membershipBenefitsPort`             | client-crm          | memberships        |

Each adapter looks up the source plugin's install in the
(agencyId, clientId) scope, builds a `containerFor` against the
install's storage, calls the source plugin's service method, and
projects the result into the consumer plugin's narrow Port shape.
Source plugin missing → adapter returns null/empty (architecture §6
keeps cross-plugin calls best-effort).

Two ecommerceOrders shapes coexist because affiliates wants
`getOrder(orderId)` while client-crm wants `listForUser({userId,
email})`. Both project from the same `ecommerceContainer.orders`
service.

## 5. Cross-plugin event router (`subscribeForPlugin`)

`src/server/eventBus.ts` gains:

```ts
export function subscribeForPlugin(
  pluginId: string,
  eventName: string,
  handler: (event: AquaEvent) => void | Promise<void>,
): () => void
```

`emit(scope, name, payload)` does two-stage fan-out:

1. **Direct subscribers** (`on(name, handler)`, `on("*", handler)`)
   fire unconditionally. These are foundation-internal listeners.
2. **Plugin subscribers** fan out only into tenant scopes where the
   subscribing plugin is installed and enabled:
   ```ts
   const install =
       getInstall({ agencyId: ev.agencyId, clientId: ev.clientId }, sub.pluginId)
       ?? getInstall({ agencyId: ev.agencyId }, sub.pluginId);
   if (!install || !install.enabled) skip;
   ```
   Agency-wide installs (clientId === undefined) match every event
   emitted under their agency. Client-scoped installs only match
   events whose scope.clientId equals theirs.

The dynamic `await import("./pluginInstalls")` inside emit() dodges a
require-cycle (pluginInstalls → storage → eventBus → pluginInstalls).

`_eventSubscribers.ts` registers the R6 cross-plugin wires:

| Subscriber  | Event                                   | Handler |
|-------------|-----------------------------------------|---------|
| affiliates  | `order.created`                         | `attributions.recordOrder({ orderId, referralCodeId })` |
| client-crm  | `order.created`                         | `activity.ingestOrderCreated(payload)` |
| client-crm  | `affiliate.attribution_recorded`        | `activity.ingestAffiliateAttribution(payload)` |
| client-crm  | `membership.subscription_started`       | `activity.ingestSubscription({status:"started"})` |
| client-crm  | `membership.subscription_canceled`      | `activity.ingestSubscription({status:"canceled"})` |

## 6. Plugin-vendored type drift

Each plugin vendors its own copy of T1's tenancy types so it can
typecheck standalone. The most painful drift is `ActivityCategory` —
the foundation's union is a SUPERSET (R6 added six members to the
foundation but each plugin's copy stayed at the R1/R2 baseline). When
the foundation hands a port like `logActivity` to a plugin's
`registerXxxFoundation`, the plugin's port type expects the narrower
union and rejects the wider implementation.

Workaround in every adapter file:

```ts
registerXxxFoundation({ ... } as unknown as Parameters<typeof registerXxxFoundation>[0]);
```

The `unknown` cast is intentionally noisy. It says "I know the runtime
data only ever uses the narrower set when handed back to this plugin"
and the cast is the cheapest fix until plugins import T1's types
directly. Long-term: move `tenancy.ts` into a `@aqua/foundation-types`
package every plugin re-exports.

## 7. Validator + sidebar widening

R6 also widened two foundation surfaces to accept what plugins ship:

- `_validate.ts` `VALID_CATEGORIES` += `"growth" | "hr" | "finance"`
  (client-crm, agency-hr, agency-finance respectively).
- `_validate.ts` `VALID_PANEL_IDS` += `"customer" | "agency-hr" |
  "agency-finance" | "agency-marketing" | "memberships" | "affiliates"
  | "growth"`. Items at unknown panelIds keep producing a warning at
  boot but no longer reject the manifest.
- `sidebarLayout.ts` now renders "discovered" panels — any panelId
  that has nav items but isn't in `DEFAULT_PANELS` slots into a
  Tools-to-Settings range with a friendly auto-derived label
  (`"agency-hr" → "People"`, `"growth" → "Growth"`, …). Future plugins
  ship new panel ids without a foundation edit.

## 8. Memberships Stripe stub

Memberships's `containerFor` requires a `StripePort`. In dev/demo
nobody has Stripe keys configured. `membershipsFoundation.ts.stripeFor`
returns a NOOP StripePort whose every Stripe method throws a clear
"Stripe not configured (foundation pending)." error. Read-side
methods (PlanService.list, SubscriptionService.list) don't touch
Stripe so admin pages render fine; paid-tier `subscribe` paths throw
with the "Stripe not configured" message until a real Stripe SDK
adapter lands.

This is the minimum change that makes memberships's pages render
green in the smoke without touching plugin source.

## 9. Demo seed shape after R6

```jsonc
{
  "ok": true,
  "agency": { "id": "demo-agency", "name": "Demo · Aqua" },
  "client": { "id": "cli_xxx", "name": "Luv & Ker · Demo" },
  "credentials": {
    "owner":    { "email": "demo@aqua.dev",            "role": "agency-owner" },
    "client":   { "email": "felicia@luvandker.demo",   "role": "client-owner" },
    "customer": { "email": "demo-shopper@aqua.test",   "role": "end-customer" }
  },
  "installedClientPlugins": ["website-editor","ecommerce","memberships","affiliates","client-crm"],
  "installedAgencyPlugins": ["agency-hr","agency-finance","agency-marketing"],
  "installedScope": [
    { "pluginId": "fulfillment",       "enabled": true, "agencyWide": true  },
    { "pluginId": "website-editor",    "enabled": true, "agencyWide": false },
    { "pluginId": "ecommerce",         "enabled": true, "agencyWide": false },
    { "pluginId": "memberships",       "enabled": true, "agencyWide": false },
    { "pluginId": "affiliates",        "enabled": true, "agencyWide": false },
    { "pluginId": "client-crm",        "enabled": true, "agencyWide": false },
    { "pluginId": "agency-hr",         "enabled": true, "agencyWide": true  },
    { "pluginId": "agency-finance",    "enabled": true, "agencyWide": true  },
    { "pluginId": "agency-marketing",  "enabled": true, "agencyWide": true  }
  ],
  "bootstrapped": { "agency": false, "client": false, "customer": false }
}
```

Order matters in `seedDemoAgency`:

1. `bootstrapAgency` (creates `fulfillment` agency-wide).
2. Client + users.
3. Client-side chain: `website-editor → ecommerce → memberships →
   affiliates → client-crm` (dep graph).
4. Agency-side: `agency-hr`, `agency-finance`, `agency-marketing`.

`resetDemo()` walks `state.users` keyed by `agencyId` so every wipe
also catches the new end-customer scoped key (`email|c:<clientId>`)
that R5 introduced.

## 10. Smoke harness

`portal/scripts/smoke.mjs` (run via `npm run smoke`):

```
§ Demo entry            1 check  (/demo cold)
§ Seed inspection      11 checks (POST + 9 install ids + client id)
§ Plugin nav URLs      11 checks (one per plugin + agency/client home)
§ Plugin API surfaces   6 checks (one per plugin)
§ POV cycle             6 checks (toggle×3 + surface×3)
                       ──
                       35 checks total
```

Verified 2026-05-05: 35/35 pass against `npm run dev -p 3050`. The
harness uses fetch + a tmp cookie jar; reset between runs by killing
dev + `rm -rf .data .next/dev`.

## 11. R6 deviations + open follow-ups

| Topic                       | R6 ship                                            | Future foundation patch |
|-----------------------------|---------------------------------------------------|-------------------------|
| ActivityCategory drift      | `as unknown as ...` cast at every register site   | Plugins re-export T1's canonical types instead of vendoring |
| Stripe SDK adapter          | NOOP StripePort throwing on every method          | Read per-install Stripe keys from ecommerce, build real Stripe SDK wrapper |
| Discovered panels           | Auto-render with derived label between Tools/Settings | Either plugins move to canonical panel ids OR foundation accepts panel registration via plugin manifests |
| Event router cycle dodge    | Dynamic `await import("./pluginInstalls")`         | Refactor pluginInstalls + storage to remove cycle |
| In-process event-bus test   | Not yet (HTTP smoke covers the surface)           | Add `__smoke__/eventBus.test.mjs` once node:test running outside Next is stable |
| Plugin install-link refresh | Manual `rm -rf node_modules/@aqua/plugin-X` after edits | Postinstall hook OR `npm run refresh-deps` script |

## 12. Cross-team handoff notes

- **Plugin authors**: continue vendoring `tenancy.ts` for now. When
  R7 unifies the canonical types, the foundation will publish
  `@aqua/foundation-types` and we'll do the migration in one round.
- **T2**: any new plugin that emits events the rest of the system
  cares about should declare its event names in the plugin's
  `EventBusPort` union. Foundation's `subscribeForPlugin` takes any
  string — no foundation patch needed unless you also want
  type-safety in the union literal at the foundation level.
- **T3**: the website-editor plugin is unaffected by R6 (already
  wired in R3). When ecommerce/memberships block renderers land via
  T3 R3, the manifest's storefront blocks will resolve through the
  RENDERER_REGISTRATIONS map; foundation needs no change.
- **Demo cron** (still pending from R4): a Vercel cron hitting
  `GET /api/dev/seed-demo?reset=1` at 04:00 UTC stays a one-line
  addition; defer until prod deploy.
