# Affiliates plugin (T2 R5)

`@aqua/plugin-affiliates` — referral codes, attributions, manual
payouts, and a per-end-customer affiliate dashboard. Per-client
install (`scopePolicy: "client"`, `requires: ["ecommerce"]`,
`core: false`). Together with memberships and ecommerce, completes
Felicia's customer-facing plugin trio: shop · join · refer.

> Built by T2 on 2026-05-04 alongside Goal A (ecommerce↔memberships
> discount integration). tsc-clean standalone; 9/9 smoke pass.

## 1. Package shape

```
04 the final portal/plugins/affiliates/
├── index.ts                          default-exports the AquaPlugin manifest
├── package.json                      @aqua/plugin-affiliates@0.1.0
├── tsconfig.json
├── src/
│   ├── lib/
│   │   ├── aquaPluginTypes.ts        vendored AquaPlugin contract
│   │   ├── domain.ts                 Affiliate · ReferralCode · Attribution · Payout (+ inputs/filters)
│   │   ├── tenancy.ts                AgencyId / Role / ActivityCategory mirror (+ "affiliates")
│   │   ├── ids.ts                    makeId + makeReferralCode (4-letter prefix + 4 digits)
│   │   └── time.ts                   stubable clock
│   ├── server/
│   │   ├── ports.ts                  Storage · Tenant · User · ActivityLog · EventBus · PluginInstallStore · EcommerceOrders (NEW)
│   │   ├── affiliates.ts             AffiliateService (CRUD + enroll + counters)
│   │   ├── codes.ts                  ReferralCodeService (CRUD + findByCode + collision detection + redemption counter)
│   │   ├── attributions.ts           AttributionService (recordOrder idempotent · approve · reverse · _markPaid)
│   │   ├── payouts.ts                PayoutService (schedule rolls approved → Payout · markPaid · markFailed)
│   │   ├── foundationAdapter.ts      registerAffiliatesFoundation + containerFor + containerWithDeps + _containerFromCtx
│   │   └── index.ts                  buildAffiliatesContainer + barrel re-exports
│   ├── api/
│   │   ├── handlers.ts               16 handlers (admin + customer + internal recordOrder fan-out)
│   │   └── routes.ts                 ROUTES manifest array (per-route visibleToRoles)
│   ├── components/
│   │   ├── AffiliatesList.tsx
│   │   ├── CodesList.tsx
│   │   ├── AttributionsList.tsx
│   │   ├── PayoutsList.tsx
│   │   └── MyAffiliatePanel.tsx      enrol form + dashboard
│   ├── pages/
│   │   ├── AffiliatesPage.tsx        mounted at "" + "affiliates"
│   │   ├── CodesPage.tsx
│   │   ├── AttributionsPage.tsx
│   │   ├── PayoutsPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── MyAffiliatePage.tsx       "/portal/customer/affiliates"
│   └── __smoke__/
│       └── affiliates.test.ts        9 node:test cases via tsx --test
└── package-lock.json
```

26 source files, ~3700 LOC, zero runtime deps. peer-deps: react@19 + next@16.

## 2. Manifest (key fields)

```ts
{
  id: "affiliates",
  category: "growth",
  status: "alpha",
  core: false,
  scopePolicy: "client",
  requires: ["ecommerce"],
  navItems: [
    Affiliates · Codes · Attributions · Payouts · Settings (panel "growth", admin),
    "Refer & earn" (panel "customer", end-customer),
  ],                                   // 6 items
  pages: 7 entries,
  api: ROUTES,                         // 16 routes
  storefront.blocks: [
    "affiliate-signup",  "affiliate-payout-meter",  "affiliate-leaderboard",
  ],                                   // T3 registers renderers
  features: [self-enroll, manual-payouts, leaderboard],
  settings.groups: [
    general (defaultCommissionPercent=10, defaultPayoutMethod, payoutCadence),
    approval (autoApproveAfterDays — stored, not yet enforced),
  ],
  onInstall: touches the four index keys so list reads don't 500 on a fresh install,
  healthcheck: reports active affiliates / attributions / payouts counts,
}
```

