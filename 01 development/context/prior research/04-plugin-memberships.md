# Memberships plugin (T2 R4)

`@aqua/plugin-memberships` — recurring-subscription tiers, benefits,
and per-end-customer subscription state. Billed via an injected
`StripePort` (foundation reads per-install Stripe keys from the
ecommerce install in the same scope, since the manifest declares
`requires: ["ecommerce"]`).

> Built by T2 on 2026-05-04 alongside T1's R5 end-customer flow. Mirrors
> the fulfillment + ecommerce + agency-HR shape; tsc-clean standalone;
> 9/9 smoke pass.

## 1. Package shape

```
04-the-final-portal/plugins/memberships/
├── index.ts                          default-exports the AquaPlugin manifest
├── package.json                      @aqua/plugin-memberships@0.1.0
├── tsconfig.json
├── src/
│   ├── lib/
│   │   ├── aquaPluginTypes.ts        vendored AquaPlugin contract
│   │   ├── domain.ts                 Plan · Benefit · Subscription · WebhookEventSeen
│   │   ├── tenancy.ts                AgencyId / Role / ActivityCategory mirror (+ "memberships")
│   │   ├── ids.ts                    makeId
│   │   └── time.ts                   now() + stubable clock
│   ├── server/
│   │   ├── ports.ts                  StoragePort · TenantPort · UserPort (NEW) ·
│   │   │                             ActivityLogPort · EventBusPort ·
│   │   │                             PluginInstallStorePort · StripePort (NEW)
│   │   ├── plans.ts                  PlanService (CRUD + Stripe Price sync + seedDefaults)
│   │   ├── benefits.ts               BenefitService (CRUD + plan-walk in getBenefitsForUser)
│   │   ├── subscriptions.ts          SubscriptionService (subscribe → checkout · cancel · pause/resume · changePlan · upsertFromStripe · billingPortalUrl)
│   │   ├── webhook.ts                WebhookService (sig verify · dedupe · route by event type)
│   │   ├── foundationAdapter.ts      registerMembershipsFoundation + containerFor + isStripeAvailable + _containerFromCtx
│   │   └── index.ts                  buildMembershipsContainer + barrel re-exports
│   ├── api/
│   │   ├── handlers.ts               16 handlers (admin + customer + Stripe webhook)
│   │   └── routes.ts                 ROUTES manifest array (per-route visibleToRoles + `public: true` for webhook)
│   ├── components/
│   │   ├── PlansList.tsx
│   │   ├── NewPlanModal.tsx
│   │   ├── BenefitsList.tsx
│   │   ├── SubscribersList.tsx
│   │   └── MyMembershipPanel.tsx     end-customer "My Membership"
│   ├── pages/
│   │   ├── PlansPage.tsx             mounted at "" + "plans"
│   │   ├── BenefitsPage.tsx
│   │   ├── SubscribersPage.tsx
│   │   ├── SubscriberDetailPage.tsx  "subscribers/:userId"
│   │   ├── ReportsPage.tsx           MRR snapshot
│   │   ├── SettingsPage.tsx
│   │   └── MyMembershipPage.tsx      "/portal/customer/memberships" (full URL — T3 convention)
│   └── __smoke__/
│       └── memberships.test.ts       9 node:test cases via tsx --test
└── package-lock.json
```

26 source files, ~3500 LOC (services + ports doing the heavy lifting),
zero runtime dependencies. `peer-deps`: `react@19` + `next@16` only.

## 2. Manifest (key fields)

```ts
{
  id: "memberships",
  category: "growth",
  status: "alpha",
  core: false,                         // opt-in via marketplace
  scopePolicy: "client",               // installs per client
  requires: ["ecommerce"],             // billing rides ecommerce's per-install Stripe keys
  navItems: [
    Plans · Subscribers · Benefits · Reports · Settings (panel "growth", admins),
    "My membership" (panel "customer", end-customer),
  ],
  pages: [PlansPage (×2), BenefitsPage, SubscribersPage, SubscriberDetailPage,
          ReportsPage, SettingsPage, MyMembershipPage],   // 8 entries
  api: ROUTES,                         // 16 routes
  storefront.blocks: [
    "membership-paywall",  "membership-signup",  "membership-tier-grid",
  ],                                   // T3 registers renderers
  features: [free-tier, annual-billing, trial, discount-benefits],
  settings.groups: [
    general (defaultCurrency, defaultTrialDays, billingPortalReturnUrl),
    branding (memberPortalHeading, showAnnualToggle),
  ],
  onInstall: seeds 3 default plans (Bronze $0 / Silver $9.99 / Gold $24.99 monthly),
  healthcheck: reports plan + subscriber counts + foundation registration state,
}
```

