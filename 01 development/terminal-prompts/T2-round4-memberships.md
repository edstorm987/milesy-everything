/loop

# T2 — Round 4: Memberships plugin (`@aqua/plugin-memberships`)

Round 3 you shipped (A) the phase-lifecycle smoke and (B) the agency-HR
plugin. Round 4: build the **memberships plugin** — recurring-subscription
membership tiers + benefits + per-end-customer subscription state, billed
through ecommerce's per-install Stripe keys. This plugin gives Felicia's
end-customers something real to log into when T1 R5 (end-customer flow)
ships, and is the canonical "client-scoped third-tier-aware" plugin.

## Working environment

- **Repo**: https://github.com/edsworld27/ker-v3
- **Local**: `~/Desktop/ker-v3/`
- **Branch**: `main`. `git pull --rebase --autostash && git push` after each commit.
- Top-level folders contain spaces — quote them.

## Messaging

- **Outbox**: `01 development/messages/terminal-2/to-orchestrator.md`
- **Inbox**: `01 development/messages/terminal-2/from-orchestrator.md`
- Don't stop on questions; log `Q-ASSUMED`. Only stop on `Q-BLOCKED`.

## Mandatory pre-read

1. `01 development/CLAUDE.md` (Mode A — terminal mesh)
2. `01 development/context/prior research/04-architecture.md`
3. `01 development/context/prior research/04-plugin-fulfillment.md` (your R1)
4. `01 development/context/prior research/04-plugin-ecommerce.md` (your R2 — Stripe pattern lives here)
5. `01 development/context/prior research/04-plugin-agency-hr.md` (your R3b — manifest + ports + container shape to mirror)
6. `01 development/context/prior research/04-foundation-round3.md` (T1's wire-up — your plugin will land via the same workspace-dep pattern)
7. `01 development/eds requirments.md` (third-audience expectations)
8. `01 development/terminal-prompts/T1-round5-end-customer.md` — read this so you understand T1 R5's end-customer auth surface; your plugin's API + storefront blocks must work for `role: "end-customer"`.

## Scope — what to build

`04 the final portal/plugins/memberships/` — `@aqua/plugin-memberships`,
self-contained package, mirror your fulfillment + ecommerce + agency-HR
shape (vendored AquaPlugin types, ports, container builder, foundation
adapter, tsc-clean standalone).

Manifest fields:
- `id: "memberships"`
- `category: "growth"`
- `scopePolicy: "client"` — installed per client (Felicia has memberships, not the agency)
- `requires: ["ecommerce"]` — billing rides ecommerce's per-install Stripe keys
- `core: false` — opt-in
- ~6 navItems split across panels: Plans / Subscribers / Benefits / Settings (panel `growth`); plus 1-2 customer-facing items (panel `customer`) — "My membership", "Manage subscription"
- ~6 admin pages + 1-2 customer pages
- ~12-16 API routes at `/api/portal/memberships/*`
- 2-3 storefront blocks contributed (block ids only — T3 registers renderers): `membership-paywall`, `membership-signup`, `membership-tier-grid`
- `onInstall` seeds 3 default plans (Bronze / Silver / Gold) at $0 / $9.99 / $24.99 monthly with a sensible benefit list

### Domain model

```ts
type Plan = {
  id, agencyId, clientId, name, description?,
  priceMonthly, priceAnnual,        // in cents
  currency,                         // ISO 4217
  stripePriceIdMonthly?, stripePriceIdAnnual?,
  features: string[],               // bullet-list, displayed on paywall
  benefitIds: string[],             // foreign keys into Benefit
  status: "active"|"archived",
  order, createdAt, updatedAt,
};

type Benefit = {
  id, agencyId, clientId, label, description?,
  category: "discount"|"content"|"perk"|"other",
  // discount benefits carry an integer percentOff applied to ecommerce orders
  percentOff?: number,
  status: "active"|"archived",
};

type Subscription = {
  id, agencyId, clientId,
  endCustomerUserId,                // foreign key into foundation Users
  planId,
  stripeCustomerId?, stripeSubscriptionId?,
  billing: "monthly"|"annual",
  status: "trialing"|"active"|"past_due"|"canceled"|"paused"|"incomplete",
  currentPeriodEnd?,                // ISO date string
  cancelAtPeriodEnd: boolean,
  createdAt, updatedAt,
};
```

Storage layout under per-install plugin storage — keys
`memberships/plans/<planId>`, `memberships/benefits/<benefitId>`,
`memberships/subscribers/<userId>`, `memberships/by-plan/<planId>` (index
back to subscriber userIds).

### Services

- **PlanService** — CRUD + ordering + Stripe-price-id sync (creates Stripe
  Price objects via ecommerce's `containerFor` Stripe client; on plan
  edit, only fields that change in Stripe trigger a sync). `archivePlan`
  preserves existing subscriptions but stops new signups.
- **BenefitService** — CRUD + plan-association graph. `getBenefitsForUser(userId)`
  walks the user's active subscription → plan → benefits.
- **SubscriptionService** — `subscribe({userId, planId, billing})` creates
  Stripe Customer + Subscription using the plan's stripePriceId. Idempotent
  per (userId, planId, billing). `cancel(userId, {atPeriodEnd: bool})`,
  `pause(userId)`, `resume(userId)`, `changePlan(userId, planId)`.
- **WebhookService** — handles Stripe `customer.subscription.{created,
  updated,deleted}` + `invoice.{paid,payment_failed}`. Idempotent on
  Stripe event id (lift the existing pattern from your ecommerce plugin's
  webhook). On status changes, emits `membership.subscription_changed` event.

### Ports needed from foundation

Mirror what fulfillment + ecommerce + agency-HR declared:
- `StoragePort` — per-install plugin storage
- `TenantPort` — `getClient(clientId)` for branding
- `UserPort` — `getUser(userId)` to resolve end-customer email + name
  (your existing plugins didn't need this; declare it cleanly so T1
  wires `users.ts` through)
- `ActivityLogPort` — `"memberships"` ActivityCategory entry; T1 extends
  the foundation enum (note for cross-team in chapter)
- `EventBusPort` — emits `membership.subscription_changed`,
  `membership.payment_failed`, `membership.benefit_unlocked`
- `EcommerceStripePort` — read Stripe client per install, NOT env vars.
  Your ecommerce plugin's `requireFoundation()` + `containerFor()` returns
  one. Either depend on ecommerce via the same adapter pattern (preferred
  — `requires: ["ecommerce"]` makes this safe) or accept a Stripe-client
  factory in your container builder.
  Q-ASSUMED candidate: pull Stripe via the ecommerce package's exported
  `requireFoundation()`; if you find that import breaks tsc isolation,
  fall back to declaring an injected `StripePort` in your own ports file.

### API routes (~14, all mounted at `/api/portal/memberships/*`)

Admin / agency-side (`visibleToRoles: AGENCY_ROLES + CLIENT_ROLES`):
- `GET /plans` · `POST /plans` · `PATCH /plans/:id` · `DELETE /plans/:id`
- `GET /benefits` · `POST /benefits` · `PATCH /benefits/:id`
- `GET /subscribers` · `GET /subscribers/:userId` · `POST /subscribers/:userId/cancel`
- `POST /stripe/webhook` — public, idempotent, signed (verify with the
  same env-less per-install secret pattern as ecommerce)

End-customer-facing (`visibleToRoles: ["end-customer"]`):
- `GET /me` — returns current user's subscription + plan + benefits
- `POST /me/subscribe` — body `{ planId, billing }`, creates Stripe
  Checkout session, returns redirect URL
- `POST /me/cancel` — schedules cancellation at period end (or immediate
  via `?immediate=1`)
- `POST /me/portal` — returns Stripe Customer Portal URL for billing self-service

### Admin pages (~6)

`PlansPage` (list + edit modal · order arrows), `BenefitsPage`,
`SubscribersPage` (search + filter by plan + cancel actions),
`SubscriberDetail` (per-user history + Stripe links), `SettingsPage`
(default trial length, currency, customer-portal config), `ReportsPage`
(MRR snapshot — sum of active monthly + annual / 12 — aside, keep simple).

### Customer pages (1-2)

`MyMembershipPage` (`panelId: "customer"`) — current plan, benefits list,
"manage billing" button to Stripe Portal, "cancel" button.

### Storefront block contributions (block ids only — T3 owns rendering)

Mirror ecommerce: contribute the ids in the manifest's
`storefront.blocks: BlockDescriptor[]`, leave the actual React component
to T3. Three blocks:
- `membership-paywall` — gates rendered children unless user has an
  active subscription on a plan in `props.requirePlanIds`
- `membership-signup` — pricing-tier picker (uses `GET /plans`),
  triggers `POST /me/subscribe`
- `membership-tier-grid` — visual grid showing all active plans

## Foundation integration

Same pattern as agency-HR + ecommerce:
- `tsc --noEmit` clean inside `04 the final portal/plugins/memberships/`.
- Define ports.
- Export `buildMembershipsContainer(deps)`.
- Export `registerMembershipsFoundation(deps) + containerFor(storage)` for
  side-effect-import.
- Foundation pending list (in chapter): T1 adds workspace dep,
  side-effect import, `_registry.ts` append, `ActivityCategory` += "memberships",
  `User`-resolution port wired through. Add a `Foundation pending` section
  exactly like your prior chapters.

## NOT in scope

- Don't touch fulfillment / ecommerce / website-editor / agency-HR /
  foundation source. If you need ecommerce's Stripe client and the
  current `exports` map blocks reach, log a `Q-ASSUMED` proposing
  either: (a) a one-line re-export to ecommerce's barrel (same pattern
  T1 used in R3), or (b) declare a `StripePort` you accept via the
  container builder. Pick (b) by default to keep packages decoupled.
