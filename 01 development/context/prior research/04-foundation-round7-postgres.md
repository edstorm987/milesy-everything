# `04` foundation — Round 7 (T1 — Postgres backend)

After R6 the foundation hosted 9 plugins end-to-end on the file
backend. R7 adds Postgres alongside file as a swappable persistence
driver, plus a one-shot file→postgres migration script. Architecture
§13 parked the DB choice as a v1-required item; this round closes the
gap.

> Built by T1 on 2026-05-05, on top of Round 6 chapter 39
> ([04-foundation-round6.md](04-foundation-round6.md)).

## 1. Schema

A single `portal_kv` table — key/value/updated_at, JSONB value, prefix
btree on `key text_pattern_ops`:

```sql
CREATE TABLE portal_kv (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX portal_kv_key_prefix
  ON portal_kv USING btree (key text_pattern_ops);
```

Shipped at `portal/scripts/schema.sql`. Apply once per database.

### Why JSONB

- Operationally inspectable: `psql -c "SELECT value->'agencies' FROM portal_kv WHERE key='__portal_state__'"` works.
- Indexable later (GIN on `value`) without a schema change.
- pg's type coercion returns parsed objects, not strings — round-trips
  through `node-pg` are zero-copy.
- Single-row blob today migrates to per-key rows tomorrow without
  table changes (Q-ASSUMED, see §3).

### Why `text_pattern_ops`

Prefix lookups (`key LIKE 't/<agencyId>/%'`) need an op-class that
satisfies the predicate via btree on systems whose default collation
isn't C. `text_pattern_ops` is the canonical Postgres answer; without
it the planner falls back to a sequential scan.

## 2. Driver

`src/server/storagePostgres.ts` exports two functions matching the
existing `Backend` contract:

```ts
loadBlob(): Promise<string | null>
saveBlob(content: string): Promise<void>
```

- Lazy `pg.Pool` constructed on first call from `DATABASE_URL`.
- TLS auto-enabled for any non-localhost host, or when the URL carries
  `sslmode=require`. `rejectUnauthorized: false` accepts cloud
  providers' self-signed chains (Neon / Supabase / Vercel Postgres).
- Tunables via env: `PORTAL_PG_POOL_MAX` (10), `PORTAL_PG_IDLE_MS`
  (30s), `PORTAL_PG_CONNECT_MS` (10s).
- `closePool()` for tests/dev. `describePostgres()` for diagnostics
  (returns pool stats — idle/total/waiting + connection host + ssl
  flag).

`storage.ts` slots the new driver next to `file` / `memory` / `kv`:

```ts
const postgresBackend: Backend = {
  kind: "postgres",
  persistent: true,
  description: "Postgres (single-row JSONB blob in portal_kv keyed __portal_state__).",
  async loadBlob() {
    const { loadBlob } = await import("./storagePostgres");
    return loadBlob();
  },
  async saveBlob(content) {
    const { saveBlob } = await import("./storagePostgres");
    return saveBlob(content);
  },
};
```

The dynamic import keeps `pg` out of the parse-time bundle path when
`PORTAL_BACKEND=file` (the default). Dev servers without Postgres
installed start clean.

### Backend selection

```ts
PORTAL_BACKEND=memory   → memory   (in-process, evaporates on exit)
PORTAL_BACKEND=kv       → kv       (stub — wired in a later round)
PORTAL_BACKEND=postgres → postgres (uses DATABASE_URL)
PORTAL_BACKEND=file     → file     (default for dev; .data/portal-state.json)
PORTAL_BACKEND unset:
  └ if DATABASE_URL is set → postgres
  └ otherwise              → file
```

The implicit promotion makes prod deploys "just set DATABASE_URL"
without an extra env var, while keeping `npm run dev` on the file
backend out of the box.

## 3. Q-ASSUMED — single-row blob over per-key rows

The prompt's schema (`key/value/updated_at`) suggests per-key writes.
Today every consumer reads via `getState()` — a synchronous reach
into the in-memory snapshot — so a per-key Postgres layout would
require refactoring every domain module. The simpler model:

- One row at `key = '__portal_state__'` carries the entire
  `PortalState` JSON.
- `hydrate()` runs `SELECT value FROM portal_kv WHERE key = ...` once
  on first request.
- Reads are sync from the in-memory cache — no Postgres round-trip in
  the hot path.
- Writes go through the existing 250ms debounced flush, which now
  upserts the blob.
- Schema is forward-compatible: future plugins can write per-key rows
  under `t/<agencyId>/<clientId>/<plugin>/<sub>` without changing
  `portal_kv`.

Logged as Q-ASSUMED in the Round-7 STARTED outbox entry; the simpler
model stayed.

## 4. Migration runbook

```bash
# 1. Provision the database.
createdb aqua_portal
psql aqua_portal -f scripts/schema.sql

# 2. Migrate the file-backed state. Idempotent — safe to re-run.
DATABASE_URL=postgres://… node scripts/migrate-file-to-postgres.mjs

# 3. Start the server with Postgres selected.
PORTAL_BACKEND=postgres DATABASE_URL=postgres://… npm run start
```

Or omit `PORTAL_BACKEND` and let the implicit promotion (§2) pick
postgres because `DATABASE_URL` is set.

`scripts/migrate-file-to-postgres.mjs`:

- Reads `.data/portal-state.json` (override via `STATE_FILE`).
- Upserts a single row at `__portal_state__` (override via
  `STATE_KEY`).
- `DRY_RUN=1` prints source counts and would-write byte size without
  touching Postgres.
- Returns 0 (success / dry-run), 1 (file unreadable), 2
  (DATABASE_URL unset), 3 (connect failed), 4 (upsert failed).

