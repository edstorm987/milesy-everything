# `04` Plugin — affiliates Round 12 (Stripe Connect payouts)

> Authored 2026-05-06 by T2 R12. Closes the real money flow for the
> affiliates plugin: Stripe Connect Express onboarding for each
> affiliate + a real Stripe Transfers API call replacing the manual
> `markPaid(externalRef)` v1 path. Webhook-driven status
> reconciliation in both directions (`account.updated`, `transfer.paid`).
>
> Reads alongside chapter 31 (`04-plugin-affiliates.md` — R5b base) and
> chapter 30 (`04-plugin-memberships.md` — StripePort precedent).

## 1 · Why a separate `StripeConnectPort`

R4 memberships already declared a `StripePort` that the foundation
projects from ecommerce's per-install Stripe key (the same pattern the
prompt nominates). For Connect we extend the surface — connected
accounts + transfers + AccountLinks + webhook signature verification —
but the architectural decision is identical:

- **Don't import `stripe` from the affiliates package**. Keeps tsc
  isolation clean (the plugin compiles standalone, smoke runs in
  in-memory mocks).
- **Don't import `@aqua/plugin-ecommerce` either**. Cross-plugin
  reads compile against ecommerce's published shape; the foundation
  projects from ecommerce's Stripe driver at boot.
- **Foundation injects a concrete `StripeConnectPort`**. Tests inject
  a mock; installs without ecommerce/Stripe see the legacy
  `markPaid()` path keep working — `processPayout` throws cleanly with
  "Stripe Connect not configured for this install".

Port surface (`src/server/ports.ts`):

```ts
export interface StripeConnectPort {
  createAccount(args: { email; affiliateId; agencyId; clientId }): { accountId };
  createOnboardingLink(args: { accountId; returnUrl; refreshUrl }): { url; expiresAt };
  retrieveAccount(accountId): StripeConnectAccountSnapshot;
  createTransfer(args: { destinationAccountId; amountCents; currency; idempotencyKey; ... }): { transferId; created };
  verifyWebhookSignature(args: { rawBody; signature }): boolean;
}
```

`StripeConnectAccountSnapshot` carries `chargesEnabled / payoutsEnabled
/ detailsSubmitted / disabledReason`. `snapshotToStatus()` collapses
that triplet into our 3-state `stripeOnboardingStatus`.

## 2 · Domain extension

`Affiliate` gains two optional fields:

```ts
stripeAccountId?: string;
stripeOnboardingStatus?: "pending" | "complete" | "restricted";
```

Both absent until the affiliate clicks "Set up payouts via Stripe"
from `MyAffiliatePanel`. `UpdateAffiliatePatch` allows admin override
of either field (mostly for admin remediation; webhook-driven flow is
canonical).

`PayoutMethod = "paypal" | "manual" | "stripe-connect"` was already
declared (R5b). Settings dropdown `defaultPayoutMethod` now actually
honours `stripe-connect` — the schedule endpoint propagates the method
to the new `Payout`, and `PayoutsList` admin button shows when the
affiliate's Connect account is `complete`.

## 3 · State machine

R5b had:
```
scheduled → completed   (manual markPaid with externalRef)
scheduled → failed
```

R12 adds the real-money path:
```
scheduled → in_progress     processPayout(): createTransfer + record externalRef
in_progress → completed     confirmTransferPaid (transfer.paid webhook)
scheduled → failed          markFailed (createTransfer threw)
in_progress → completed     idempotent on webhook re-delivery
```

The legacy manual `markPaid()` code path is preserved verbatim — installs
that don't use Stripe (or that use PayPal) keep using it. R12 only
*adds* a parallel automated path.

## 4 · Idempotency

Two layers:

1. **Stripe-side**: `idempotencyKey: \`payout:${payoutId}\``. Stripe
   collapses duplicate POSTs by key; retries always reach the same
   Transfer.
2. **Plugin-side**: `processPayout(id)` short-circuits when the payout
   is already `in_progress` or `completed`. Returns the existing row.
   `confirmTransferPaid(transferId)` is no-op on `completed` — tested
   in step 12.

The `OnboardingService.start()` is also idempotent — calling twice on
the same affiliate reuses the existing Connect account (does NOT call
`createAccount` twice, asserted in step 9). Stripe charges per-account
on some plans + duplicate accounts confuse the affiliate.

## 5 · Webhook surface

Single endpoint: `POST /api/portal/affiliates/webhooks/stripe`,
`public: true`. Stripe-Signature header verified internally via
`StripeConnectPort.verifyWebhookSignature` before any state change.

Two events handled in v1:

- **`account.updated`** → `OnboardingService.applySnapshotForAccount`
  → `snapshotToStatus()` → flip `stripeOnboardingStatus`. Logs a
  single `affiliate.stripe_onboarding_status_changed` activity row +
  emits same-named event so other plugins (notifications, etc.) can
  react.
- **`transfer.paid`** → `PayoutService.confirmTransferPaid` →
  scheduled-attributions flip to `paid`, affiliate
  `lifetimeEarnings` advances, `Payout.status: completed`.

All other Stripe events return `200 {ok: true, ignored: true}` so
Stripe stops retrying.

## 6 · Routes added

