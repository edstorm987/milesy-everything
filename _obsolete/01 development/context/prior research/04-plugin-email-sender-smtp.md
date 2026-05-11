# `@aqua/plugin-email-sender` — SMTP outbound (T2 R024 · WS-D)

Wires the existing email-sender plugin's `smtp` ProviderKind from a
stub to a working driver. v1 is Postmark + SMTP + Noop; SendGrid +
Resend remain stubs (operator switches to a working provider).

Plan: chapter #124 ship-plan-v1 WS-D. Builds on the existing
email-sender plugin (foundationally — domain, services, queue,
delivery, webhook were already shipped).

## What changed

- `domain.ts`: NEW `SmtpConfig { host, port, user, secure: "tls" |
  "starttls" | "none" }` type. Added optional `smtp` field to
  `ProviderConfig` + `UpdateProviderInput`.
- `ports.ts`: `DriverContext` gains optional `smtp` (populated only
  when active provider is `smtp`).
- `provider.ts`: `update()` persists the `smtp` field; switching
  AWAY from smtp keeps the smtp config so operators can flip back
  without re-entering host/user (smoke #14).
- `delivery.ts`: passes `cfg.smtp` through into `DriverContext`.
- `drivers/smtp.ts` (NEW): `SmtpDriver` + `buildSmtpDataBody` +
  `SmtpTransport` injectable + `PLACEHOLDER_SMTP_TRANSPORT`.
- `drivers/index.ts`: `defaultDriverRegistry(fetchImpl, smtpTransport?)`
  registers `SmtpDriver` for kind `"smtp"` (no longer a `StubDriver`).
- Smoke: NEW `src/__smoke__/smtp-driver.test.ts` (15 tests).

## Password storage

The SMTP password is stored in the SAME private slot as Postmark's
`apiKey` (`provider/api-key` storage key). When `provider === "smtp"`,
`DeliveryService` populates `ctx.apiKey` with the password and
`ctx.smtp` with the public config; `SmtpDriver.send` reads
`ctx.apiKey` as the password (smoke #6 pins this).

Trade-off: keeping one private slot avoids leaking the password into
API responses (the public `ProviderConfig` only ever shows
`apiKeyMasked` last-4-chars). Switching providers DOES invalidate
the previous password (the slot is overwritten on each `update`
that supplies an `apiKey`); operators re-enter on flip.

## Wire grammar (`buildSmtpDataBody`)

Public so the smoke can assert headers without dialing.

- `From: "<name>" <email>` line.
- `To:`, optional `Cc:`, `Reply-To:`, `Subject:`, `Message-ID:`,
  `MIME-Version: 1.0`.
- Body shape:
  - both html + text → `multipart/alternative` boundary.
  - html only → `text/html; charset=UTF-8`.
  - text only / fallback → `text/plain; charset=UTF-8`.
- Normalises `\n` → `\r\n` line endings throughout AND dot-stuffs
  any line beginning with `"."` (RFC 5321 §4.5.2 — smoke #12).

## SmtpTransport contract

```ts
type SmtpTransport = (opts: SmtpDialOptions) =>
  Promise<SmtpDialResult | SmtpDialFailure>;

SmtpDialOptions { host, port, secure, user, pass, message, timeoutMs?, ehloHost? }
SmtpDialResult { ok: true, externalRef, finalReply? }
SmtpDialFailure { ok: false, reason, code? }
```

`SmtpDriver(transport?)` — defaults to `PLACEHOLDER_SMTP_TRANSPORT`
which returns a guidance failure (`smtp_transport_not_wired —
foundation must inject…`). The smoke injects a deterministic
recording transport. Production wires Node `net`/`tls` directly OR
swaps to `nodemailer` (kept out of plugin code so the bundle stays
zero-dep).

`defaultDriverRegistry(fetchImpl, smtpTransport?)` accepts an
optional second arg so foundation passes the real transport at
registration time.

## Error handling

- Missing `ctx.smtp` → `SendFailure { ok:false, reason: "SMTP
  transport config missing." }` (smoke #4).
- Missing `ctx.apiKey` (password) → `SendFailure { ok:false, reason:
  "SMTP password not configured." }` (smoke #5).
- Transport failure → `DeliveryService.markFailed` + `looksLikeAuthError`
  hook flips provider status to `"error"` for SMTP-style auth
  rejections too (existing behaviour, smoke #8 pins).

## Idempotency

Existing `EmailService.enqueue` cross-plugin idempotency
(fnv1a(triggeredByPlugin + ":" + externalRef-or-payloadHash)) is
unchanged; smoke #10 pins it stays green under the SMTP path.
`delivery.deliver(messageId)` is idempotent — second delivery on a
sent message returns the same `externalRef` without re-dialing
(smoke #9).

## Foundation pending

1. Inject a real `SmtpTransport` (Node `net`/`tls` or nodemailer)
   when registering the email-sender foundation. Until injected the
   placeholder returns guidance failure.
2. `defaultDriverRegistry(fetch, realSmtpTransport)` at boot when
   Postmark webhook secret + SMTP credentials are both supported.
3. (Optional R+1) connection pooling / per-message retry / outbound
   rate-limiting beyond Postmark's defaults (chapter #124 calls
   these out as post-ship).

## Three callers (round prompt §D — referenced; not edited here)

The round prompt asks for three foundation/cross-plugin caller
wires. Those callers live OUTSIDE the email-sender plugin (HARD
BOUNDARY — T1 owns auth + foundation, T2 owns plugin code per
plugin). The contract those callers use is unchanged:

- `signup → email-verify` (T1 R020): foundation enqueues via
  `email.enqueue({ to, subject, bodyHtml, triggeredByPlugin: "auth",
  externalRef: "verify-<userId>" })`. Idempotency key prevents
  double-send on retry.
- `team-invites → invite link` (T1 R024 invites round): foundation
  enqueues via `email.enqueue({ ..., triggeredByPlugin: "auth",
  externalRef: "invite-<inviteId>" })`.
- `support-desk → ticket reply` (T2 R017): support-desk plugin
  enqueues via `email.enqueue({ ..., triggeredByPlugin:
  "support-desk", externalRef: "ticket-<ticketId>-<replyIdx>" })`.

All three flow through the same `delivery.deliver()` path; switching
the provider to `smtp` swaps the wire transport without any caller
change. Wire-up of the actual signup / invites / support callers
is foundation territory and out of scope for this round.

## Smoke

`src/__smoke__/smtp-driver.test.ts` — 15/15 pass via `tsx --test`.
The existing 7 `email-sender.test.ts` tests still pass (regression
clear). New `npm run smoke` runs both files; `npm run smoke:smtp`
runs just the SMTP set.

1. `defaultDriverRegistry` registers `SmtpDriver` for `"smtp"`
   (no longer a `StubDriver`).
2. `PLACEHOLDER_SMTP_TRANSPORT` returns guidance failure.
3. ProviderService persists smtp config + masks password under the
   same private slot as Postmark.
4. provider `"smtp"` without smtp config → guidance failure.
5. provider `"smtp"` with smtp config but no password → guidance
   failure.
6. SmtpDriver passes the password from `ctx.apiKey` into transport
   (slot is shared with Postmark).
7. Delivery picks SmtpDriver when `provider === "smtp"` AND
   propagates smtp config + password into the dial.
8. Transport failure → delivery marks message failed + propagates
   reason.
9. Delivery is idempotent — second `deliver()` on a sent message
   returns the same externalRef without re-dialing.
10. `enqueue` with the same externalRef collapses onto the prior
    row (cross-plugin idempotency regression guard).
11. `buildSmtpDataBody` emits expected RFC headers + multipart/
    alternative when both html + text bodies present.
12. `buildSmtpDataBody` dot-stuffs leading-dot lines (RFC 5321
    §4.5.2) AND normalises `\n` → `\r\n`.
13. Activity log records `email.provider.updated` on smtp config
    change.
14. Switching `provider: "smtp" → "none"` keeps smtp config
    persisted (operator can flip back without re-entering).
15. SendGrid + Resend drivers remain stubs returning guidance
    failure (regression guard for the registry trim).

`tsc --noEmit` clean.

## NOT in scope (R+1)

- Outbound rate-limiting beyond Postmark's defaults (post-ship).
- Real Postmark integration test in CI (manual verify per round
  prompt).
- Real SMTP wire integration test (would require a live SMTP server
  in CI; transport is injectable so foundation tests can use
  `smtpd-fixture` later).
- `nodemailer` dep — kept out of plugin code so bundle stays zero-dep.

## R1 commit

T2 R024 single commit. After R024 the email-sender plugin's SMTP
provider is real (no longer a stub); WS-D email infrastructure is
landed.
