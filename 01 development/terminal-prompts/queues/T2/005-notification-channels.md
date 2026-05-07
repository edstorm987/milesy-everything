/loop

# T2 — Round 005: Notification channel routing

Pairs with T2/003 activity inbox. When activity events fire, route them
to channels (Slack / WhatsApp / email / webhook) per per-user
preferences. Lifts the "notification channels" item from the lift-
inventory revival list (chapter #58 Tier 4).

## HARD BOUNDARIES

- Standard.

## Mandatory pre-read

1. Chapter `04-plugin-activity-inbox.md` (T2 003).
2. Chapter `04-plugin-email-sender.md` (T2 R10) — already exists.
3. Foundation's event bus contract.

## Scope

**Goal A — `@aqua/plugin-notifications`**
- `scopePolicy: "agency"`, requires `["activity-inbox", "email-sender"]`
  optionally (graceful when absent).
- Domain: `NotificationRule { id, userId, eventCategory[], channels:
  ChannelKey[], cooldown?: seconds }`. `ChannelKey = "email" | "slack"
  | "whatsapp" | "webhook"`. `ChannelConfig` per agency: Slack webhook
  URL, WhatsApp/SMS provider config, custom webhook URL.

**Goal B — Channel drivers (pluggable ports)**
- `EmailChannel` reuses email-sender plugin.
- `SlackChannel` posts to webhook (per-rule or global).
- `WhatsAppChannel` stub for v1 (operator pastes their Twilio creds
  later); driver is pluggable port-shape.
- `WebhookChannel` generic POST.
- Cooldown dedup per `(userId, eventId)`.

**Goal C — UI**
- `NotificationRulesPage` — list rules + create rule modal (event
  category multi-select + channel multi-select + cooldown).
- Per-user preferences in account settings.

**Goal D — Smoke + chapter**
- Smoke: rule fires on matching event, dedups, channel dispatch
  invoked, missing channel config falls through gracefully.
- Chapter `04-plugin-notifications.md`. MASTER row.

## NOT in scope

- SMS provider integration beyond port shape.
- Mobile push.
- Touching milesymedia / business-os.

## When done

DONE referencing `005-notification-channels.md`.
