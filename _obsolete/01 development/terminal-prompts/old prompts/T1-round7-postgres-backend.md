/loop

# T1 — Round 7: Postgres backend (production storage)

Round 6 you wired the foundation to host every plugin T2 has shipped
plus the cross-plugin event router (`e297f5d`). The portal now runs
9-10 plugins end-to-end on the file backend. Round 7 swaps the
**file backend → Postgres** for production. Architecture §13 parked
this as a v1-required item; with the plugin catalogue feature-complete,
this is the single biggest readiness gap left.

## Working environment

- **Repo**: https://github.com/edsworld27/ker-v3
- **Local**: `~/Desktop/ker-v3/`
- **Branch**: `main`. `git pull --rebase --autostash && git push` after each commit.
- Top-level folders contain spaces — quote them.

## Messaging

- **Outbox**: `01 development/messages/terminal-1/to-orchestrator.md`
- **Inbox**: `01 development/messages/terminal-1/from-orchestrator.md`
- Don't stop on questions; log `Q-ASSUMED`. Only stop on `Q-BLOCKED`.

## Mandatory pre-read

1. `01 development/CLAUDE.md` (Mode A — terminal mesh)
2. `01 development/context/prior research/04-architecture.md` — §6 (tenant scoping enforcement) + §13 (parked DB choice)
3. `01 development/context/prior research/04-foundation.md` — your R1 storage abstraction
4. `01 development/context/prior research/04-foundation-round6.md` (or wherever R6 chapter lands) — current state
5. `01 development/context/prior research/aqua-server-modules.md` — §"Storage abstraction" reference for `02`'s file/postgres/kv pattern
6. `04-the-final-portal/portal/src/server/storage.ts` — current implementation
7. Any plugin's `*Foundation.ts` adapter — these are the storage consumers

## Scope — five goals

### Goal A: Postgres driver behind the existing storage abstraction

`storage.ts` already has driver pluggability (file is one of N). Add a
`postgres` driver that satisfies the same interface:
- `hydrate()` — load full state on boot (single `SELECT * FROM portal_kv`).
- `read(key)` — lookup row.
- `write(key, value)` — upsert (INSERT ... ON CONFLICT (key) DO UPDATE).
- `delete(key)` — DELETE WHERE key = $1.
- `keys(prefix)` — `SELECT key FROM portal_kv WHERE key LIKE $1 || '%'`.

Schema is intentionally minimal — single `portal_kv` table:
```sql
CREATE TABLE portal_kv (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX portal_kv_key_prefix ON portal_kv USING btree (key text_pattern_ops);
```

Pick `postgres-js` or `pg` — both fine. Connect string from
`DATABASE_URL` env var. If unset, default to file backend (so
`npm run dev` still works without Postgres locally).

### Goal B: Migration from file → Postgres

One-shot migration script: `scripts/migrate-file-to-postgres.mjs`.
Reads `state.json` (or whatever the file backend writes), pushes every
key/value into `portal_kv` via the new driver. Idempotent — safe to
re-run; uses INSERT ... ON CONFLICT.

Document the migration steps in the chapter:
1. `createdb aqua_portal`
2. `psql aqua_portal -f scripts/schema.sql`
3. `DATABASE_URL=... node scripts/migrate-file-to-postgres.mjs`
4. Restart server with `DATABASE_URL` set.

### Goal C: Connection pooling + transaction semantics

The file backend reads + writes synchronously. Postgres needs:
- Connection pool (`pg-pool` or postgres-js's built-in).
- Transactional writes for the multi-key operations (e.g. agency +
  user + plugin install all atomic on creation).
- The existing storage interface is largely sync-shaped — wrap in a
  thin async adapter that batches writes within a request scope. If
  the existing code path is fundamentally sync, log Q-ASSUMED on
  whether to refactor consumers OR keep the in-memory snapshot pattern
  (`hydrate()` once, all reads sync from snapshot, writes flush async).
  The latter is simpler — go with it by default.

### Goal D: Per-tenant scoping enforcement (defense in depth)

Architecture §6 mandates: "every read query must scope to the most
specific tenant available from the session." Today this is enforced by
helpers (`withTenantScope`). With Postgres queries on a single `portal_kv`
table, the scoping happens via the key naming convention
(`t/{agencyId}/{clientId?}/...`).

Add a Postgres-side defense: a `portal_kv_session_scope` table tracking
the active session's `(agencyId, clientId?)`, plus a row-level-security
policy that limits queries to keys matching the scope. If RLS is too
heavy for v1, document it as a Round-8 hardening item and ship without.

### Goal E: Smoke + chapter

1. Existing portal smoke harness must pass against both backends:
   - `STORAGE_BACKEND=file npm run smoke`
   - `STORAGE_BACKEND=postgres npm run smoke`
2. Migration script smoke: file backend with seed-demo state →
   migrate → postgres backend → re-run seed-demo (idempotent) → query
   counts match.
3. `tsc --noEmit` clean.
4. Chapter `04-foundation-round7-postgres.md` documenting:
   - Schema + index choice + JSONB rationale.
   - Driver shape + connection pooling.
   - Migration runbook.
   - RLS-or-deferred decision.
   - Smoke results.
   - Production deployment checklist (Vercel postgres add-on, Neon, Supabase, etc.)

## NOT in scope

- Don't migrate to Prisma / Drizzle ORM — keep the storage abstraction
  thin (raw SQL via pg or postgres-js). ORM lift is a future round.
- Don't build read replicas / sharding — single-Postgres pool model
  per architecture §1 (Shopify-style).
- Don't deploy to production — config + migration runbook only.
- Don't add an admin UI for DB stats — out of scope.
- Don't restructure the storage key conventions plugins use — keep
  the `t/{agencyId}/{clientId?}/...` namespace as-is.

## Loop discipline

Each cycle: pull → read inbox + outbox → progress → commit → push →
append `COMMIT` → `ScheduleWakeup` with `<<autonomous-loop-dynamic>>`.
Mid-task 600–900s, fully DONE 1500s, 3 empty wakes → omit ScheduleWakeup
to end. Goal A is the bulk; B + C + D + E lighter.

## When done

1. Both backends work behind the same interface.
2. Migration script tested end-to-end.
3. Smoke green on both `STORAGE_BACKEND=file` and `STORAGE_BACKEND=postgres`.
4. Chapter `04-foundation-round7-postgres.md` written.
5. MASTER row.
6. `tasks.md` row done.
7. Final `DONE` + `COMMIT`.
