/loop

# T1 — Round 6: Foundation mass plugin wire-up + cross-plugin event router

Round 5 you brought the third audience live (per-client end-customer
auth + variant-driven `/portal/customer` + third demo POV). Round 6 is
**the big foundation catch-up** — wire every plugin T2 has shipped
into the foundation so the manifests, APIs, pages, and cross-plugin
event flows actually work end-to-end. After this round the foundation
is ahead of the plugin catalogue again.

## Working environment

- **Repo**: https://github.com/edsworld27/ker-v3
- **Local**: `~/Desktop/ker-v3/`
- **Branch**: `main`. `git pull --rebase --autostash && git push` after each commit.
- Top-level folders contain spaces — quote them.

## Messaging

- **Outbox**: `01 development/messages/terminal-1/to-orchestrator.md`
- **Inbox**: `01 development/messages/terminal-1/from-orchestrator.md`
- Don't stop on questions; log `Q-ASSUMED`. Only stop on `Q-BLOCKED`.

## Mandatory pre-read

1. `01 development/CLAUDE.md` (Mode A — terminal mesh)
2. `01 development/context/prior research/04-architecture.md` — §2 (plugin model), §6 (tenant scoping), §7 (phase lifecycle)
3. `01 development/context/prior research/04-foundation.md`, `04-foundation-round2.md`, `04-foundation-round3.md` — your prior chapters
4. `01 development/context/prior research/04-end-customer-flow.md` — your R5 chapter (read your own prior round)
5. **Each plugin's chapter to understand its Foundation pending list:**
   - `04-plugin-fulfillment.md` (#20) — already wired in R2
   - `04-plugin-ecommerce.md` (#24) — already wired in R3
   - `04-plugin-website-editor.md` (#22) — already wired in R3
   - `04-plugin-agency-hr.md` (#28) — NOT WIRED
   - `04-plugin-memberships.md` (#30) — NOT WIRED
   - `04-plugin-affiliates.md` (#31) — NOT WIRED
   - `04-plugin-agency-finance.md` (#32) — NOT WIRED
   - `04-plugin-agency-marketing.md` (#33) — NOT WIRED
   - `04-plugin-client-crm.md` (#34, if T2 R8 has shipped by then) — NOT WIRED

## Scope — six goals

### Goal A: Workspace deps + Turbopack transpile for 5 (or 6) new plugins

In `04 the final portal/portal/package.json`:
- Add `@aqua/plugin-agency-hr`, `@aqua/plugin-memberships`, `@aqua/plugin-affiliates`, `@aqua/plugin-agency-finance`, `@aqua/plugin-agency-marketing` (and `@aqua/plugin-client-crm` if T2 R8 has shipped) as `file:..` workspace deps.
- `npm install` with `install-links=true` already in `.npmrc`.
- `next.config.ts` `transpilePackages` array gets the same set appended.

### Goal B: `_registry.ts` append + side-effect-import files

For each plugin that exposes a `registerXxxFoundation` adapter, add:
1. A side-effect-import file under `04 the final portal/portal/src/plugins/foundation-adapters/` named like `<plugin>Foundation.ts` that imports the adapter and calls it at boot, passing the foundation's port shapes (mirror the `ecommerceFoundation.ts` you wrote in R3).
2. The plugin's manifest registration appended to `04 the final portal/portal/src/plugins/_registry.ts`.

The plugins are: agency-hr, memberships, affiliates, agency-finance,
agency-marketing (+ client-crm if available). Use the existing
foundation-adapters pattern from R2/R3.

### Goal C: ActivityCategory union extension

In `04 the final portal/portal/src/server/types.ts`, the
`ActivityCategory` union currently includes `"auth"`, `"ecommerce"`,
plus a few others. Each new plugin chapter §"Foundation pending"
specifies which category to add: `"hr"`, `"memberships"`, `"affiliates"`,
`"finance"`, `"marketing"`, `"crm"`. Append all six.

### Goal D: Cross-plugin event-bus router (the architectural fix)

T2's plugins emit events that other plugins want to subscribe to:
- ecommerce emits `order.created` (with `referralCodeId` +
  `endCustomerUserId` since R6) → affiliates' `AttributionService.recordOrder`
  + client-crm's `ActivityService` should subscribe.
- memberships emits `membership.subscription_changed` →
  client-crm's `ActivityService` should subscribe.
- affiliates emits `affiliate.attribution_recorded` →
  client-crm's `ActivityService` should subscribe.

Today the plugins each have an `EventBusPort` but there's no concrete
fan-out routing — emits go nowhere. R6 adds the router:

1. In `04 the final portal/portal/src/server/eventBus.ts`, extend the
   bus to support per-plugin subscribers. New API:
   `subscribeForPlugin(pluginId, eventName, handler)`.
2. Each foundation-adapter file (Goal B) registers its plugin's
   subscribers at boot. E.g. `affiliatesFoundation.ts` calls
   `eventBus.subscribeForPlugin('affiliates', 'order.created', container.attributions.recordOrder)`.
3. Tenant scoping: when ecommerce emits `order.created` for client `felicia`,
   the router fans out to ALL plugins installed for `felicia` (not other
   clients). Use the `pluginInstalls` registry to filter — only fire
   subscribers whose plugin is installed in the matching scope.
4. Document the new bus contract in a chapter section so future plugins
   know how to hook in.

### Goal E: Demo seed extension — install all client-scoped plugins for Felicia

In `04 the final portal/portal/src/lib/server/demoSeed.ts`, the demo
agency currently installs `fulfillment`, `website-editor`, `ecommerce`,
+ in R5 the customer-flow seed. Extend so the Felicia mirror also gets
`memberships`, `affiliates`, and `client-crm` installed (all client-scoped).
Also install `agency-hr`, `agency-finance`, `agency-marketing` at the
agency level (these are `scopePolicy: "agency"`).

After seed: a fresh demo agency has 9 plugins live across the right
scopes. The demo's POV cycle (agency / client / customer) shows the
full surface.

### Goal F: Smoke + chapter

1. Extend the existing portal-level smoke harness (`scripts/smoke.mjs`
   or wherever it lives — if not yet then create one) to validate:
   - Every registered plugin's manifest typechecks against `_types.ts`.
   - For the demo seed, every contributed nav item URL returns 200 (or
     the appropriate redirect).
   - For the demo seed, every contributed API route returns a non-error
     for an authenticated dev request.
   - Cross-plugin event-bus fan-out: ecommerce `order.created` triggers
     affiliates + client-crm subscribers (mock, in-process).
2. `tsc --noEmit` clean across portal + all plugin packages.
3. Chapter `04-foundation-round6.md` documenting:
   - The new `subscribeForPlugin` event-bus API.
   - The plugin wire-up checklist (so future T1 rounds can replicate
     for new plugins).
   - The demo seed shape after R6 (9 plugins live).
   - Any deviations / bugs found during wire-up.

## Plugin-by-plugin Foundation pending checklist

Lift verbatim from each plugin's chapter §"Foundation pending"; cross-
check against your own work. The five (or six) plugins in scope:

```
agency-hr:
  [ ] file:.. dep + transpilePackages
  [ ] foundation-adapters/agencyHrFoundation.ts side-effect import
  [ ] _registry.ts append
  [ ] ActivityCategory += "hr"

memberships:
  [ ] file:.. dep + transpilePackages
  [ ] foundation-adapters/membershipsFoundation.ts side-effect import
  [ ] _registry.ts append
  [ ] ActivityCategory += "memberships"
  [ ] UserPort projection (resolve EndCustomerProfile from foundation Users)
  [ ] stripeFor({agencyId, clientId}) factory reading per-install Stripe keys from ecommerce
  [ ] catch-all honouring `public: true` flag for the Stripe webhook

affiliates:
  [ ] file:.. dep + transpilePackages
  [ ] foundation-adapters/affiliatesFoundation.ts side-effect import
  [ ] _registry.ts append
  [ ] ActivityCategory += "affiliates"
  [ ] EcommerceOrdersPort wiring (cross-plugin read from ecommerce)
  [ ] order.created subscriber → AttributionService.recordOrder

agency-finance:
  [ ] file:.. dep + transpilePackages
  [ ] foundation-adapters/agencyFinanceFoundation.ts side-effect import
  [ ] _registry.ts append
  [ ] ActivityCategory += "finance"

agency-marketing:
  [ ] file:.. dep + transpilePackages
  [ ] foundation-adapters/agencyMarketingFoundation.ts side-effect import
  [ ] _registry.ts append
  [ ] ActivityCategory += "marketing"

client-crm (if shipped):
  [ ] file:.. dep + transpilePackages
  [ ] foundation-adapters/clientCrmFoundation.ts side-effect import
  [ ] _registry.ts append
  [ ] ActivityCategory += "crm"
  [ ] order.created + subscription.* + affiliate.attribution_recorded subscribers → ActivityService
```

## NOT in scope

- Don't touch any plugin source — wire-up only edits foundation files.
- Don't restructure plugin manifests — they're correct as shipped.
- Don't introduce new ports beyond what plugins already declare.
- Don't ship a UI for plugin install management — the marketplace UI
  is fulfillment's territory.

## Loop discipline

Each cycle: pull → read inbox + outbox → progress → commit → push →
append `COMMIT` → `ScheduleWakeup` with `<<autonomous-loop-dynamic>>`.
Mid-task 600–900s, fully DONE 1500s, 3 empty wakes → omit ScheduleWakeup
to end. Goal A is small (start there). Goals B + C bulk through
together (one commit per plugin or one bulk commit). Goal D is the
hardest (event router). Goal E + F finish strong.

## When done

1. `tsc --noEmit` clean across `portal/` + every plugin package.
2. `npm run build` clean.
3. Smoke green: all installed plugin URLs + APIs respond.
4. Chapter `04-foundation-round6.md` written (or split if it gets
   large) + MASTER row.
5. `tasks.md` row done.
6. Final `DONE` + `COMMIT`.