## 3. Domain model (v1)

```ts
type Plan = {
  id, agencyId, clientId, name, description?,
  priceMonthly, priceAnnual,           // integer cents
  currency: "usd" | "gbp" | "eur",
  stripePriceIdMonthly?, stripePriceIdAnnual?,   // set after Stripe Price sync
  features: string[],                  // bullet copy for paywall
  benefitIds: string[],                // FK into Benefit
  status: "active" | "archived",
  order, trialDays?, createdAt, updatedAt,
};

type Benefit = {
  id, agencyId, clientId, label, description?,
  category: "discount" | "content" | "perk" | "other",
  percentOff?,                         // for category === "discount"
  contentRef?,                         // for category === "content"
  status: "active" | "archived",
  createdAt, updatedAt,
};

type Subscription = {
  id, agencyId, clientId,
  endCustomerUserId,                   // FK into foundation Users
  planId, billing: "monthly" | "annual",
  stripeCustomerId?, stripeSubscriptionId?,
  status: "trialing" | "active" | "past_due" | "canceled" | "paused" | "incomplete",
  currentPeriodEnd?: ISO8601,
  cancelAtPeriodEnd: boolean,
  trialEndsAt?: ISO8601,
  createdAt, updatedAt,
};
```

Validation lives in services (not just at the API layer): non-negative
prices, single subscription per (clientId, userId) — `subscribe`
called twice for the same user reuses the cached Stripe customer and
goes through `upsertFromStripe` on webhook.

## 4. Storage layout (per-install plugin storage)

```
memberships/plans/<planId>             → Plan
memberships/plans/index                → string[] of planIds

memberships/benefits/<benefitId>       → Benefit
memberships/benefits/index             → string[] of benefitIds

memberships/subscribers/<userId>       → Subscription
memberships/by-plan/<planId>           → string[] of subscriber userIds
memberships/customer-by-user/<userId>  → cached Stripe customer id

memberships/webhook/seen/<eventId>     → WebhookEventSeen { id, type, receivedAt }
```

`memberships/by-plan/<planId>` is the index walked in `list()` so
admin filters (status / planId) don't fan out to a `list("subscribers/")`
prefix scan on every render.

## 5. API surface (16 routes mounted at `/api/portal/memberships/`)

| Method · Path | Handler | Roles |
|--------------|---------|-------|
| GET `plans` | listPlansHandler | agency-* + client-* + end-customer |
| POST `plans` | createPlanHandler | agency-owner / agency-manager / client-* |
| PATCH `plans` | updatePlanHandler | admin roles |
| DELETE `plans?id=…` | deletePlanHandler | admin roles |
| GET `benefits` | listBenefitsHandler | viewers + end-customer |
| POST `benefits` | createBenefitHandler | admin roles |
| PATCH `benefits` | updateBenefitHandler | admin roles |
| GET `subscribers` | listSubscribersHandler | admin viewers |
| GET `subscribers/get?userId=…` | getSubscriberHandler | admin viewers |
| POST `subscribers/cancel` | adminCancelSubscriberHandler | admin roles |
| POST `stripe/webhook` | stripeWebhookHandler | **public** (Stripe signs) |
| GET `me` | meHandler | end-customer |
| POST `me/subscribe` | meSubscribeHandler | end-customer |
| POST `me/cancel` | meCancelHandler | end-customer |
| POST `me/portal` | mePortalHandler | end-customer |

Public Stripe webhook routes carry `public: true` on the
`PluginApiRoute` shape — the foundation's catch-all dispatcher needs
to skip the session cookie check for those. T1's resolver currently
gates everything; this is **foundation-pending §2** below. Until that
lands, manual route-mount is required (or expose a feature flag on the
catch-all).

`/me/subscribe` accepts `{ planId, billing }` and either:
- Returns `{ mode: "free", subscription }` — no Stripe round-trip if
  the plan is $0 for the requested billing period.
- Returns `{ mode: "checkout", checkoutUrl }` — Stripe Checkout URL
  the client redirects the customer to.

## 6. StripePort — the decoupled-by-default surface

The prompt offered two routes:
- (a) reach into the ecommerce package's `requireFoundation()` for
  the Stripe client, OR
- (b) declare a `StripePort` we accept via the container builder.

This plugin took **(b)**. Reasons documented inline at the top of
`src/server/ports.ts`:

1. Memberships's surface is narrow — 13 methods (customer/subscription
   lifecycle + checkout + billing portal + price + webhook verification).
   A typed port is more constrained than the full ecommerce surface.
2. Cross-package imports of the ecommerce package's `./server` barrel
   would pull more than memberships needs — and the ecommerce
   `requireFoundation()` returns the full ecommerce foundation, not
   just a Stripe client.
