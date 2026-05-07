# `@aqua/plugin-stripe-events` — T2 R025 (WS-D)

Stripe webhook ingestion + idempotent event log + per-tenant
subscription mirror. **NO charges, no money flow** — just "we can
see Stripe events for a connected tenant" so the operator's
activity-inbox surfaces customer churn / new sub / payment failures
without us touching Stripe Connect, tax, or invoicing.

Plan: chapter #124 ship-plan-v1 WS-D R025.

## Manifest

- `id: "stripe-events"`, `version: "0.1.0"`, `status: "alpha"`,
  `category: "ops"`.
- `core: false`, `scopePolicy: "agency"`, `requires:
  ["credentials-vault"]` (per round prompt — webhook secret lives
  in the vault, surfaced to this plugin via `VaultPort`).
- ActivityCategory `"stripe"` (vendored union appends).
- Two settings: `webhookSecret` (password type — masked in API
  responses; full value lives in vault) + `toleranceS` (default 300).
- Two feature flags: `subscription-mirror` + `activity-inbox-emit`.

## Domain

```ts
StripeEventRow {
  id /* mirrors Stripe event.id — source-of-truth */,
  agencyId, type, receivedAt, livemode,
  summary?: { objectId?, customerId?, subscriptionId?, status?, amount?, currency? },
  raw: StripeEventRaw   /* full event for audit + replay */
}

StripeSubscription {
  id /* sub_* */, agencyId, customerId,
  status: SubscriptionStatus,
  priceId?, currentPeriodEnd?, cancelAtPeriodEnd?,
  createdAt, updatedAt, lastEventId?
}

SubscriptionStatus:
  "incomplete" | "incomplete_expired" | "trialing" | "active" |
  "past_due" | "canceled" | "unpaid" | "paused"
```

