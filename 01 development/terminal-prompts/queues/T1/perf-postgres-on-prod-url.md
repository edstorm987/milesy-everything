/loop

# T1 — perf-followup: Postgres backend on a real prod DB URL

The single biggest hot-path lever surfaced by the chapter #168 perf
audit. `PORTAL_BACKEND=postgres` is wired (T1 R027 + chapter #134
Postgres backend) but every prod env still falls through to the
file-backed dev backend, which is fsync-heavy and load-bearing
across every API call.

## Pre-read

- Chapter #168 (perf audit easy wins).
- Chapter #134 (Postgres backend + PITR).
- `runbooks/deploy.md` §2a env table (`DATABASE_URL` + `?sslmode=require`).
- `src/server/storage/` (file vs postgres backend selector).

## Scope

**Operator action primary**: provision a Postgres URL (Neon / Supabase /
Vercel Postgres — Neon's 24h PITR is the default per chapter #134).
Set `DATABASE_URL` + `?sslmode=require` in Vercel env. Optional
explicit `PORTAL_BACKEND=postgres`.

**T1 work**: end-to-end smoke that the auto-derive flips correctly
when `DATABASE_URL` is present (`scripts/smoke-postgres-backend-wired.test.ts`
is the start). Validate connection-pool sizing under repeat /dev/pov
+ /portal/agency hammer load; document p95 in chapter.

## Smoke

`npm run smoke:postgres-backend-wired` clean, plus a NEW
`scripts/smoke-perf-postgres-rps.mjs` that hammers `/api/auth/me` +
`/portal/agency` against a deployed Vercel preview pointing at the
prod Postgres URL and prints p50/p95/p99.

## Done when

- Vercel preview env has `DATABASE_URL`, smoke passes against it.
- p95 documented (best-guess target: <250ms warm, <800ms cold).
- Chapter row added.

## Q-ASSUMED at queue time

- Operator picks the Postgres provider (no preference baked in).
- Connection pool size left as upstream default until perf data
  argues otherwise.