## 3. Domain model (v1)

```ts
type Affiliate = {
  id, agencyId, clientId, endCustomerUserId,
  displayName, status: pending|active|suspended|removed,
  defaultCommissionPercent?,           // overrides agency default
  payoutEmail,                         // PayPal-style; Stripe Connect later
  totalReferred,                       // running counter
  lifetimeEarnings,                    // cents — sum of paid-out attributions
  joinedAt, lastActiveAt?, createdAt, updatedAt,
};

type ReferralCode = {
  id, agencyId, clientId, affiliateId,
  code,                                // human-readable, upper-case
  destinationPath,
  commissionPercentOverride?,
  status: active|archived,
  redemptionCount, createdAt,
};

type Attribution = {
  id, agencyId, clientId, orderId, affiliateId, referralCodeId,
  amountCents,
  commissionPercentSnapshot,           // locked at attribution time
  status: pending|approved|paid|reversed,
  createdAt, approvedAt?, paidAt?, reversedAt?, payoutId?,
};

type Payout = {
  id, agencyId, clientId, affiliateId,
  amountCents, attributionIds,
  method: paypal|manual|stripe-connect,
  externalRef?,
  status: scheduled|in_progress|completed|failed,
  scheduledFor, completedAt?, failureReason?, createdAt,
};
```

### Commission rate resolution (effective rate, persisted)

```
ReferralCode.commissionPercentOverride
  ?? Affiliate.defaultCommissionPercent
  ?? install.config.defaultCommissionPercent
  ?? 10                                 // hardcoded floor
```

Locked into `Attribution.commissionPercentSnapshot` at record time so
later rate changes don't retroactively alter past attributions.

### Validation rules (in services, not just at the API)

| Service | Rule |
|---------|------|
| AffiliateService | endCustomerUserId resolves via UserPort; double-enrol rejected; reverse-lookup `affiliates/by-user/<uid>` enforces uniqueness |
| ReferralCodeService | code uppercase + unique within client; archived codes excluded from `findByCode`; collision rejected at create |
| AttributionService | idempotent on orderId via `attributions/by-order/<orderId>`; affiliate must be active; code must be active; amountCents > 0 |
| PayoutService | refuses cancellation of paid attributions; markPaid is idempotent on payout id; markPaid flips rolled attributions to paid AND bumps lifetime earnings |

## 4. Storage layout (per-install plugin storage)

```
affiliates/by-id/<id>            → Affiliate
affiliates/by-user/<userId>      → affiliateId  (uniqueness lookup)
affiliates/index                 → string[] of affiliate ids

codes/by-id/<id>                 → ReferralCode
codes/by-code/<UPPER>            → codeId  (case-insensitive O(1) lookup)
codes/index                      → string[]

attributions/by-id/<id>          → Attribution
attributions/by-order/<orderId>  → attributionId  (idempotency lookup)
attributions/by-affiliate/<aff>  → string[] of attribution ids
attributions/index               → string[]

payouts/by-id/<id>               → Payout
payouts/by-affiliate/<aff>       → string[] of payout ids
payouts/index                    → string[]
```

Heavy use of secondary indexes: `findByCode`, `getByOrder`, and
`listForAffiliate` are all O(1) lookups + bounded fetches. Important
when an active store could carry hundreds of affiliates and thousands
of attributions.

## 5. API surface (16 routes mounted at `/api/portal/affiliates/`)

