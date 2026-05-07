/loop

# T2 — Round 025: Stripe basic plumbing (WS-D R025)

Webhook ingestion + event log + subscription state mirror. **NO charges,
NO money flow** in v1 — just "we can see Stripe events for a connected
tenant." Per-install creds in install.config.

Plan: chapter #124 WS-D R025.

## Pre-read

- T2 ecommerce plugin (existing — Stripe references already present).
- Architecture §"Per-install plugin config".
- Stripe webhook signing docs.

## Scope

**A** — `@aqua/plugin-stripe-events` (NEW). Manifest:
`scopePolicy: "agency"`, requires `credentials-vault` for token storage.

**B** — Webhook endpoint: `POST /api/portal/stripe/webhook` — verifies
`Stripe-Signature` against install.config.webhookSecret. Idempotent on
event.id. Stores raw event + parsed summary in `stripeEvents` table.

**C** — Subscription mirror: subset of events
(`customer.subscription.{created,updated,deleted}`) projected into a
`subscriptions` table per tenant — `{ customerId, status, currentPeriodEnd,
priceId }`. Read-only mirror; we don't push back.

**D** — Activity-inbox emit: each ingested event → `stripe.event.<type>`
activity entry so agency staff see it.

**E** — Admin page: Settings tab listing recent events + a "Test
webhook" diagnostic.

**F** — Smoke `§ Stripe events` (≥12 — signature verify happy + reject;
idempotency; subscription mirror tracks state; activity emit; webhook
secret mismatch rejected).

**G** — Chapter `04-plugin-stripe-events.md` + MASTER row.

## NOT in scope
- Stripe charges or invoicing — post-ship.
- Stripe Connect / tax — post-ship.
- Embedded payment UI — post-ship.

## When done
DONE referencing `025-stripe-basic.md`.