3. Keeps memberships replaceable: a future plugin (`affiliates`) can
   share the same `StripePort` shape.

The foundation's adapter (`stripeFor({agencyId, clientId})`) reads
the **ecommerce install's** `config.stripeSecretKey` /
`config.stripeWebhookSecret` for the same scope and constructs a real
Stripe client. Per-(agencyId, clientId), not per-membership-install —
the keys live on ecommerce. This is the brokering job in
"Foundation pending" §1 below.

`isStripeAvailable({ agencyId, clientId })` lets handlers short-circuit
to a clear 422 instead of throwing on missing config:

```ts
if (body.priceMonthly > 0 && !isStripeAvailable({ agencyId, clientId })) {
  return unprocessable("Stripe not configured for this client. Configure via the ecommerce plugin first.");
}
```

The `_containerFromCtx` helper (used by `onInstall`) falls back to a
`NOOP_STRIPE` so the seed of the $0 Bronze plan goes through even
before Stripe keys land — Silver + Gold creation will throw if Stripe
isn't configured, which is fine because `onInstall` is best-effort.

## 7. Stripe webhook flow

```
Stripe → POST /api/portal/memberships/stripe/webhook
       ↓
catch-all dispatcher (Foundation-pending: skip session check on public:true)
       ↓
stripeWebhookHandler reads raw body + Stripe-Signature header
       ↓
WebhookService.handle()
  ├─ stripe.verifyWebhookSignature({rawBody, signatureHeader}) → StripeWebhookEvent | null
  │     ↑ uses per-install whsec from ecommerce config
  ├─ dedupe via storage memberships/webhook/seen/<eventId>
  ├─ route by event.type:
  │   - customer.subscription.{created, updated, deleted, paused, resumed}
  │     → SubscriptionService.upsertFromStripe(stripeSub, metadata)
  │   - invoice.payment_failed     → emit "membership.payment_failed"
  │   - invoice.paid               → emit "membership.payment_succeeded"
  │   - any other type             → seen+stored, not reconciled (200)
  └─ return WebhookHandleResult { ok, eventId, type, duplicate, applied, error? }
```

Idempotency: re-applying the same event id is a no-op (smoke step 7
verifies). Stripe retries the same event for ~72 hours; the `seen`
key is keyed by Stripe `event.id` so retries land cleanly.

`upsertFromStripe(stripeSub, metadata)` reads `metadata.endCustomerUserId`
+ `metadata.planId` + `metadata.billing` (set on Stripe Checkout
session creation in `subscribe()`). If those are missing, the webhook
returns ok-but-not-applied; that's how legacy or non-membership Stripe
events fall through cleanly.

## 8. Storefront block contributions (delegated render)

Three block ids in the manifest's `storefront.blocks`. Mirror
ecommerce: T3's website-editor registers the actual React renderers
(this plugin only contributes the ids + descriptors).

| Block id | Purpose | Default props |
|----------|---------|---------------|
| `membership-paywall` | Gates child blocks unless visitor has an active subscription on a plan in `requirePlanIds`. | `{ requirePlanIds: [] }` |
| `membership-signup` | Pricing-tier picker. Lists active plans, posts to `/me/subscribe`. | `{ layout: "horizontal", showAnnual: true }` |
| `membership-tier-grid` | Visual grid of all active plans with feature bullets and CTAs. | `{ columns: 3, highlightPlanId?: string }` |

T3 cross-team task: register the three renderers in their block
registry. Block id ↔ renderer mapping ships in T3's website-editor
plugin once R3+ lands. Until then, the storefront treats unknown
block ids as no-ops (per `04-plugin-website-editor.md`).

## 9. Smoke test (9 cases)

`src/__smoke__/memberships.test.ts` — `node:test` via `tsx --test`.
Builds an in-memory foundation with a mock `StripePort` that records
every call + pre-stages a `StripeSubscription` per `createCheckoutSession`
so the test can replay it as a webhook payload.

| Step | Asserts |
|------|---------|
| 0 | `seedDefaults` ×2: first call seeds 3 plans, second is no-op; Bronze has no Stripe price (priceMonthly === 0), Silver/Gold have `stripePriceId{Monthly,Annual}` set |
| 1 | Subscribe to Bronze (free) returns `mode: "free"` with no Stripe customer call; emits `membership.subscription_started` |
| 2 | Cancel Bronze, subscribe to Silver → `mode: "checkout"` with valid URL; one `createCustomer` call (cached for next subscribe) |
| 3 | Replay a `customer.subscription.created` webhook → upsert subscription with `planId=silver`, status="trialing" (Silver has trialDays: 7) |
| 4 | `cancel(atPeriodEnd: true)` flips `cancelAtPeriodEnd` without touching `status`; one Stripe `cancelSubscription` call |
| 5 | `getBenefitsForUser` walks plan.benefitIds → returns the benefit; user without subscription returns empty array |
| 6 | `customer.subscription.deleted` webhook flips status to `canceled`; replay of same event id is a no-op (`duplicate: true`) |
| 7 | Bad signature → `{ ok: false, error: /signature/ }` |
| 8 | Activity log carries plan_created + subscription_started + benefit_created; event bus carries subscription_started + subscription_changed |