`SUBSCRIPTION_EVENT_TYPES` (projected into mirror): `customer.
subscription.{created,updated,deleted}`. Other events are LOGGED,
not projected (smoke #12).

## Webhook signature verification

`verifyStripeSignature({ rawBody, signatureHeader, secret,
toleranceS, nowS? })` — pure, uses Web Crypto (Node ≥ 20 + edge).

- Header shape `t=<unix>,v1=<hex>[,v1=<hex>]` parsed by
  `parseStripeSignature`. Multiple `v1` entries supported (Stripe
  key rotation — smoke #8).
- HMAC-SHA256 over `<timestamp>.<rawBody>`; constant-time hex
  comparison (`timingSafeEqualHex`).
- Default tolerance 300s (`DEFAULT_TIMESTAMP_TOLERANCE_S`); rejects
  with `timestamp_too_old` outside the window (smoke #5).
- Rejection reasons: `missing_signature`, `missing_secret`,
  `invalid_signature_format`, `signature_mismatch`,
  `timestamp_too_old`, `invalid_body`, `missing_event_id`.

`computeStripeHmacHex(secret, payload)` exported so the smoke can
mint valid headers without dialing Stripe.

## Service surface

`StripeEventsService`:

- `listEvents({ limit?, type? })` — most-recent first; cap default
  100. Tenant-scoped (smoke #16).
- `getEvent(id)`.
- `listSubscriptions()` / `getSubscription(id)`.
- `ingest({ rawBody, signatureHeader, secret?, toleranceS?,
  maxBodyBytes?, nowS? })` —
  1. body cap (default 1MB);
  2. resolve secret (override > vault);
  3. verify signature;
  4. JSON parse + require `id` + `type`;
  5. dedupe on `event.id` (second arrival → `deduped: true`,
     emits `stripe.event.deduped`, NO re-emit of received — smoke
     #9);
  6. persist row (raw + summary);
  7. log activity `stripe.event.<type>` + emit
     `stripe.event.received`;
  8. if subscription event → project into mirror.

Returns `IngestResult = IngestAccepted | IngestRejected`.

## Subscription mirror

- `customer.subscription.{created,updated}` → upsert. Patches
  `status`, `priceId` (from first item), `currentPeriodEnd` (ms),
  `cancelAtPeriodEnd`, bumps `lastEventId` (smoke #10).
- `customer.subscription.deleted` → flip status to `"canceled"`
  WITHOUT clearing `priceId` / `currentPeriodEnd` so the mirror
  retains "what they had" for invoice / churn analysis (smoke #11).
- Emits `stripe.subscription.upserted` / `stripe.subscription.deleted`
  on each projection.

Read-only — we never push back to Stripe.

## API surface

3 routes mounted at `/api/portal/stripe-events/`:

| Path | Method | Auth |
|---|---|---|
| `webhook` | POST | **public** — Stripe calls; HMAC-verified |
| `events` | GET | agency staff+ |
| `subscriptions` | GET | agency staff+ |

The webhook handler reads `req.text()` to get the raw body for
HMAC. **Foundation route dispatcher MUST NOT pre-parse JSON for
this route** — pre-parsing would re-serialise and the HMAC would
fail. Foundation pending: honour `public: true` AND deliver the
raw body unmodified.

Response codes:
- `200 ok` — accepted (with `eventId`, `deduped`, `applied`).
- `400 invalid_*` / `signature_*` / `missing_signature` — Stripe
  re-tries; we want them to stop on these.
- `500 missing_secret` / `invalid_body` — operator misconfig;
  Stripe should retry until we fix it.

## Foundation port

NEW `VaultPort` (soft — round prompt names credentials-vault as
`requires`):

```ts
VaultPort { getWebhookSecret({ agencyId }): string | null }
```

Foundation injects this; absent → `ingest` rejects with
`missing_secret`. Tests pass `secret` directly via `IngestOptions`
to bypass.

## Pages

`StripeSettingsPage` (path `""`) — server-rendered. Subscriptions
list (per-row `data-sub-id` + `data-status` enhancer hooks) +
recent events (max 25, per-row `data-event-id`). Footer hints the
webhook URL operators paste into Stripe.

## Smoke

`src/__smoke__/stripe.test.ts` — 16/16 pass via `tsx --test`.

1. `parseStripeSignature` parses `t` + `v1`; rejects malformed.
2. `summarise` extracts subscription / customer / status from sub
   event.
3. ingest happy path stores event + emits received + projects
   subscription mirror with priceId from first item.
4. invalid signature → `signature_mismatch` + nothing stored.
5. timestamp outside tolerance (300s) → `timestamp_too_old`.
6. missing signature header → `missing_signature`.
7. missing webhook secret in vault → `missing_secret`.
8. multiple v1 sigs (key rotation) — accepts when ANY matches.
9. second arrival of same `event.id` → `deduped: true`; received
   event emits exactly once; deduped event emitted once.
10. `customer.subscription.updated` patches existing row + bumps
    `lastEventId`.
11. `customer.subscription.deleted` flips `status: "canceled"`
    PRESERVING `priceId` from prior upsert (churn analysis intact)
    + emits `subscription.deleted`.
12. Non-subscription event (`payment_intent.succeeded`) logged but
    NOT projected (`applied.kind === "noop"`).
13. Activity log uses category `"stripe"` with `stripe.event.<type>`
    action.
14. `listEvents` most-recent-first + honours `limit` + `type`.
15. Tampered body with valid HMAC of original → reject (HMAC of
    new body doesn't match — smoke pinning the
    "verify-then-parse" ordering).
16. Tenant isolation — `agency_other` sees nothing on shared
    storage.

`tsc --noEmit` clean.

## Foundation pending

1. Workspace dep `@aqua/plugin-stripe-events`.
2. `transpilePackages` += `@aqua/plugin-stripe-events`.
3. Side-effect import calling `registerStripeEventsFoundation`.
4. `_registry.ts` append.
5. `ActivityCategory` += `"stripe"`.
6. **Catch-all dispatcher must honour `public: true` for the
   webhook route AND must deliver the raw body unmodified** —
   pre-parsing JSON breaks HMAC. Shared item with public-funnel
   completion routes + memberships R4 webhook + forms R9 public
   submit + rank-my-website run/capture (R023).
7. **NEW** `VaultPort` adapter wrapping `credentials-vault` to
   resolve the install's `webhookSecret` setting at request time.
   The webhook secret is per-install, lives in the vault, never
   round-trips through API responses.
8. Cross-plugin event router fan-out: `stripe.subscription.*`
   payloads can drive memberships entitlement state in a later
   round (out of scope here).

## NOT in scope (post-ship)

- Stripe charges or invoicing — POST-SHIP per round prompt.
- Stripe Connect / tax — POST-SHIP.
- Embedded payment UI — POST-SHIP.
- Replay tooling (admin "re-run this event" button) — operator can
  delete the event row from storage to allow re-ingest; nicer UX
  later.
- Pagination beyond `limit` — events index capped at 500
  most-recent at storage layer, sufficient for the v1 surface.

## R1 commit

T2 R025 single commit. After R025 T2 has shipped 21 plugins.
Ship-gate WS-D progress: SMTP outbound (R024) + Stripe events (R025)
both landed.
