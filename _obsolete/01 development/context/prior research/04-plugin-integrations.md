# `@aqua/plugin-integrations` — connection registry

T2 R016 · scopePolicy `"either"` · alpha · `core: false` · soft-pairs `credentials-vault`

## Why

Operator runs the agency through a stack of third-party tools — Stripe
for billing, Mailchimp for email, Google Workspace, Meta for ads,
Slack for ops, Zapier for automations, plus the occasional bespoke
webhook receiver. Each tool requires (a) some operator-paste
identifying config, (b) credentials that must NOT live in plaintext,
and (c) a verify step to prove the connection works.

R016 ships the registry shape. Real OAuth flows + real outbound HTTP
land in T6 — until then the plugin records connection intent + config
+ a manual verify result, with credentials referenced via
`@aqua/plugin-credentials-vault` (this plugin never sees plaintext).

## Shape

```
id:           "integrations"
scopePolicy:  "either"
core:         false
requires:     ["credentials-vault"]
status:       alpha
category:     "ops"
```

`scopePolicy: "either"` — the same plugin runs at both agency scope
(operator-wide Stripe account) and per-client scope (a specific
client's GA4 / Slack workspace). Smoke 11 verifies the two scopes are
isolated even within the same agency: an agency-scope Stripe row is
invisible to a client-scope IntegrationService and vice versa.

## Domain

### `IntegrationKind` (7 values)

```
stripe · mailchimp · google · meta · slack · zapier · custom-webhook
```

Each kind ships with a config-field shape stub (`KIND_CONFIG_SHAPES`)
covering operator-paste identifying fields only. The credentials —
secrets, refresh tokens, signature keys — go through credentials-vault
and never touch this plugin.

### `IntegrationStatus` (state machine)

```
intended → configured → verified
                     ↘ failed
```

- **`intended`** — operator picked the kind but hasn't supplied
  credentials yet.
- **`configured`** — `credentialsRef` set; verify not yet attempted.
- **`verified`** — last verify call succeeded (`lastVerifiedAt`
  stamped, `lastError` cleared).
- **`failed`** — last verify call failed (`lastError` populated).

Auto-promote `intended → configured` on the unset→set
`credentialsRef` transition; auto-demote back when cleared.
`verified` and `failed` are stamped only by an explicit `verify` call
— a config patch doesn't reset them, so an existing connection's
verified state survives a label edit. Smoke 4 verifies the auto
promote/demote.

### `Integration`

```
{ id, agencyId, clientId? (undefined = agency-scope),
  kind, label, status,
  config: Record<string, string>,   // operator-paste fields per KIND_CONFIG_SHAPES
  credentialsRef?: string,           // vault entry id; service does NOT dereference
  lastVerifiedAt?, lastError?,
  createdBy?, createdAt, updatedAt }
```

### `WebhookLogEntry` (bounded ring-buffer)

```
{ id, agencyId, clientId?, integrationId?, direction: incoming|outgoing,
  ts, url?, method?, status?, ok, bodyPreview? (first 1KB),
  error? }
```

`MAX_LOG_ENTRIES = 200` per scope. `WebhookLogService.append` drops
oldest in-scope entries on overflow; agency-scope appends do NOT
evict client-scope entries (the cap is per scope, not per row count).
Smoke 10 verifies the cap.

## Services

| Service              | Operations |
|----------------------|------------|
| `IntegrationService` | `create` · `update` (auto-promote/demote) · `verify(ok\|fail)` · `delete` · `get` · `list({kind?,status?})` |
| `WebhookLogService`  | `append` · `list({integrationId?,direction?})` · `ping(actor,id,{url?})` — records outgoing test |

### `verify` (manual stamp)

```ts
await c.integrations.verify(actor, id, { ok: true });
await c.integrations.verify(actor, id, { ok: false, message: "auth refused" });
```

Caller passes the result. The plugin doesn't attempt the network
call itself in v1 — real verifiers per kind (a `GET /v1/account` for
Stripe, an OAuth introspect for Google, etc) wire in T6. The verify
step stamps `lastVerifiedAt`, transitions `status` to `verified` /
`failed`, and emits `integrations.integration.verified` /
`.failed`. On success, `lastError` is cleared. Smoke 5 verifies.

### `ping` (outgoing test)

Records an outbound test entry in the webhook log. Doesn't actually
fetch — real outbound HTTP wires in T6. The entry serves as an audit
breadcrumb ("operator clicked Test on Slack at 12:43") so the log is
useful even before live dispatch lands.

## API (8 routes)

```
GET    list      ?kind=&status=               VIEWERS
GET    get       ?id=                         VIEWERS
POST   create    body=Create                  ADMINS  201
PATCH  update    ?id= body=Patch              ADMINS
DELETE delete    ?id=                         ADMINS
POST   verify    ?id= body={ok,message?}      ADMINS
POST   ping      ?id= body={url?}             ADMINS
GET    log       ?integrationId=&direction=   VIEWERS
```

VIEWERS = `agency-owner` / `agency-manager` / `agency-staff`. Staff
can read the registry + log but not mutate it. Freelancers excluded
(integration credentials are admin-only by intent).

## Pages (6)

1. **`ConnectionsPage`** (default) — list of integrations with status
   pill (intended=neutral / configured=blue / verified=green /
   failed=red) + Configure / Verify deep links. Empty-state when no
   integrations.
2. **`BrowsePage`** — catalog of all 7 kinds with their config-field
   shapes (first 3 fields previewed).
3. **`ConfigurePage`** — per-integration field viewer; reads
   `KIND_CONFIG_SHAPES[kind]` to label rows.
4. **`VerifyPage`** — status + last error + the curl-equivalent
   instruction for stamping a verify result via the API (since v1 is
   manual).
5. **`WebhooksPage`** — incoming log placeholder.
6. **`OutgoingPage`** — outgoing log + ping records.

## Cross-plugin events

```
integrations.integration.created     {id,kind}
integrations.integration.updated     {id}
integrations.integration.configured  {id}             ← intended → configured
integrations.integration.verified    {id,message?}    ← verify ok
integrations.integration.failed      {id,message?}    ← verify fail
integrations.integration.deleted     {id}
integrations.webhook.incoming        {id,integrationId,ok}
integrations.webhook.outgoing        {id,integrationId,ok}
```

`.configured` / `.verified` are the load-bearing ones for downstream
consumers — e.g. the future ecommerce plugin will gate Stripe-checkout
flows on `integrations.integration.verified` for an integration of
kind `stripe`.

## Activity log

All entries land under category **`settings`** with the
`integrations.*` action prefix:

```
integrations.integration.created
integrations.integration.verified
integrations.integration.failed
integrations.integration.deleted
integrations.webhook.outgoing       (ping records here)
```

`integration.updated` and `webhook.incoming` are event-only (low-
noise — config patches and incoming bodies could fire often). Foundation
`ActivityCategory` doesn't yet include `"integrations"` — flagged
**R+1** to extend the union.

## Smoke 12/12

1. `KIND_CONFIG_SHAPES` exposes config field metadata for all 7
   kinds; each has ≥1 field.
2. `create` stores integration; status `"intended"` by default;
   emits `integration.created`; rejects invalid kind + empty label.
3. `create` with `credentialsRef` auto-promotes status to
   `"configured"` + emits `integration.configured`.
4. `update` — setting `credentialsRef` on `intended` row promotes
   to `configured`; clearing demotes back to `intended`.
5. `verify(ok:true)` sets `status="verified"` + stamps
   `lastVerifiedAt` + clears `lastError` + emits `verified`;
   `verify({ok:false, message})` sets `status="failed"` +
   `lastError` + emits `failed`.
6. `delete` removes from list+index + emits `deleted`; not-found
   throws `IntegrationNotFoundError`.
7. `list` filters by `kind` + `status` independently.
8. `ping` records outgoing webhook log entry + emits
   `integrations.webhook.outgoing` + activity action.
9. Webhook `list` filters by `integrationId` + `direction`.
10. **Webhook log is bounded to `MAX_LOG_ENTRIES=200` per scope —
    ring-buffer drops oldest on append.**
11. **`scopePolicy="either"` — agency-scope and client-scope
    installs are isolated even within the same agency** (cross-
    scope `get()` returns `null`; webhook log is per-scope).
12. Activity entries land under category `"settings"` with
    `integrations.*` action prefix.

## NOT in scope

- **Real OAuth flows** (T6 prod gate; explicitly flagged in the
  prompt).
- **Actual webhook receivers** — placeholder log only.
- Per-kind verifiers — operator stamps verify result via API.
- Touching `milesymedia website/`, `business-os/`,
  `clients/compass-coaching/` (HARD BOUNDARIES).

## R+1 candidates

- Foundation `ActivityCategory` extension `"integrations"` so the
  activity feed renders an integrations-specific chip; ride on
  `"settings"` until then.
- Real OAuth flows per kind — Stripe Connect (`acct_…` provisioning),
  Google OAuth via service account, Slack workspace install URL,
  Meta business login (T6).
- Real outbound HTTP from `WebhookLogService.ping` (today: records
  intent only).
- Real incoming webhook receivers — public per-integration URL
  derived from a signing secret (vault-stored), HMAC verification,
  bodyPreview truncation w/ full body in client-files external ref.
- Per-kind verifier modules (`{kind}.verify(creds, config)` →
  `VerifyResult`) so the operator stops stamping verify results
  manually.
- Drag-to-reorder integrations on ConnectionsPage; per-kind
  groupings.
- Bulk import from a config JSON (mirror sops `seedDefaults`
  pattern).
- Per-integration retry/backoff config + dead-letter queue for
  outgoing dispatch (T6 partnership).
- BlockDescriptor surfacing — embed an "integrations status" block
  on the operator dashboard with verified/failed counts.
- Foundation `requires:["credentials-vault"]` strict-enforcement —
  today engine soft-handles missing deps; the storage contract
  works without the vault but the UX is poor (operator pastes a
  fake `credentialsRef`).

## HARD BOUNDARIES honoured

Zero touches to `milesymedia website/`, `business-os/`,
`clients/compass-coaching/`. No edits in T1/T3/T4/T5/T6 scopes.
