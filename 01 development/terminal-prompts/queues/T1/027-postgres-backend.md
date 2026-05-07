/loop

# T1 — Round 027: Postgres backend wired (WS-E R027)

Default `PORTAL_BACKEND=postgres` when `DATABASE_URL` set. Until now
foundation has run on the file-backed store; production needs Postgres.

Plan: chapter #124 WS-E R027. Ship-gate item.

## Pre-read

- T1 R007 Postgres prior work + `04-foundation-round7-postgres.md` chapter.
- `runbooks/deploy.md` §2a env vars (PORTAL_BACKEND / DATABASE_URL).
- Existing `lib/server/storage` shape (file vs kv vs postgres adapters).

## Scope

**A** — Default-resolution: when `DATABASE_URL` is set and
`PORTAL_BACKEND` is not explicitly set, pick `postgres`. Document.

**B** — Migration runner: `scripts/migrate-to-postgres.mjs` reads
file-backed state, writes to Postgres. Idempotent — running twice is
safe (uses `INSERT ... ON CONFLICT`). Dry-run flag.

**C** — Dual-read fallback during transition: when Postgres is
configured but a key is missing, read from file once + write to
Postgres + log a one-time migration event.

**D** — Smoke against a real local Postgres URL (use a `.env.test`
pattern). Skip cleanly when `DATABASE_URL` not set so dev workflow
doesn't break.

**E** — Chapter `04-postgres-backend-wired.md` + MASTER row.

## NOT in scope
- Per-tenant DB isolation (post-ship).
- Connection pool tuning (post-ship; default works).

## When done
DONE referencing `027-postgres-backend.md`.