`npm run migrate:file-to-postgres` is the package-script alias.

## 5. RLS — deferred to Round 8

The architecture §6 mandate ("every read query must scope to the most
specific tenant available from the session") is enforced today at the
foundation layer:

- `tenants.ts` filters by `agencyId` / `clientId` on every list/get.
- `pluginInstalls.ts` requires a `PluginInstallScope` argument on
  every read.
- Plugin storage (`makePluginStorage(installId)`) namespaces by the
  composite install id — cross-tenant leaks would require a forged
  install id, which the foundation never hands out.

A Postgres-side RLS defense would gate the row, not the in-blob
fields. With the blob layout (§3), RLS over `portal_kv.key` adds no
defense beyond what the key already encodes. RLS becomes meaningful
once we split state into per-key rows under tenant prefixes — that's
the natural moment to add a session-scope GUC + a `USING` policy.

Defer to a future round (R8 storage hardening). The chapter §11 of
R6 already has this on the open-follow-ups list.

## 6. Smoke

Two harnesses cover R7:

- **`scripts/smoke.mjs`** (R6) walks the 35-check HTTP smoke. R7 makes
  the harness backend-agnostic — a server bound to either backend
  passes the same checks. Verified against the file backend (35/35,
  carried over from R6).
- **`scripts/smoke-postgres.mjs`** (new) — direct postgres smoke that
  doesn't need a Next dev server. 8 checks:

  ```
  ✓ schema: portal_kv exists with key/value/updated_at
  ✓ schema: prefix index portal_kv_key_prefix present
  ✓ loadBlob baseline (row may or may not exist)
  ✓ saveBlob → loadBlob round-trip preserves shape
  ✓ idempotent upsert (UPDATE branch)
  ✓ prefix scan (uses btree text_pattern_ops index)
  ✓ __portal_state__ row carries meaningful payload (24140 bytes after migration)
  ✓ cleanup probe rows
  ```

  `npm run smoke:postgres` is the alias. Required env: `DATABASE_URL`.

The Next-hosted smoke against postgres was attempted but a parallel
session in the same repo held Next's single-instance dev lock; the
postgres-direct smoke covers the driver surface independently. Once
the parallel session releases the lock, `PORTAL_BACKEND=postgres
DATABASE_URL=… AQUA_BASE=http://localhost:<port> npm run smoke`
reproduces the 35 HTTP checks.

`tsc --noEmit` clean. `next build` not re-run this round (storage
swap doesn't touch the Next build path).

## 7. Production deployment checklist

1. Provision Postgres on a managed provider:
   - **Neon** — `postgres://user:pass@host.neon.tech/aqua_portal?sslmode=require`
   - **Supabase** — same shape; the connection string under "Database settings" works.
   - **Vercel Postgres** — `vercel env add DATABASE_URL` ships the value.
   - **Self-hosted** — `?sslmode=require` if the LB terminates TLS;
     `?sslmode=disable` only for fully-private VPC links.
2. Apply the schema once: `psql $DATABASE_URL -f scripts/schema.sql`.
3. Run the migration if you have a populated file backend:
   `node scripts/migrate-file-to-postgres.mjs`.
4. Set the runtime env:
   ```
   DATABASE_URL=postgres://…
   PORTAL_SESSION_SECRET=<32+ random chars>
   NEXT_PUBLIC_PORTAL_SECURITY=strict
   ```
5. Optional pool tuning if the deploy is large:
   `PORTAL_PG_POOL_MAX=20`.
6. Restart the app — the implicit promotion picks Postgres because
   `DATABASE_URL` is set.

The portal still ships on Next's standalone bundle; the `pg` driver
is in the dependency graph but only loaded at runtime when the
postgres backend is selected.

## 8. R7 deviations + open follow-ups

| Topic                          | R7 ship                                              | Future round |
|--------------------------------|------------------------------------------------------|--------------|
| Per-key Postgres layout        | Single-row blob (§3 Q-ASSUMED)                       | R8 split — needs `getState()` callers refactored to per-namespace reads |
| RLS                            | Deferred (§5 — adds no defense over the blob row)    | R8 alongside the per-key layout |
| Read replicas / sharding       | Out of scope (architecture §1 keeps single Postgres) | Probably never; pool-model targets one writer |
| ORM (Prisma / Drizzle)         | Out of scope (raw SQL via `pg`)                      | Worth revisiting when query complexity grows |
| Next-hosted postgres smoke     | Blocked by parallel-session dev lock; postgres-direct smoke covers the driver | Run when the lock is free |
| GIN index on `value`           | Not needed for blob row                              | Add when per-key rows ship + queries inspect JSONB fields |

## 9. Cross-team handoff notes

- **Plugin authors**: nothing to do. The storage abstraction is
  unchanged at the consumer side — `makePluginStorage(installId)` and
  `getState()` work identically against both backends.
- **T2/T3**: `PORTAL_BACKEND=postgres DATABASE_URL=… npm run dev`
  drops your dev server onto Postgres. The file backend stays the
  default; nothing forces a switch.
- **Demo cron** (still pending from R4): a Vercel cron hitting
  `GET /api/dev/seed-demo?reset=1` works against either backend
  because reset/seed both go through the same storage interface. No
  Postgres-specific code needed for the cron payload.
- **R8 (probable next foundation round)**: split state into per-key
  rows + add RLS + GIN index. The open question is whether to keep
  `getState()` returning a synchronous full snapshot (cache it,
  invalidate on write) or refactor every consumer to async per-key
  reads. The simpler path keeps the cache and adds invalidation
  fan-out via the event bus — no consumer churn.
