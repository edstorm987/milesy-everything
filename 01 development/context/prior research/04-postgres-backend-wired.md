# Chapter 134 — Postgres backend wired (T1 R027, WS-E)

R007 shipped the Postgres backend module + the file→postgres
migration script. R027 closes the wiring gaps that block production:
the implicit-promotion default, dual-read fallback during transition,
and a smoke that skips cleanly so dev workflow without Postgres
doesn't break. Ship-gate item per chapter #124.

## Goal A — Default-resolution

Already shipped in R007 + preserved here:

```ts
const explicit = (process.env.PORTAL_BACKEND ?? "").toLowerCase();
switch (explicit) {
  case "postgres": return postgresBackend;
  // ...
  default:
    if (!explicit && process.env.DATABASE_URL) return postgresBackend;
    return fileBackend;
}
```

**Contract**: production "set `DATABASE_URL` and go" — the implicit
promotion picks Postgres without operators having to also set
`PORTAL_BACKEND`. Local dev (no `DATABASE_URL`) stays on the file
backend.

## Goal B — Migration runner

`scripts/migrate-file-to-postgres.mjs` (also from R007) reads the
file backend's `.data/portal-state.json` and `INSERT ... ON CONFLICT`
upserts into `portal_kv`. Idempotent — second run is a no-op. The
`DRY_RUN=1` env var parses + summarises but skips the upsert.

This round didn't extend the script — every prompt requirement (idempotence
+ dry-run) was already satisfied. The smoke verifies both source-markers
so future drift trips a test.

## Goal C — Dual-read fallback

NEW behaviour in `ensureHydrated` (storage.ts). When Postgres is
configured but the blob row is missing, we read from the file backend
once, hydrate the cache, and fire-and-forget write the blob into
Postgres so the next cold start reads natively:

```ts
let raw = await backend.loadBlob();
if (!raw && backend.kind === "postgres") {
  try {
    const fallback = await fileBackend.loadBlob();
    if (fallback) {
      raw = fallback;
      backend.saveBlob(fallback)
        .then(() => console.warn("[portal] dual-read fallback: hydrated cache from file backend + wrote to Postgres."))
        .catch(err => console.warn("[portal] dual-read fallback: file→postgres write failed:", err));
    }
  } catch (fallbackErr) {
    // file-backend read failure is non-fatal — cache stays empty.
  }
}
cache = raw ? parseBlob(raw) : empty();
```

**Why fire-and-forget**: hydrate is cold-start critical path — we
don't want to block the boot on a cross-region Postgres write. Cache
is populated either way; the write is best-effort and surfaces in
the warn channel.

**Why log "migration event"**: ops needs to see the seam. The warn
appears once per cold start that exercised the fallback; subsequent
boots find the row natively and the message stops.

The branch only fires when:
- Backend is `postgres` (not file/memory/kv).
- Postgres `loadBlob()` returned `null` (no row at `__portal_state__`).
- File backend has a non-null blob.

In every other case (Postgres has data; both empty; file unreachable)
the existing flow runs unchanged.

## Goal D — Smoke

NEW `scripts/smoke-postgres-backend-wired.test.ts` (run via
`npm run smoke:postgres-backend-wired`, 10/10 pass + 1 opt-in skipped
when `DATABASE_URL` absent, ~2.9s).

Six suites:

- **Default-resolution** (2) — implicit promotion source-marker;
  explicit `postgres` → postgresBackend.
- **Dual-read fallback** (3) — `backend.kind === "postgres"`
  branch; saveBlob + log; non-fatal failure mode.
- **Migration runner** (2) — script exists + ON CONFLICT idempotence;
  DRY_RUN flag.
- **Skip-cleanly smoke** (1) — `smoke-postgres.mjs` short-circuits
  when `DATABASE_URL` is unset.
- **TLS posture** (2) — Pool builds with `rejectUnauthorized: false`
  for non-localhost; `describePostgres` exposes diagnostics.
- **Runtime roundtrip** (1, opt-in) — when `DATABASE_URL` is set,
  exercises `saveBlob → loadBlob` end-to-end against the live DB.
  `{skip: true}` when the env is absent so dev workflow doesn't
  break (per prompt).

Also tweaked: `smoke-postgres.mjs` now exits 0 with a "skipped" log
when `DATABASE_URL` is unset (was `process.exit(2)`). Same intent —
dev workflow never red-screens because Postgres isn't wired.

## NOT in scope

- Per-tenant DB isolation (post-ship — pool model from architecture §1
  remains "one deploy, every tenant").
- Connection pool tuning (defaults work — 10 connections, 30s idle).
- Splitting the JSONB blob into per-key rows (the schema is already
  forward-compatible; today the whole `PortalState` lives in one row).

## Q-ASSUMED

- **Implicit promotion was the right default in R007**: this round
  preserves it + locks it via smoke. Operators who want file-backend
  in a Postgres-configured env explicitly set `PORTAL_BACKEND=file`.
- **Dual-read fallback fire-and-forget**: blocking the cold-start
  hydrate on a Postgres write is the wrong trade. Cache is populated
  from the file blob synchronously; the write is best-effort.
- **Single `[portal] dual-read fallback` warn line per cold start**:
  enough signal for ops; subsequent boots are silent.
- **No retry on file→postgres write**: fire-and-forget. If the write
  fails, the next cold start exercises the fallback again — same
  outcome from the cache's POV. The warn line surfaces the failure
  without blocking.
- **`smoke-postgres.mjs` skip-on-unset over hard-fail**: the script
  is run as part of `npm run smoke:postgres` — devs without Postgres
  shouldn't see a false-red. Real CI gates set `DATABASE_URL`.
- **Source-marker for hydrate logic**: `ensureHydrated` runs once
  per process and is hard to drive deterministically without a real
  Postgres + file. Source-marker covers every documented branch;
  the runtime opt-in test exercises the roundtrip end-to-end.
