# `@aqua/plugin-notifications` — channel routing (T2 R005)

Round-005 of the queue-based T2 worker. Lifts "notification channels"
from chapter #58 Tier 4 lift-inventory revival list. Pairs with
`@aqua/plugin-activity-inbox` (R003) and `@aqua/plugin-email-sender`
(R10) — graceful when either is absent.

## Shape

| Area | Decision |
| --- | --- |
| `id` | `notifications` |
| `scopePolicy` | `agency` |
| `core` | false |
| `requires` | (soft only — engine no-ops gracefully when activity-inbox / email-sender aren't installed) |
| Storage layout | `rules/index` (id list) · `rules/by-id/<id>` (NotificationRule) · `config` (ChannelConfig agency-wide) · `cooldowns/<userId>/<eventId>` (last-dispatch ts) |
| API routes | `rules · rules/get · rules/create · rules/update · rules/archive · config · config/save` |
| Pages | `NotificationRulesPage` (rules table + new-rule form + per-channel config status) |

## Domain

```
NotificationRule {
  id, userId,
  eventCategories: ActivityCategory[],   // empty = all
  channels: ChannelKey[],                // ≥1 required
  cooldownSeconds?: number,              // per (userId, eventId) dedup
  clientIds?: ClientId[],                // empty = all clients
  enabled: boolean,
}

ChannelKey = "email" | "slack" | "whatsapp" | "webhook"

ChannelConfig = {
  email?: { fromAddress? },
  slack?: { webhookUrl? },
  whatsapp?: { provider, accountSid?, fromNumber? },
  webhook?: { url, secretHeaderName?, secret? },
}
```

## Engine

`onActivityEvent(event: ActivityShape)` is the single entry point —
intended to be invoked from the foundation event-bus subscription
when this plugin is wired in. Steps:

1. Load all rules (cheap; rules count is bounded).
2. For each rule:
   - Skip if disabled.
   - Skip if `eventCategories` non-empty and doesn't include
     `event.category`.
   - Skip if `clientIds` non-empty and the event has no `clientId`
     **or** the clientId isn't in the filter set.
3. For each `channel` on the matching rule:
   - Check `(userId, eventId)` cooldown — suppress + record + emit
     `dispatch.suppressed` if within window.
   - Otherwise call the channel driver, record + emit
     `dispatch.{sent|skipped|error}` based on result.

Returns `MatchedDispatch[]` so callers (UI / smoke / debug tools) can
inspect what happened without subscribing to the event bus.

## Channel drivers (pluggable ports)

Each driver implements `ChannelDriver { channel, dispatch(input,
config) }`. Bundled defaults:

- **email** — uses the optional `EmailSenderPort` from foundation +
  `UserPort.getUser` to resolve the recipient address. Skipped with
  `email_sender_not_installed` / `user_has_no_email` reasons when
  either is absent.
- **slack** — POSTs `{ text }` to the webhook URL from
  `config.slack.webhookUrl`. Skipped when URL missing; error on HTTP
  non-2xx.
- **whatsapp** — v1 stub. Returns `skipped:whatsapp_driver_stub` when
  configured (`provider` set), `skipped:whatsapp_not_configured`
  otherwise. Operator pastes Twilio / Meta-Cloud creds; full driver
  is R+1.
- **webhook** — POSTs `{ subject, body, eventId, metadata }` to
  `config.webhook.url` with optional shared-secret header.

Foundations override any driver via
`registerNotificationsFoundation({ drivers: { slack: customSlack } })`
— the merge keeps non-overridden defaults.

## Cooldown semantics

Cooldown key = `cooldowns/<userId>/<eventId>`. Per-user means the
same event firing for two different users still dispatches to both
(test 6). Per-event-id (not per-category) means a noisy login-loop
won't dedup against a separate auth event.

`cooldownSeconds: 0 | undefined` = no cooldown (every match
dispatches).

## Smoke (12/12)

`tsx --test src/__smoke__/notifications.test.ts`. Cases:

1. `createRule` rejects empty `channels`; happy path stores + indexes.
2. Matching rule fan-outs to multiple drivers; non-matching category
   does not.
3. Empty `eventCategories` matches every category (all-events rule).
4. `clientIds` filter narrows by `event.clientId`; agency-level
   events are excluded when the filter is set.
5. Cooldown dedup — same `(userId, eventId)` within window
   suppresses; different `eventId` still dispatches; emits
   `dispatch.suppressed` event.
6. Cooldown is per-user — same `eventId` for two users dispatches to
   both.
7. Disabled rule doesn't fire; `updateRule` re-enables.
8. Graceful fallback — slack driver with NO `webhookUrl` returns
   `skipped:slack_webhook_url_missing`; engine reports skipped, no
   throw.
9. Email driver — graceful fallback when `emailSender` port absent
   → `skipped:email_sender_not_installed`.
10. Email driver — when `emailSender + user` port present, sends to
    `user.email` and reports `sent`.
11. `archiveRule` removes from index + storage; emits
    `notifications.rule.archived`.
12. `setConfig` merges patches across multiple calls; `getConfig`
    round-trips.

## Files

```
04-the-final-portal/plugins/notifications/
├── index.ts                            (manifest)
├── package.json + tsconfig.json
└── src/
    ├── lib/
    │   ├── aquaPluginTypes.ts          (vendored)
    │   ├── tenancy.ts                  (vendored)
    │   ├── domain.ts                   (NotificationRule, ChannelConfig, DispatchInput, MatchedDispatch, ActivityShape)
    │   ├── ids.ts · time.ts
    ├── server/
    │   ├── ports.ts                    (StoragePort, ActivityLogPort, EventBusPort, ChannelDriver, EmailSenderPort, UserPort, TenantPort)
    │   ├── drivers.ts                  (emailDriver, slackDriver, whatsappDriver, webhookDriver, defaultDrivers)
    │   ├── notifications.ts            (NotificationService — rules CRUD + onActivityEvent engine + cooldown)
    │   ├── foundationAdapter.ts        (register / containerFor / driver merge)
    │   └── index.ts                    (barrel)
    ├── api/
    │   ├── handlers.ts                 (7 handlers)
    │   └── routes.ts
    ├── pages/
    │   └── NotificationRulesPage.tsx   (rules table + new-rule form)
    └── __smoke__/notifications.test.ts (12 cases)
```

## HARD BOUNDARIES honoured

- Zero touches to `04-the-final-portal/milesymedia website/` (T4).
- Zero touches to `04-the-final-portal/business-os/` (T4).
- Zero touches to `04-the-final-portal/clients/compass-coaching/`.

## R+1 candidates

- Real WhatsApp driver (Twilio + Meta-Cloud paths) replacing the v1
  stub.
- SMS driver (was deferred from this round).
- Mobile push driver (FCM / APNs).
- Per-rule rate limit (today's cooldown is per-event-id; a
  per-time-bucket cap would also help).
- Foundation-side activity event subscription wiring — when the
  event bus exposes a `subscribe()` API, this plugin should register
  `onActivityEvent` so it doesn't need an explicit caller.
- Templated bodies (markdown / Liquid) so dispatched messages can
  include richer payloads than `[category] action`.
- Per-user preferences page (today only the agency rules table
  exists; the chapter §C ask is a thin wrapper around `?userId=`).
- Foundation `cryptoPort` lift — webhook secret should be encrypted
  at rest once the credentials-vault crypto helper graduates.