| Method · Path | Handler | Roles |
|--------------|---------|-------|
| GET `affiliates` | listAffiliatesHandler | admin viewers |
| POST `affiliates` | createAffiliateHandler | admin roles |
| PATCH `affiliates` | updateAffiliateHandler | admin roles |
| DELETE `affiliates?id=…` | deleteAffiliateHandler | admin roles |
| GET `codes` | listCodesHandler | admin viewers |
| POST `codes` | createCodeHandler | admin roles |
| PATCH `codes` | updateCodeHandler | admin roles |
| GET `attributions` | listAttributionsHandler | admin viewers |
| POST `attributions/approve` | approveAttributionHandler | admin roles |
| POST `attributions/record` | recordOrderHandler | admin roles (internal fan-out) |
| GET `payouts` | listPayoutsHandler | admin viewers |
| POST `payouts` | schedulePayoutHandler | admin roles |
| POST `payouts/mark-paid` | markPayoutPaidHandler | admin roles |
| GET `me` | meHandler | end-customer |
| POST `me/enroll` | meEnrollHandler | end-customer |
| POST `me/codes` | meCreateCodeHandler | end-customer |

`POST /attributions/record` is the cross-plugin fan-out — foundation
calls it when ecommerce emits `order.created`. It's listed under admin
roles for now; once event-bus signing lands a future round can mark
the route `public: true` and have ecommerce invoke it directly.

## 6. EcommerceOrdersPort — the cross-plugin read

Same pattern memberships used for StripePort + ecommerce uses for
MembershipBenefitsPort: declare an injected port narrow to what we
actually consume, foundation brokers the cross-package read.

```ts
export interface EcommerceOrderProjection {
  id, agencyId, clientId,
  endCustomerUserId?,
  amountTotal, currency, subtotal,
  referralCodeId?,
  discountSource?,
  createdAt,
}

export interface EcommerceOrdersPort {
  getOrder(args: { agencyId, clientId, orderId }): Promise<EcommerceOrderProjection | null>;
}
```

