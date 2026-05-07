/loop

# T1 — Round 030: Basic observability (WS-E R030)

Request log middleware + Sentry wiring + healthcheck-with-real-state.
Final WS-E ship-gate item.

Plan: chapter #124 WS-E R030.

## Pre-read

- `runbooks/deploy.md` §2a SENTRY_DSN env (already documented).
- Existing `/healthz` (likely returns 200 unconditionally — make it real).
- T1 R027 Postgres backend (healthcheck checks DB connection).

## Scope

**A** — Sentry wire-up:
- Install `@sentry/nextjs` (or check if already present).
- `SENTRY_DSN` (server) + `NEXT_PUBLIC_SENTRY_DSN` (browser) configured.
- `tracesSampleRate` from env (default 0.1 in prod, 0 in dev).
- Filter known false-positive errors (404s on auth-required routes).

**B** — Request log middleware: lightweight; logs `{ method, path,
status, durationMs, userId?, agencyId? }` to stdout (JSON line). Skips
high-volume static assets (`/public/**`) and healthcheck.

**C** — `/healthz` upgrade: returns
`{ ok, db: "connected"|"down", plugins: <count>, uptime: <sec>,
  version: "<git-sha>" }`. 503 if DB down. 200 otherwise.

**D** — Error boundary: top-level `app/error.tsx` already exists; ensure
it reports to Sentry on render. Same for API route errors.

**E** — Smoke `§ Observability`: healthz reports DB state; request log
emits expected shape; Sentry init doesn't crash dev when DSN unset;
error boundary reports + renders fallback.

**F** — Chapter `04-observability.md` + MASTER row.

## NOT in scope
- Custom metrics dashboards (post-ship).
- Distributed tracing across plugins (post-ship).

## When done
DONE referencing `030-observability.md`.
