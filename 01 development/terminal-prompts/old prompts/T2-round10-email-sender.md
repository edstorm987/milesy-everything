/loop

# T2 — Round 10: Email-sender plugin (`@aqua/plugin-email-sender`)

Round 9 you shipped `@aqua/plugin-forms` (`64d9dca`, 8/8 smoke). Nine
plugins shipped. Round 10 ships the **email-sender** — the cross-cutting
delivery engine every other plugin needs: agency-marketing's templates,
forms' submission notifications, memberships' welcome / invoice emails,
affiliates' payout-confirmed notes, end-customer signup confirmations.

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
3. `01 development/context/prior research/04-plugin-agency-marketing.md` (your R7b — EmailTemplate domain lives here, this plugin is the sender for those templates)
4. `01 development/context/prior research/04-plugin-forms.md` (your R9 — emits `forms.notification.requested` event for submission alerts)
5. `01 development/context/prior research/04-plugin-memberships.md` (your R4 — welcome / invoice emails are the natural integration)
6. `01 development/context/prior research/04-plugin-affiliates.md` (your R5b — payout-completed emails)

## Scope

`04-the-final-portal/plugins/email-sender/` — `@aqua/plugin-email-sender`,
self-contained package, mirror your most recent plugin shape (forms).

Manifest:
- `id: "email-sender"`
- `category: "core"` (infrastructure plugin, agency-internal)
- `scopePolicy: "agency"` — installed at agency level
- `requires: []` — no hard deps; provides via `EmailQueuePort` for any plugin that's declared one
- `core: false` — opt-in
- ~3 navItems: Outbox · Settings · Logs (panel `core`)
- ~3 admin pages
- ~10 API routes at `/api/portal/email-sender/*`
- 0 storefront blocks (infrastructure plugin)
- `onInstall` seeds default sender identity (placeholder until agency configures)

### Domain model

```ts
type EmailMessage = {
  id, agencyId, clientId?,             // clientId optional — some emails are agency-internal
  to: string[], cc?, bcc?,
  from: { name, email },               // resolved from agency / client config
  replyTo?,
  subject,
  bodyHtml, bodyText?,                 // both optional; at least one required
  templateId?,                         // optional — links back to agency-marketing EmailTemplate
  templateValues?: Record<string, string>,    // substitution dict
  attachments?: { filename, contentBase64, contentType }[],
  status: "queued"|"sending"|"sent"|"failed"|"bounced",
  failureReason?,
  externalRef?,                        // Postmark / SendGrid message id
  scheduledFor?,                       // null = send asap; future = scheduled
  sentAt?,
  createdAt, updatedAt,
  triggeredByPlugin?: string,          // "memberships" | "forms" | etc — for debugging
};

type SenderIdentity = {
  id, agencyId, clientId?,
  name, email,
  verifiedAt?,                         // domain-verification status; null until verified
  isDefault: boolean,
  status: "active"|"pending"|"failed",
};

type ProviderConfig = {
  agencyId,
  provider: "postmark"|"sendgrid"|"resend"|"smtp"|"none",
  apiKeyMasked?,                       // last 4 chars only; full key in plugin install config
  defaultFromIdentityId?,
  webhookSecret?,                      // for delivery-status webhooks
  status: "active"|"unconfigured"|"error",
  testedAt?,
};
```

### Services

- **EmailService** — `enqueue(message)` is the public entry point.
  Validates required fields, applies template substitution if
  `templateId` set (cross-reads from agency-marketing's TemplateService
  via injected port — same pattern as ecommerce↔memberships discount).
  Idempotent on `(triggeredByPlugin, externalRef)` to prevent duplicate
  sends from event-bus retries. Returns the queued EmailMessage.
- **DeliveryService** — runs the provider call. Provider drivers (one
  per provider) are pluggable. For v1, ship a Postmark driver + a
  no-op driver (logs to activity instead of sending). SendGrid and
  Resend drivers are stubs flagged Round-11 follow-ups. Real SMTP
  is future.
- **WebhookService** — receives delivery-status webhooks from Postmark
  (delivered / bounced / spam-complaint). Idempotent on Postmark message
  id. Updates EmailMessage.status. Emits `email.delivered` /
  `email.bounced` events.
