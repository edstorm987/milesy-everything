# Email-sender plugin (T2 R10)

`@aqua/plugin-email-sender` — cross-cutting outbound email engine. Single
point of egress for every transactional / notification email across the
agency portal. `scopePolicy: "agency"`, `core: false`, no hard deps.
Other plugins fan their notifications via cross-plugin events; foundation
R6 router lights up the four declared subscribers on this plugin's
EmailService.

> Built by T2 on 2026-05-04 as Round 10. tsc-clean standalone; 7/7
> smoke pass. Postmark + no-op drivers active; sendgrid/resend/smtp
> are stubs flagged R11.

## 1. Package shape

```
04-the-final-portal/plugins/email-sender/
├── index.ts                          default-exports the AquaPlugin manifest
├── package.json                      @aqua/plugin-email-sender@0.1.0
├── tsconfig.json
├── src/
│   ├── lib/
│   │   ├── aquaPluginTypes.ts        vendored AquaPlugin contract
│   │   ├── domain.ts                 EmailMessage · SenderIdentity · ProviderConfig · webhook event · subscription descriptor
│   │   ├── tenancy.ts                Mirror types (+ "email" added to ActivityCategory)
│   │   ├── ids.ts                    makeId + fnv1a (idempotency hash)
│   │   └── time.ts                   stubable clock
│   ├── server/
│   │   ├── ports.ts                  Storage · Tenant · ActivityLog · EventBus · PluginInstallStore (+ optional MarketingTemplatePort) · EmailDriver
│   │   ├── drivers/
│   │   │   ├── postmark.ts           PostmarkDriver (real fetch impl + webhook verify)
│   │   │   ├── noop.ts               NoopDriver (returns synthetic externalRef; tests + dev)
│   │   │   └── index.ts              defaultDriverRegistry + StubDriver for sendgrid/resend/smtp
│   │   ├── identities.ts             IdentityService (CRUD + getDefault + verifyDomain)
│   │   ├── provider.ts               ProviderService (masked apiKey + status + markActive/markError)
│   │   ├── emails.ts                 EmailService (enqueue + state machine + 4 cross-plugin subscribers)
│   │   ├── delivery.ts               DeliveryService (queued → sending → sent/failed via active driver; retry path)
│   │   ├── webhook.ts                WebhookService (verify via driver + dedupe by eventId + status update + emit)
│   │   ├── foundationAdapter.ts      registerEmailSenderFoundation + containerFor + EVENT_SUBSCRIPTIONS
│   │   └── index.ts                  buildEmailSenderContainer + barrel
│   ├── api/
│   │   ├── handlers.ts               12 handlers (admin + 1 public webhook + 1 internal enqueue)
│   │   └── routes.ts                 ROUTES (per-route visibleToRoles; public:true on the webhook)
│   ├── pages/
│   │   ├── OutboxPage.tsx            mounted at "" + "outbox"
│   │   ├── SettingsPage.tsx          provider config + sender identities
│   │   └── LogsPage.tsx              failed + bounced (last 100)
│   └── __smoke__/
│       └── email-sender.test.ts      7 node:test cases via tsx --test
└── package-lock.json
```

22 source files, ~3300 LOC, zero runtime deps (Postmark hit via global `fetch`).

## 2. Manifest (key fields)

```ts
{
  id: "email-sender",
  category: "core",
  status: "alpha",
  core: false,                          // installable, not auto-enabled
  scopePolicy: "agency",                // agency-scoped — single egress per agency
  requires: [],                         // no HARD deps; agency-marketing soft-integrates via port
  navItems: [Outbox · Settings · Logs],
  pages: 4 entries (Outbox ×2 + Settings + Logs),
  api: ROUTES,                          // 12 routes
  storefront.blocks: none,              // server-side only
  features: [drivers, idempotency, cross-plugin-subscribers, webhook-ingest],
  settings.groups: [
    provider (provider, webhookSecret),
    defaults (defaultFromName, defaultFromEmail),
  ],
  onInstall: bootstraps default sender identity (from defaultFromName/defaultFromEmail),
  healthcheck: provider status + identity count + queued/failed counts,
}
```

