/loop

# T2 — Round 12: Stripe Connect for affiliate payouts

R11 you shipped `@aqua/plugin-portal-export` (`7a7b63a`) — 11 plugins
total. R12 closes the **real money flow** for affiliates: Stripe
Connect Express accounts + Payouts API. Today affiliates ships with
`markPaid(externalRef)` as manual; R12 makes it auto.

## Working environment

- Repo / local / branch — same.

## Messaging

- **Outbox**: `01 development/messages/terminal-2/to-orchestrator.md`
- **Inbox**: `01 development/messages/terminal-2/from-orchestrator.md`

## Mandatory pre-read

1. `04-plugin-affiliates.md` (your R5b)
2. `04-plugin-ecommerce.md` (your R2 — per-install Stripe pattern)
3. `04-plugin-memberships.md` (your R4 — StripePort + Stripe Connect lives here too)
4. Stripe Connect Express docs surface (assume operator knowledge)

## Scope — three goals

### Goal A: Stripe Connect onboarding for affiliates

Extend affiliates' Affiliate model with `stripeAccountId?: string`
+ `stripeOnboardingStatus: "pending"|"complete"|"restricted"`.

New endpoint `POST /api/portal/affiliates/me/stripe/onboard` →
creates a Connect Express account via the **per-client ecommerce
install's** Stripe key (cross-plugin port read; fall back to a
standalone StripePort if cross-import is messy — same pattern as
your memberships+ecommerce pivot in R5).

Returns Stripe Connect onboarding URL; affiliate completes Stripe's
hosted flow; webhook event `account.updated` flips the
onboardingStatus.

### Goal B: Real Payout

Replace `markPaid(externalRef)` with a `processPayout` flow:
1. PayoutService.execute(payoutId):
   - Validates affiliate.stripeAccountId is "complete".
   - Calls Stripe Transfers API: transfer `payout.amountCents` to
     the connected account.
   - Records the Stripe transfer id in `payout.externalRef`.
   - Marks payout `completed`.
2. Webhook `transfer.paid` confirms (eventually-consistent — payout
   stays `in_progress` between transfer + paid).

Idempotency on the existing payout id pattern.

### Goal C: Admin UI + smoke

PayoutsList gains a "Process via Stripe" button per scheduled
payout. Disables when affiliate's Connect status isn't `complete`.

`MyAffiliatePage` (customer surface) gains a "Set up payouts via
Stripe" button when `stripeAccountId` absent; surfaces onboarding
status when in progress.

Smoke (mock Stripe): onboard → status flip → schedule payout →
process → transfer.paid webhook → completed.

## NOT in scope

- Don't replace gift cards / referral codes / discount logic —
  pure payout flow.
- Don't auto-process payouts on a schedule — manual button trigger
  for v1; auto-cadence is R13.
- Don't add tax-form (1099-K) — defer to a future round.
- Don't touch other plugin source unless cross-port read requires it.

## Loop discipline

Standard. `<<autonomous-loop-dynamic>>`.

## When done

1. tsc clean inside `plugins/affiliates/`.
2. Smoke green covering onboarding + payout + webhook flows
   against a mock Stripe.
3. Chapter `04-plugin-affiliates-round12-stripe-connect.md`.
4. MASTER row.
5. tasks.md row done.
6. DONE + COMMIT.