```
▶ memberships smoke
  ✔ step 0: seed default plans (idempotent)
  ✔ step 1: subscribe to free tier (Bronze)
  ✔ step 2: change to paid tier (Silver) returns checkout URL
  ✔ step 3: webhook customer.subscription.created upserts subscription
  ✔ step 4: cancel(atPeriodEnd: true) records intent without state change
  ✔ step 5: getBenefitsForUser walks plan
  ✔ step 6: webhook customer.subscription.deleted cancels subscription
  ✔ step 7: signature verification rejects bad sig
  ✔ step 8: side-effects — activity + events recorded
ℹ tests 9   ℹ pass 9   ℹ fail 0
```

`npm run smoke` from `04-the-final-portal/plugins/memberships/`.

## 10. Foundation pending (orchestrator brokerage in T1's next round)

| # | Task | File / Surface |
|---|------|---------------|
| 1 | Workspace dep + transpilePackages | `portal/package.json` + `portal/next.config.ts` |
| 2 | **Public route on the catch-all dispatcher** — `/api/portal/memberships/stripe/webhook` must skip session check. The route already declares `public: true`; T1's `_routeResolver.ts` needs to honour the flag. | `portal/src/app/api/portal/[plugin]/[...rest]/route.ts` |
| 3 | Side-effect-import file at `portal/src/plugins/foundation-adapters/membershipsFoundation.ts` that calls `registerMembershipsFoundation({ tenant, user, activity, events, pluginInstalls, stripeFor })` | new file |
| 4 | `_registry.ts` append (`agencyHrManifest`-style) | `portal/src/plugins/_registry.ts` |
| 5 | `ActivityCategory` union += `"memberships"` | `portal/src/server/types.ts` |
| 6 | **`UserPort.getUser` wiring** — T1's `users.ts` already exposes a `getUser(id)` shape; the foundation adapter projects it into our `EndCustomerProfile` shape. Add the projection. | the new side-effect-import file |
| 7 | **`stripeFor({agencyId, clientId})`** — read the ecommerce install's `config.stripeSecretKey` + `config.stripeWebhookSecret` for the same scope, build a Stripe SDK wrapper that satisfies our `StripePort` shape. Pattern lift from `plugins/ecommerce/src/lib/stripe/server.ts` — same `getStripe(secretKey)` lazy import. | the new side-effect-import file |

## 11. Cross-team integration TODOs

- **T3 (website-editor)**: register renderers for `membership-paywall`,
  `membership-signup`, `membership-tier-grid`. Block descriptors live in
  this plugin's manifest; renderers live in T3's plugin (same pattern
  as ecommerce's 8 storefront blocks).
- **T2 (ecommerce follow-up)**: when an end-customer with an active
  subscription places an order, ecommerce should consult the
  memberships plugin's `getBenefitsForUser(userId)` to apply
  discount-category benefits (e.g. 10% off). The plumbing is a future
  cross-plugin port — out of scope for Round 4 since it touches
  ecommerce source. Logged here for the orchestrator to schedule.
- **T1 R5 end-customer flow**: the customer-side panel + auth surface
  T1 is building must include the `My membership` nav item this plugin
  contributes (panelId: `"customer"`). The customer chrome will land
  alongside T1 R5's iframe-embedded login and `/portal/customer/*`
  catch-all.

## 12. NOT in scope (per the prompt)

- **Referral / affiliate logic** — `@aqua/plugin-affiliates` is a
  separate plugin for a future round.
- **Content gating beyond `membership-paywall`** — full CMS-style
  premium content lives in a future plugin.
- **Live Stripe webhook tests** — smoke uses a mock signer. Integration
  testing against a real Stripe account uses Stripe CLI in dev (not
  scripted here).
- **Proration / mid-cycle upgrades / refund accounting** — `changePlan`
  swaps the Stripe price id directly; Stripe handles its own
  proration math. The MRR report doesn't account for proration.
- **PTO accrual** — that's an HR concern, lives in `@aqua/plugin-agency-hr`.

## 13. Verification commands

```bash
cd "04-the-final-portal/plugins/memberships"

# tsc clean (no output = no errors)
npx tsc --noEmit

# 9/9 smoke pass
npm run smoke
```