## 3. Domain model (v1)

```ts
type EmailMessage = {
  id, agencyId, clientId?,
  to: string[], cc?, bcc?,
  from: { name, email },
  replyTo?,
  subject, bodyHtml?, bodyText?,
  templateId?, templateValues?,        // resolved via MarketingTemplatePort
  attachments?: { filename, contentBase64, contentType }[],
  status: "queued"|"sending"|"sent"|"failed"|"bounced",
  failureReason?,
  externalRef?,                        // provider's message id (Postmark MessageID)
  scheduledFor?,
  sentAt?, createdAt, updatedAt,
  triggeredByPlugin?,                  // forms / memberships / affiliates / auth / email-sender
  idempotencyKey,                      // fnv1a(triggeredByPlugin + ":" + (externalRef ?? sortedTo + bodyHash))
};

type SenderIdentity = {
  id, agencyId, clientId?,
  name, email,
  verifiedAt?, isDefault, status: "active"|"pending"|"failed",
  createdAt, updatedAt,
};

type ProviderConfig = {
  agencyId,
  provider: "postmark"|"sendgrid"|"resend"|"smtp"|"none",
  apiKeyMasked?,                       // last 4 chars only
  defaultFromIdentityId?,
  webhookSecret?,                      // signature compare for inbound delivery webhooks
  status: "active"|"unconfigured"|"error",
  testedAt?, errorMessage?, updatedAt,
};
```

### Email state machine

```
queued    → sending | failed
sending   → sent | failed
sent      → bounced
failed    → queued (via resetForRetry; only failed/bounced can re-enter)
bounced   → queued (via resetForRetry)
```

`markSent` is the sole path to `sent`. `resetForRetry` is the sole path
back to `queued` (called from `DeliveryService.retry`). `update()` is
not exposed as a generic patch — every state change runs through a
named transition method.

### Idempotency

```
idempotencyKey =
  triggeredByPlugin && externalRef
    ? `${triggeredByPlugin}:${externalRef}`
    : `${triggeredByPlugin ?? "manual"}:${sortedRecipients}:${fnv1a(subject|bodyHtml|bodyText)}`
```

Re-enqueuing the same key collapses onto the prior row and returns it
unchanged. Critical for at-least-once event-bus delivery — the same
`affiliate.payout_completed` event firing twice produces exactly one
email.

## 4. Storage layout

```
email/by-id/<id>                → EmailMessage
email/by-status/<status>        → string[] of message ids per status
email/index                     → string[] of all message ids
email/idem/<key>                → IdempotencyEntry { messageId, triggeredByPlugin?, externalRef?, createdAt }

identities/by-id/<id>           → SenderIdentity
identities/index                → string[] of identity ids

provider/config                 → ProviderConfig (masked)
provider/api-key                → string  (full key — never returned via API)

webhook/seen/<eventId>          → WebhookEventSeen (dedupe per provider event id)
```

`provider/api-key` is read only inside `ProviderService._readApiKey()` —
DeliveryService loads it once per send. Public API responses always go
through `ProviderService.get()` which only carries the masked tail.

## 5. API surface (12 routes)

Mounted at `/api/portal/email-sender/...`. One public webhook route.

| Method · Path | Handler | Roles |
|--------------|---------|-------|
| GET `messages` | listMessagesHandler | admin viewers |
| GET `messages/get` | getMessageHandler | admin viewers |
| POST `messages/retry` | retryMessageHandler | admin admins |
| GET `identities` | listIdentitiesHandler | admin viewers |
| POST `identities` | createIdentityHandler | admin admins |
| PATCH `identities` | updateIdentityHandler | admin admins |
| POST `identities/verify` | verifyIdentityHandler | admin admins |
| GET `provider` | getProviderHandler | admin viewers |
| PATCH `provider` | updateProviderHandler | admin admins |
| POST `test` | testSendHandler | admin admins |
| **POST `public/webhook/postmark`** | postmarkWebhookHandler | **public** |
| POST `internal/enqueue` | internalEnqueueHandler | admin admins |