- Don't build referral / affiliate logic — that's a separate plugin
  (`@aqua/plugin-affiliates`) for a future round.
- Don't build content-gating beyond the `membership-paywall` block —
  full CMS-style "premium content" lives in a future plugin.
- Don't deploy / run real Stripe webhook tests against live Stripe —
  document the test surface and use Stripe CLI in dev. The smoke test
  can use a mock webhook signer.

## Loop discipline

Each cycle: pull → read inbox + outbox → progress → commit → push →
append `COMMIT` → `ScheduleWakeup` with `<<autonomous-loop-dynamic>>`.
Mid-task 600–900s, fully DONE 1500s, 3 empty wakes → omit ScheduleWakeup
to end.

## When done

1. `tsc --noEmit` clean inside `04 the final portal/plugins/memberships/`.
2. Smoke test (`src/__smoke__/memberships.test.ts`) — node:test cases:
   - `seedDefaultPlans` idempotent (×2 calls = same state).
   - `subscribe` happy path, signed webhook updates subscription status.
   - `cancel(atPeriodEnd: true)` records intent without state change.
   - `getBenefitsForUser` returns correct benefits via plan walk.
   - `webhookService` handles a `customer.subscription.deleted` event.
   - Idempotency on Stripe event id.
3. Chapter `04-plugin-memberships.md` documenting domain, services, API
   surface, Stripe webhook flow, Foundation pending list, cross-team
   integration TODOs (T1: foundation dep wiring + UserPort + ActivityCategory
   + side-effect import; T3: register the 3 block renderers).
4. MASTER.md row.
5. `tasks.md` row done.
6. Final `DONE` + `COMMIT` to outbox.
