/loop

# T2 — Round 024: SMTP outbound — wire `email-sender` to a real provider (WS-D R024)

Existing `@aqua/plugin-email-sender` plugin currently logs-only. Wire
it to Postmark (preferred) with a fallback to raw SMTP. Per-install
creds in `pluginInstalls[*].config`.

Plan: chapter #124 WS-D R024. Ship-gate item.

## Pre-read

- T2 email-sender existing chapter (whichever round shipped it).
- Architecture §"Per-install plugin config" (creds in install.config,
  NEVER env).
- Postmark API docs (server token + REST v1).

## Scope

**A** — Provider abstraction: `EmailProvider` interface with `send(msg)`.
Implementations: `PostmarkProvider`, `SmtpProvider` (nodemailer-style),
`LogProvider` (current default for dev).

**B** — Provider picker reads `install.config.provider` and routes.
Falls back to `LogProvider` when no provider configured (dev) — never
silently drops.

**C** — Message shape: `{ to, from, subject, html, text?, replyTo?,
tags? }`. `from` defaults to install.config.fromAddress (must verify
domain in Postmark before send — chapter notes the operator step).

**D** — Wire 3 callers:
- `signup → email-verify` (T1 R020)
- `team-invites → invite link` (when T1 R024 invites round runs)
- `support-desk → ticket reply` (T2 R017)

Each caller writes to a queue (`emailQueue` table in Postgres) which
the provider drains. Idempotent on (tenant, messageId) so retries
don't double-send.

**E** — Health surface: admin Settings page for email-sender shows
last-N sends + delivery status (Postmark webhook drops events into the
plugin's `deliveryEvents` table).

**F** — Smoke `§ SMTP outbound` (≥12 — provider picker; queue
idempotency; Postmark mock returns mock id; LogProvider unchanged in
dev; webhook ingestion + status update).

**G** — Chapter `04-plugin-email-sender-smtp.md` (or update existing) + MASTER row.

## NOT in scope
- Outbound rate-limiting beyond Postmark's defaults — post-ship.
- Real Postmark integration test in CI (manual verify).

## When done
DONE referencing `024-smtp-outbound.md`.