`admin viewers` = agency-owner / agency-manager / agency-staff;
`admin admins` = agency-owner / agency-manager. The webhook is `public`
because Postmark calls it without portal auth — the `?secret=` query
param is the credential.

## 6. Drivers

Each provider implements `EmailDriver { kind, send, verifyWebhook? }`.
`DeliveryService` looks up the driver by `ProviderConfig.provider` at
send time so swapping providers is a settings flip.

| Provider | Status | send | webhook verify | Notes |
|---------|--------|------|---------------|-------|
| `postmark` | live | POST `https://api.postmarkapp.com/email` (X-Postmark-Server-Token) | `?secret=` query-param exact-match | No SDK dep; uses global `fetch`. Smoke injects a stub. |
| `none`     | live | synthetic `noop_<id>` ref, no network | n/a | Default until provider is configured. |
| `sendgrid` | stub | throws `R11 stub: sendgrid` | — | Wired in R11. |
| `resend`   | stub | throws `R11 stub: resend` | — | Wired in R11. |
| `smtp`     | stub | throws `R11 stub: smtp` | — | Wired in R11. |

`PostmarkDriver` constructor takes an optional `fetchImpl: typeof fetch`
override so the smoke test can inject a recording fetch — production
resolves the global. Webhook verification compares the URL's
`?secret=...` query param (Postmark's convention) against
`ProviderConfig.webhookSecret`.

## 7. Cross-plugin event subscriptions

Foundation R6 router reads `EVENT_SUBSCRIPTIONS` off the foundation
adapter at boot, looks up each `handler` method on the live
EmailService, and subscribes. Wiring is data-driven — adding a new
subscriber is one line in EVENT_SUBSCRIPTIONS + one method on
EmailService.

| Event | Handler | Email composed |
|------|---------|---------------|
| `forms.notification.requested` | `onFormsNotificationRequested` | Plain-text notification to `notifyEmails` with the submission payload |
| `membership.subscription_changed` | `onMembershipSubscriptionChanged` | Welcome (when newStatus="active") or cancellation email to subscriber |
| `affiliate.payout_completed` | `onAffiliatePayoutCompleted` | Payout-paid notification to `affiliateEmail` with amount |
| `auth.bootstrap.signup` | `onAuthBootstrapSignup` | Welcome email to new end-customer |

Each subscriber composes an `EnqueueInput` with `triggeredByPlugin` set
to the source and `externalRef` set to a stable derivative of the source
event id (subscription id + status, payout id, user id, …). The
idempotency key derived from those fields collapses event-bus retries
into a single email.

## 8. MarketingTemplatePort (optional)

When agency-marketing is installed for the same agency, foundation
supplies a `MarketingTemplatePort.getTemplate({ agencyId, templateId })`
that loads the EmailTemplate row. Optional `render({ template, vars })`
returns post-substitution `{ subject, html, text? }` — falls back to
local `{{var}}` substitution if the marketing port doesn't expose
`render`.

When the port is **absent**, `enqueue` with a `templateId` throws
`"templateId provided but agency-marketing not installed
(MarketingTemplatePort absent)"`. Templateless enqueues continue to
work (subject + body literal). This is the soft-integration pattern —
no hard dep on agency-marketing.

## 9. Smoke test (7 cases)

`src/__smoke__/email-sender.test.ts` — `node:test` via `tsx --test`.
Builds an in-memory foundation with optional MarketingTemplatePort + a
recording fetch impl wired into PostmarkDriver, walks:

| Step | Asserts |
|------|---------|
| 1 | enqueue happy path with template substitution: subject + body resolved from `tpl_welcome` + `templateValues`; `from` resolves to default identity; idempotency key prefixed by `triggeredByPlugin`; `email.queued` event emitted |
| 2 | Idempotent on `(triggeredByPlugin, externalRef)`: second enqueue with same key returns first message verbatim (subject+body of second are dropped) |
| 3 | Postmark driver: PATCH provider to postmark + apiKey + webhookSecret; deliver flips queued → sent; exactly one Postmark fetch; externalRef matches mock response's MessageID; `email.sent` event emitted |
| 4 | No-op driver: PATCH provider to "none"; deliver flips queued → sent without any fetch call; externalRef starts with `noop_` |
| 5 | Webhook signed-payload: signed Delivery payload accepted, applied=true, kind="Delivery", `email.delivered` event emitted; bad signature rejected; replay (same eventId) returns `{duplicate:true, applied:false}` |
| 6 | MarketingTemplatePort absent: enqueue with templateId rejects with "agency-marketing not installed"; templateless enqueue still works |
| 7 | Cross-plugin subscriber wiring: `EVENT_SUBSCRIPTIONS` lists exactly the 4 events; each declared handler resolves on the live EmailService; mock router invokes each subscriber and asserts the resulting EmailMessage's subject + triggeredByPlugin + bodyText |

```
▶ email-sender smoke
  ✔ step 1–7 (7/7 pass)
ℹ tests 7   ℹ pass 7   ℹ fail 0
```

`npx tsx --test src/__smoke__/email-sender.test.ts` from
`04-the-final-portal/plugins/email-sender/`.

## 10. Foundation pending (orchestrator brokerage)

| # | Task | File / Surface |
|---|------|---------------|
| 1 | Workspace dep + transpilePackages | `portal/package.json` + `portal/next.config.ts` |
| 2 | Side-effect-import file at `portal/src/plugins/foundation-adapters/emailSenderFoundation.ts` calling `registerEmailSenderFoundation({ tenant, activity, events, pluginInstalls, marketingTemplates?, drivers? })` | new file |
| 3 | `_registry.ts` append (`emailSenderManifest as unknown as AquaPlugin`) | `portal/src/plugins/_registry.ts` |
| 4 | `ActivityCategory` union += `"email"` | `portal/src/server/types.ts` |
| 5 | **Cross-plugin event router (R6)** — same item already on the pending lists for forms / memberships / affiliates / auth-bootstrap. Foundation reads `EVENT_SUBSCRIPTIONS` off the email-sender adapter at boot, subscribes the matching method on the live EmailService for each agency that has email-sender installed. | foundation event-bus adapter |
| 6 | **MarketingTemplatePort projection** — when agency-marketing is installed for the same agency, project its `templates.getTemplate` + optional `templates.render` into a MarketingTemplatePort and pass it on registration. | new adapter file |
| 7 | **Webhook public route** — confirm the catch-all dispatcher honours `public:true` (already on the foundation-pending list since memberships R4). The Postmark webhook needs anonymous POST. | `portal/src/app/api/portal/[plugin]/[...rest]/route.ts` |

## 11. Cross-team integration TODOs

- **T1 foundation** — items 1–7 above. Items 5 + 6 are the load-bearing
  ones; items 1–4 are the routine wire-up.
- **T2 forms / memberships / affiliates / auth (when foundation R6 lands)**
  — no source edits needed. Each plugin already emits the canonical
  event payloads; this plugin's subscribers consume them.
- **T2 R11** — flesh out sendgrid / resend / smtp drivers so
  `StubDriver`'s `R11 stub` errors stop showing up.
- **T2 future**: Outbox UI retry button (handler exists; UI is read-only
  in v1). Audit-log filter on the Outbox table. Per-message bodyHtml
  preview.
- **T3** — no work. Email is server-side; no storefront blocks.

## 12. NOT in scope (per the prompt)

- No real send during smoke — Postmark fetch is mocked. Production
  needs a real API key + verified domain.
- No domain-verification call to Postmark — `verifyDomain` marks the
  identity active immediately as a stub. Real impl wires
  Postmark's `/senders/{id}/verifyDomain` in a follow-up.
- No additional providers beyond Postmark + no-op for v1
  (sendgrid/resend/smtp stubs flagged R11).
- No bounce-suppression list — each bounce updates the message but
  doesn't suppress future sends to the same recipient. Future round.
- No DKIM/SPF setup helpers — handled at the agency's DNS layer.
- No source edits to other plugins.

## 13. Verification commands

```bash
cd "04-the-final-portal/plugins/email-sender"

# tsc clean
npx tsc --noEmit

# 7/7 smoke pass
npx tsx --test src/__smoke__/email-sender.test.ts
```