Foundation adapter projects `ServerOrder` (from
`@aqua/plugin-ecommerce/server`'s `containerFor(storage).orders`) into
the projection. Today ecommerce's `ServerOrder` doesn't carry
`referralCodeId` — Goal-A patch on this round added discount
provenance fields but not the referral linkage. Until ecommerce
extends the order shape (foundation pending), the projection reads
from `order.metadata.referralCodeId` that the storefront stamps on
checkout, AND `recordOrder` accepts an explicit `referralCodeId`
arg as a fallback path.

## 7. Smoke test (9 cases)

`src/__smoke__/affiliates.test.ts` — `node:test` via `tsx --test`.
Builds an in-memory foundation + a mock `EcommerceOrdersPort` with
order staging, walks:

| Step | Asserts |
|------|---------|
| 0 | `enroll` happy path → affiliate in `pending`; double-enrol rejected; owner `update({status: "active"})` flips |
| 1 | `create` upper-cases code; `findByCode` is case-insensitive + active-only; collision rejected; archived code returns null from `findByCode` |
| 2 | `recordOrder` creates `pending` Attribution at 10%; same-orderId is idempotent (returns existing); affiliate `totalReferred++` and code `redemptionCount++` |
| 3 | Order without `referralCodeId` → no attribution |
| 4 | `approve` flips pending → approved with `approvedAt` set; second `approve` is no-op |
| 5 | `schedule` rolls ONLY approved attributions into a Payout (excludes pending); `markPaid({externalRef})` flips payout status + cascade-flips rolled attributions to paid + sets `payoutId` + bumps `lifetimeEarnings` |
| 6 | `schedule` with no approved attributions returns null |
| 7 | Activity log carries enrolled / code_created / attribution_recorded / attribution_approved / payout_scheduled / payout_completed; event bus mirrors |
| 8 | `getByUser`, `listForAffiliate` work for the customer-side dashboard |

```
▶ affiliates smoke
  ✔ step 0: enroll + double-enrol rejected
  ✔ step 1: create code + findByCode + collision detection
  ✔ step 2: recordOrder creates pending Attribution + idempotent
  ✔ step 3: recordOrder skipped when no code
  ✔ step 4: approve flips pending → approved (idempotent on approved)
  ✔ step 5: schedule rolls only approved attributions into Payout
  ✔ step 6: schedule with no approved attributions returns null
  ✔ step 7: side-effects — activity log + event bus
  ✔ step 8: customer view — getByUser + listForAffiliate
ℹ tests 9   ℹ pass 9   ℹ fail 0
```

`npm run smoke` from `04 the final portal/plugins/affiliates/`.

## 8. Foundation pending (orchestrator brokerage in next round)

| # | Task | File / Surface |
|---|------|---------------|
| 1 | Workspace dep + transpilePackages | `portal/package.json` + `portal/next.config.ts` |
| 2 | Side-effect-import file at `portal/src/plugins/foundation-adapters/affiliatesFoundation.ts` calling `registerAffiliatesFoundation({ tenant, user, activity, events, pluginInstalls, ecommerceOrders })` | new file |
| 3 | `_registry.ts` append (`affiliatesManifest as unknown as AquaPlugin`) | `portal/src/plugins/_registry.ts` |
| 4 | `ActivityCategory` union += `"affiliates"` | `portal/src/server/types.ts` |
| 5 | **`UserPort.getUser` projection** — same projection memberships needs (foundation R5/6 already adds it for memberships; affiliates reuses) | shared with memberships |
| 6 | **`ecommerceOrders` adapter** — read `containerFor(storage).orders.getOrder(id)` from `@aqua/plugin-ecommerce/server`, project to our `EcommerceOrderProjection`. Treat `metadata.referralCodeId` as authoritative until ecommerce ships a first-class field. | new file |
| 7 | **Cross-plugin event subscription** — when ecommerce emits `order.created` for a client that has affiliates installed, foundation invokes `POST /api/portal/affiliates/attributions/record` with `{ orderId }`. Lift to event-bus signing later. | event-bus router |

## 9. Cross-team integration TODOs

- **T2 ecommerce follow-up**: emit `order.created` with the `referralCodeId` carried in payload (today the order itself doesn't carry it). Either bake it into the order shape (preferred) or stamp it on `metadata` at checkout. Pairs with the foundation event-bus router (item 7 above).
- **T2 ecommerce follow-up #2**: when an order has both a membership discount AND a referral code, both should land. Goal A's discount chain explicitly skips memberships when another discount applied — but memberships discount and an affiliate referral aren't competing (memberships discount is product-side, affiliate commission is paid out of the merchant margin). The current code blocks memberships when ANY other discount type applied. Likely fine for v1 (most stores will pick one or the other), revisit if Felicia hits the case in production.
- **T3 (website-editor)**: register renderers for `affiliate-signup`, `affiliate-payout-meter`, `affiliate-leaderboard`. Block descriptors live in this plugin's manifest; renderers live in T3's plugin (same pattern as ecommerce's 8 + memberships's 3).
- **T1 R5 end-customer flow**: customer-side panel must include the "Refer & earn" nav item this plugin contributes (panelId `customer`). Same hook memberships's "My membership" needs.

## 10. NOT in scope (per the prompt)

- **Stripe Connect / PayPal automated payouts** — manual `markPaid` for v1. The settings field `defaultPayoutMethod: "stripe-connect"` is a placeholder; selecting it won't actually disburse. Future round.
- **Referral-link tracking middleware** — cookie-stamp on first visit isn't built. Today the storefront passes the code at checkout via the existing `referralCodeId` field on order create.
- **First-touch / multi-touch attribution** — last-touch attribution only (the code on the order wins).
- **Auto-approval after refund-window** — settings field stored but enforcement is a future round (needs a scheduler).
- **Live Stripe Connect tests** — smoke uses a mock port.

## 11. Verification commands

```bash
cd "04 the final portal/plugins/affiliates"

# tsc clean
npx tsc --noEmit

# 9/9 smoke pass
npm run smoke
```