```
POST /api/portal/affiliates/payouts/process       admin "Process via Stripe"
POST /api/portal/affiliates/me/stripe/onboard     customer "Set up payouts"
POST /api/portal/affiliates/me/stripe/refresh     customer "I'm done — refresh"
POST /api/portal/affiliates/webhooks/stripe       public — Stripe webhooks
```

## 7 · Admin UX (`PayoutsList.tsx`)

Each scheduled-status payout card now renders both:

- **Process via Stripe** button — disabled when the affiliate's
  `stripeOnboardingStatus !== "complete"`. `title` and a small caption
  surface the reason ("affiliate hasn't started Stripe Connect
  onboarding" / "Stripe onboarding is pending" / "restricted").
- **Mark paid** legacy button — kept verbatim for non-Stripe payouts
  (PayPal manual entry).

In-progress payouts render "Stripe transfer pending — webhook flips to
completed." in place of action buttons; the operator can't double-fire.

## 8 · Customer UX (`MyAffiliatePanel.tsx`)

New "Payouts setup" section renders one of four shapes per
`stripeOnboardingStatus`:

- **`undefined`** (no Connect account yet) — "Set up payouts via
  Stripe" button. POSTs `/me/stripe/onboard`, browser navigates to
  Stripe's hosted flow.
- **`pending`** — "Onboarding in progress" + "Resume Stripe
  onboarding" + "I'm done — refresh status" buttons.
- **`restricted`** — explanation text + "Reopen Stripe onboarding".
- **`complete`** — green check confirmation, no buttons.

`returnUrl` defaults to the current page so the affiliate lands back
on `MyAffiliatePanel` after Stripe.

## 9 · Container + foundation adapter

`AffiliatesContainer` gains `onboarding: OnboardingService | null`.
Null when foundation registered without `stripeConnect` (legacy
deployments). `PayoutService` constructor also takes the optional
`stripeConnect` — `processPayout` throws cleanly when absent.

`AffiliatesFoundation` and `containerWithDeps` both carry the new
optional `stripeConnect: StripeConnectPort`. `_containerFromCtx` in
`foundationAdapter` propagates it onward; tests still build through
the same construction path.

## 10 · Smoke

`src/__smoke__/affiliates.test.ts` grew from 9 → 14 cases. New steps:

- **9**: `OnboardingService.start` creates Connect account +
  AccountLink, sets `pending`. **Idempotent** — second call reuses.
- **10**: `applySnapshotForAccount` flips `pending → complete` when
  `chargesEnabled && payoutsEnabled`; flips to `restricted` when
  `disabledReason` set.
- **11**: `processPayout` validates onboarding complete, creates
  Transfer, sets `in_progress`, records `externalRef`. Idempotency-key
  shape `payout:<id>` asserted. Second call short-circuits — no
  duplicate Stripe call.
- **12**: `confirmTransferPaid(transferId)` flips `in_progress →
  completed`, attributions flip to `paid`, lifetime earnings advance.
  Idempotent on webhook re-delivery.
- **13**: `processPayout` refuses with a clear error when the
  affiliate has no `stripeAccountId` / `stripeOnboardingStatus !==
  "complete"`.

```
$ npx tsc --noEmit       # clean
$ npx tsx --test src/__smoke__/affiliates.test.ts
✔ 14/14 pass · 1083ms
```

## 11 · Foundation pending (cross-team)

T1 wires the StripeConnect driver at boot. Three pieces:

- **Driver lift** — extract Stripe Connect calls from ecommerce's
  Stripe client into a `@aqua/foundation/stripeConnect.ts` (or reuse
  ecommerce's container). Project the platform Stripe key (per-client
  ecommerce install) into `StripeConnectPort`. Memberships' `StripePort`
  is a sibling — both should share one driver eventually.
- **Webhook secret** — `install.config.stripeWebhookSecret` (encrypted
  at rest, mirrors ecommerce's pattern). `verifyWebhookSignature`
  reads it via the driver.
- **Subscriber** — foundation should also listen to
  `affiliate.stripe_onboarding_status_changed` and forward to
  email-sender (welcome / restricted-needs-action notifications). Not
  load-bearing for v1 but obvious next step.

When ecommerce isn't installed (impossible today since affiliates
`requires: ["ecommerce"]`, but listed for future affiliate-only
preset support): foundation registers `stripeConnect: undefined` and
the legacy manual path remains the only option.

## 12 · NOT in scope (deferred)

- **Tax-form generation (1099-K)** — Stripe Connect handles end-of-year
  reporting for the connected account; agency-side roll-ups deferred.
- **Auto-cadence**: scheduled payouts still trigger via the admin's
  manual button. R13 adds `payoutCadence` enforcement (settings field
  exists since R5b but is read-only today).
- **Transfer reversal** — Stripe `transfer.reversed` not handled in
  v1; manual remediation for now.
- **Per-currency support** — `processPayout` accepts `currency` arg
  defaulting to `"usd"`; UX is single-currency. Agencies operating in
  multiple currencies need an R13 config knob on the install.

## 13 · Verification

```
cd 04-the-final-portal/plugins/affiliates
npx tsc --noEmit                      # clean
npx tsx --test src/__smoke__/affiliates.test.ts   # 14/14 pass
```

Catalogue total smoke now **99/99 pass** across 11 plugins
(94 pre-R12 + 5 new R12 cases).
