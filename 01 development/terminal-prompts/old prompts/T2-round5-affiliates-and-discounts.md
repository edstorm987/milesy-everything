/loop

# T2 — Round 5: Affiliates plugin + ecommerce↔memberships discount integration

Round 4 you shipped `@aqua/plugin-memberships` (`6af1c72`) — recurring
subscriptions, 9/9 smoke. Round 5 closes two open loops: (A) wire
ecommerce to honour membership-discount benefits at checkout (the
follow-up you flagged in your own R4 chapter §11), and (B) ship
`@aqua/plugin-affiliates` — referral codes, payouts, affiliate dashboard.
Together with memberships and ecommerce, this completes Felicia's
customer-facing plugin trio (shop · join · refer).

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
3. `01 development/context/prior research/04-plugin-ecommerce.md` (your R2 — Discount chain you'll extend)
4. `01 development/context/prior research/04-plugin-memberships.md` (your R4 — `getBenefitsForUser` lives here)
5. `01 development/context/prior research/04-plugin-agency-hr.md` (your R3b — manifest/ports/container shape to mirror for affiliates)
6. `01 development/context/prior research/04-foundation-round3.md` (T1's wire-up pattern)
7. `01 development/context/prior research/aqua-server-modules.md` — see `referrals` module if `02` had one (likely yes — referralCodes already lifted into ecommerce)
8. `01 development/eds requirments.md`

## Two goals

### Goal A: ecommerce ↔ memberships discount integration

Your ecommerce plugin's `DiscountService` already chains gift-card →
referral → static promo → custom code. Memberships introduces a fourth
source: `Benefit { category: "discount", percentOff: number }`. R5
extends the chain to recognise membership benefits.

1. **Cross-plugin read shape.** Memberships exports
   `getBenefitsForUser(userId)` (per chapter #30 §"Services"). Add a new
   port to your ecommerce plugin: `MembershipBenefitsPort` with a single
   method `getDiscountPercentForUser(userId): Promise<number | null>`.
   Implementation reads memberships' container via either
   (a) cross-package import of `@aqua/plugin-memberships`'s
   `requireFoundation()` if its `exports` map allows, or
   (b) an injected port T1's foundation will broker. Pick (b) by default
   — same call you made for memberships' StripePort. Log Q-ASSUMED if
   the import attempt is unclear.
2. **Discount chain extension.** In `DiscountService`, add a step
   after the existing chain: if no other discount applies AND the
   checkout request carries `userId`, call
   `MembershipBenefitsPort.getDiscountPercentForUser(userId)`. If a
   percent comes back, apply it as `discountSource: "membership"`.
3. **Order metadata.** When an order is created with a membership
   discount, persist `order.discountSource: "membership"` + the snapshot
   of which planId (best-effort — call back into memberships once for
   the snapshot, store on the order so it's stable even if the user's
   plan changes later).
4. **Backward-compat note.** If memberships isn't installed for the
   client, the port returns `null` cleanly. The chain still works for
   clients that don't use memberships.

### Goal B: `@aqua/plugin-affiliates`

Mirror your fulfillment + ecommerce + agency-HR + memberships shape.
Self-contained package, vendored types, ports, container builder,
foundation adapter, tsc-clean standalone.

Manifest:
- `id: "affiliates"`
- `category: "growth"`
- `scopePolicy: "client"` — Felicia's affiliates pool is hers, not the agency's
- `requires: ["ecommerce"]` — referral attribution lives in ecommerce
- `core: false` (opt-in)
- ~5-6 navItems split: admin (Affiliates · Codes · Payouts · Settings under panel `growth`); customer-facing (My affiliate dashboard under panel `customer`)
- ~5 admin pages + 1-2 customer pages
- ~10-14 API routes at `/api/portal/affiliates/*`
- 2-3 storefront blocks (block ids only, T3 registers renderers): `affiliate-signup`, `affiliate-payout-meter`, `affiliate-leaderboard`
- `onInstall` seeds default commission rate (10%) + payout cadence (monthly)

### Domain model

```ts
type Affiliate = {
  id, agencyId, clientId,
  endCustomerUserId,           // foreign key into foundation Users (role: end-customer)
  displayName,
  status: "pending"|"active"|"suspended"|"removed",
  defaultCommissionPercent,    // overrides agency default
  payoutEmail,                 // PayPal-style email; Stripe Connect later
  totalReferred,               // running counter
  lifetimeEarnings,            // in cents
  joinedAt, lastActiveAt?,
};

type ReferralCode = {
  id, agencyId, clientId, affiliateId,
  code,                        // human-readable, e.g. "FELICIA10"
  destinationPath,             // where the link lands; defaults to "/"
  commissionPercentOverride?,  // overrides affiliate's default for this code
  status: "active"|"archived",
  redemptionCount,
  createdAt,
};

type Attribution = {
  id, agencyId, clientId,
  orderId,                     // foreign key into ecommerce orders
  affiliateId,
  referralCodeId,
  amountCents,                 // commission earned on this order
  status: "pending"|"approved"|"paid"|"reversed",
  createdAt, approvedAt?, paidAt?,
};

type Payout = {
  id, agencyId, clientId,
  affiliateId,
  amountCents,
  attributionIds: string[],    // which orders this payout settles
  method: "paypal"|"manual"|"stripe-connect",
  externalRef?,                // PayPal txn id, etc.
  status: "scheduled"|"in_progress"|"completed"|"failed",
  scheduledFor, completedAt?,
};
```

### Services

- **AffiliateService** — CRUD + status transitions. `enroll(userId)` is
  the public sign-up entry point; refuses if the user already enrolled.
- **ReferralCodeService** — CRUD + per-affiliate code listing + collision
  detection. `findByCode(code)` returns active code with affiliate ref.
- **AttributionService** — listens to ecommerce `order.created` events.
  When an order has a `referralCodeId`, calls
  `AttributionService.recordOrder(orderId, code)` which computes commission
  and creates an Attribution row. `approve(attrId)` flips pending → approved
  (typically after the order's refund window passes — make this a manual
  flag; auto-approval is a later round).
- **PayoutService** — `schedule(affiliateId)` rolls all approved
  attributions into a single Payout row. Manual `markPaid(payoutId, externalRef)`
  for now; Stripe Connect / PayPal API integration is a future round
  (call out as deferred).

### Ports needed from foundation

- `StoragePort` — per-install plugin storage (mirror past plugins)
- `TenantPort` — `getClient(clientId)` for branding + agency-default-rate read
- `UserPort` — `getUser(userId)` to resolve affiliate name + email
- `ActivityLogPort` — `"affiliates"` ActivityCategory; T1 extends foundation enum (note for cross-team in chapter)
- `EventBusPort` — emits `affiliate.enrolled`, `affiliate.code_created`, `affiliate.attribution_recorded`, `affiliate.payout_scheduled`, `affiliate.payout_completed`. Subscribes to ecommerce's `order.created` for attribution.
- `EcommerceOrdersPort` — `getOrder(orderId): { ... referralCodeId? }` so AttributionService can read order metadata. Same cross-package read pattern as the memberships ↔ ecommerce port.

### API routes (~12, all mounted at `/api/portal/affiliates/*`)

Admin / agency-side (`visibleToRoles: AGENCY_ROLES + CLIENT_ROLES`):
- `GET /affiliates` · `POST /affiliates` · `PATCH /affiliates/:id` · `DELETE /affiliates/:id`
- `GET /codes` · `POST /codes` · `PATCH /codes/:id`
- `GET /attributions` · `POST /attributions/:id/approve`
- `GET /payouts` · `POST /payouts` · `POST /payouts/:id/mark-paid`

End-customer-facing (`visibleToRoles: ["end-customer"]`):
- `POST /me/enroll` — body `{ payoutEmail }`, creates Affiliate row.
- `GET /me` — affiliate dashboard data: own codes + attributions + payouts.
- `POST /me/codes` — request a new code (generates unique).

### Admin pages (~5)

`AffiliatesList` (search + filter + status), `AffiliateDetail`,
`CodesList`, `AttributionsList` (with bulk approve), `PayoutsList`,
`SettingsPage` (default commission %, payout method config).

### Customer pages (1-2)

`MyAffiliatePage` (`panelId: "customer"`) — own codes, recent
attributions, lifetime earnings, request payout button.

### Storefront block contributions (block ids only — T3 owns rendering)

`affiliate-signup`, `affiliate-payout-meter`, `affiliate-leaderboard`.
T3 will register renderers in their R3 (already prompted).

## Foundation integration

Same pattern as memberships + agency-HR + ecommerce:
- `tsc --noEmit` clean inside `04 the final portal/plugins/affiliates/`.
- Ports declared in `src/server/ports.ts`.
- Export `buildAffiliatesContainer(deps)`.
- Export `registerAffiliatesFoundation(deps) + containerFor(storage)` for side-effect-import.
- Document Foundation pending list in chapter (workspace dep, transpilePackages, side-effect-import file, _registry.ts append, ActivityCategory += "affiliates", ecommerce-orders cross-plugin read wiring, optional Stripe Connect for payouts later).

## NOT in scope

- Don't build automatic Stripe Connect / PayPal payout flow — manual
  `markPaid` for now. Payout method wiring is a future round.
- Don't touch fulfillment / website-editor / agency-HR / memberships /
  foundation source. Goal A's ecommerce edits ARE in scope (you own
  ecommerce).
- Don't build referral-link tracking middleware (cookie-stamp on first
  visit) — referral attribution happens at checkout via the existing
  `referralCodeId` field on order create. The deeper "first-touch
  attribution / multi-touch" story is a future round.
- Don't deploy / run real Stripe Connect tests against live Stripe —
  smoke uses a mock port.

## Loop discipline

Each cycle: pull → read inbox + outbox → progress → commit → push →
append `COMMIT` → `ScheduleWakeup` with `<<autonomous-loop-dynamic>>`.
Mid-task 600–900s, fully DONE 1500s, 3 empty wakes → omit ScheduleWakeup
to end.

## When done

Goal A:
1. ecommerce DiscountService chain extended with membership-discount step.
2. New `MembershipBenefitsPort` declared + injected via container builder.
3. `order.discountSource: "membership"` + planId snapshot persisted on order.
4. tsc clean.
5. Smoke extended to include the new path.

Goal B:
1. `tsc --noEmit` clean inside `04 the final portal/plugins/affiliates/`.
2. Smoke (`src/__smoke__/affiliates.test.ts`) — node:test cases:
   - `enroll` happy path + double-enrol rejection.
   - `findByCode` returns active code, archived returns null.
   - `recordOrder` creates pending Attribution; second call same orderId is idempotent.
   - `approve` flips pending → approved; double-approve is no-op.
   - `schedule` rolls approved → Payout; pending attributions excluded.
   - Mock port records every Stripe / Tenant / Activity call.
3. Chapter `04-plugin-affiliates.md` documenting domain, services, API
   surface, attribution flow, Foundation pending list, cross-team TODOs
   (T1: foundation dep wiring; T2 ecommerce: emit `order.created` with
   referralCodeId so AttributionService can listen; T3: register the 3
   block renderers).
4. MASTER.md row.
5. `tasks.md` row done.
6. Final `DONE` + `COMMIT` to outbox.

Goal A is smaller; do it first. Goal B is the meat. If your loop runs
out before Goal B completes, partial-DONE is fine — commit per service
landed.