- **IdentityService** — CRUD on SenderIdentity + verify-domain flow
  (pings provider's identity-verify API, marks status, updates
  `verifiedAt`).

### Ports needed from foundation

- `StoragePort`, `TenantPort`, `ActivityLogPort`, `EventBusPort`,
  `PluginInstallStorePort` (mirror prior plugins)
- `MarketingTemplatePort` — optional, returns null when agency-marketing
  not installed. Loads EmailTemplate by id. Same shape as the other
  cross-plugin reads.
- ActivityCategory union extension: `"email"`. Note for cross-team.

### API routes (~10)

Admin (`visibleToRoles: AGENCY_ROLES`):
- `GET /messages` (filter by status / triggeredByPlugin / date)
- `GET /messages/:id`
- `POST /messages/:id/retry` (re-queue a failed message)
- `GET /identities` · `POST /identities` · `PATCH /identities/:id` · `POST /identities/:id/verify`
- `GET /provider` · `PATCH /provider` (set provider + API key)
- `POST /test` (sends a test email to the requesting user)

Public-facing (no auth — webhook entry):
- `POST /public/webhook/postmark` — provider delivery callback (signed)

Internal (other plugins call):
- `POST /internal/enqueue` — protected, plugin-to-plugin via foundation routing

### Admin pages (~3)

`OutboxPage` (recent messages + filters + retry buttons),
`SettingsPage` (provider config + sender identities + verify domain),
`LogsPage` (delivery + bounce + open-rate timeline if provider exposes it).

### NO storefront blocks

Infrastructure-only.

## Cross-plugin event subscriptions (declared, T1 router fans out)

Subscribe to:
- `forms.notification.requested` → enqueue submission email per form's
  `notifyEmails` config + form's `external-webhook` URL.
- `membership.subscription_changed` → enqueue welcome / cancellation emails per agency template config.
- `affiliate.payout_completed` → enqueue payout-paid notification.
- `auth.bootstrap.signup` (foundation event) → enqueue account-created confirmation.

These are declarations only — your foundationAdapter wires
`eventBus.subscribeForPlugin('email-sender', ...)`. T1's R6 router
performs the actual fan-out.

## Foundation integration

Same pattern as forms + agency-marketing:
- `tsc --noEmit` clean inside `04-the-final-portal/plugins/email-sender/`.
- Ports declared.
- Container builder.
- Foundation adapter (`registerEmailSenderFoundation` + `containerFor`).
- Document Foundation pending list in chapter:
  - Workspace dep + transpilePackages + side-effect-import + `_registry.ts`
    append + ActivityCategory += `"email"` + 4 cross-plugin event subscribers.

## NOT in scope

- Don't build a full inbox UI (received-mail handling) — this is send-only.
- Don't build SMS / push notification — email channel only.
- Don't build template-design UI — templates live in agency-marketing.
- Don't ship real Postmark API call against live keys — use a mock
  driver for smoke. Document Postmark setup steps in the chapter.
- Don't build delivery-rate analytics dashboards — basic open/bounce
  counters in OutboxPage are enough.
- Don't touch other plugin source.

## Loop discipline

Each cycle: pull → read inbox + outbox → progress → commit → push →
append `COMMIT` → `ScheduleWakeup` with `<<autonomous-loop-dynamic>>`.
Mid-task 600–900s, fully DONE 1500s, 3 empty wakes → omit ScheduleWakeup
to end.

## When done

1. `tsc --noEmit` clean inside `04-the-final-portal/plugins/email-sender/`.
2. Smoke (`src/__smoke__/email-sender.test.ts`) — node:test cases:
   - `enqueue` happy path with template substitution.
   - Idempotent on `(triggeredByPlugin, externalRef)`.
   - Postmark driver mock: returns externalRef, message marked `sent`.
   - No-op driver: marks `sent` without external call.
   - Webhook signed-payload happy path: `delivered` updates status + emits event.
   - MarketingTemplatePort absent: enqueue without templateId still works.
   - Cross-plugin event subscriber wiring (mock router).
3. Chapter `04-plugin-email-sender.md` documenting domain, services,
   provider drivers, event subscriptions, Foundation pending list.
4. MASTER row.
5. `tasks.md` row done.
6. Final `DONE` + `COMMIT`.
