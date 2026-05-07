# Chapter 139 — Env secrets policy (T1 R029, WS-E)

Locks down secrets handling. Fail-closed startup if required env is
missing or matches a known dev sentinel. No more scattered
`process.env.X` reads — typed accessors at the boundary.

## Goal A — `lib/server/env.ts`

NEW typed env reader, no `server-only` shim so the smoke can drive
every branch:

- `requireEnv(name, opts?)` — throws in production when missing.
  Returns `undefined` in dev/test. `opts.alwaysRequired: true`
  throws regardless of `NODE_ENV` (for module-level reads that
  should never silently default).
- `optionalEnv(name, fallback)` — always returns a string. Empty
  string is treated as unset (returns fallback).
- `inspectEnv(env?)` — pure validation. Returns `EnvIssue[]` per
  required key. Used by `runStartupEnvCheck`.
- `runStartupEnvCheck(env?)` — fail-closed boot. Throws in
  production when any error-severity issue exists; warns + returns
  in dev.
- `ENV_ALLOWLIST` — typo guard. The startup check warns when
  `process.env` carries a `PORTAL_*`/`FOUNDER_*`/`NEXT_PUBLIC_PORTAL_*`/
  `SENTRY_*`/`VERCEL_*` key not on the list. Suggests the closest
  match via Levenshtein (catches `PORTAL_SESION_SECRET` typos).

## Goal B — Production-required set

```ts
const PRODUCTION_REQUIRED = [
  "PORTAL_SESSION_SECRET",        // ≥32 chars
  "DATABASE_URL",
  "NEXT_PUBLIC_PORTAL_BASE_URL",
  "NEXT_PUBLIC_PORTAL_SECURITY",  // must equal "strict" in prod
  "FOUNDER_EMAIL",                // must NOT be the dev default
  "FOUNDER_PASSWORD",             // ≥12 chars (R024)
];
```

## Goal C — Startup self-check

`runStartupEnvCheck()` runs three passes:

1. **Required-in-prod**: missing keys → error in prod (warn in dev).
2. **Length checks**: `PORTAL_SESSION_SECRET ≥ 32`, `FOUNDER_PASSWORD
   ≥ 12`. Per-key `MIN_LENGTHS` map; extensible.
3. **Example sentinel detection**: rejects values that match
   `EXAMPLE_SENTINELS[name]` (e.g. `FOUNDER_EMAIL = "edwardhallam07@gmail.com"`,
   `PORTAL_SESSION_SECRET = "" | "dev-secret" | "change-me"`). Same
   semantic as R024's founder-policy check, generalised.

In production, any error throws with a single combined message
(`startup self-check failed in production: PORTAL_SESSION_SECRET:
must be ≥32 chars (got 5); FOUNDER_EMAIL: matches a known dev /
example sentinel — rotate before deploying`). In dev, every issue
warns + the function returns the array so callers can surface them
(operator dashboard at `/api/internal/sweep` could include
`{envIssues}` in a future round).

`NODE_ENV === "test"` silences the warn channel so smokes run quiet.

## Goal D — `.env.example` + runbook

`.env.example` already documented all the required vars after R024
(`FOUNDER_EMAIL`/`PASSWORD`/`AGENCY_NAME` block). The smoke verifies
shape: required keys present, `FOUNDER_PASSWORD=` empty, `PORTAL_SESSION_SECRET=`
empty.

Runbook §2a was extended in R024 (FOUNDER_* rows). The broader
STALE-runbook rewrite (deleted `portal/` references + `_milesy/` copy
step) remains pending; that's a separate doc round, not blocked on
R029.

## Goal E — `lib/server/secrets.ts` typed accessors

NEW typed accessors so callers stop poking `process.env` directly:

```ts
sessionSecret()      → requireEnv("PORTAL_SESSION_SECRET")
databaseUrl()        → requireEnv("DATABASE_URL")
portalBaseUrl()      → requireEnv("NEXT_PUBLIC_PORTAL_BASE_URL")
portalSecurity()     → "strict" | "relaxed" (default "relaxed")
founderEmail()       → requireEnv("FOUNDER_EMAIL")
founderPassword()    → requireEnv("FOUNDER_PASSWORD")
founderAgencyName()  → optionalEnv(..., "Milesy Media")
portalBackend()      → "file" | "memory" | "kv" | "postgres" | undefined
devBypass()          → boolean (NEXT_PUBLIC_DEV_BYPASS === "1")
sentryDsn()          → string | undefined
```

`secrets.ts` carries the `server-only` shim so client bundles can't
accidentally import it; covered in smoke via source-marker.

**Refactor is incremental** — existing direct reads in
`founderSeed.ts` / `storage.ts` / `storagePostgres.ts` continue to
work. New code prefers the accessors. R+1 sweep can migrate
hot-path reads as their callers churn.

## Goal F — Smoke

NEW `scripts/smoke-env-secrets.test.ts` (run via `npm run smoke:env-secrets`,
22/22 pass, ~9.6s).

Seven suites:

- **requireEnv** (4) — throws in prod / undefined in dev / returns
  set value / `alwaysRequired` throws even in dev.
- **optionalEnv** (3) — fallback when unset / actual when set /
  empty-string treated as unset.
- **inspectEnv** (8) — clean prod no issues / missing
  PORTAL_SESSION_SECRET error / length checks (32 + 12) / dev
  sentinel FOUNDER_EMAIL flagged / NEXT_PUBLIC_PORTAL_SECURITY
  must be strict / dev downgrades errors to warns / typo guard
  suggests closest match.
- **runStartupEnvCheck** (3) — throws in prod with missing /
  no-throw in dev / clean prod returns `[]`.
- **ENV_ALLOWLIST** (2) — covers PRODUCTION_REQUIRED + the
  Sentry/Vercel/FOUNDER_AGENCY_NAME tunables.
- **secrets.ts source-markers** (1) — all 10 accessor exports.
- **.env.example shape** (1) — required keys present + empty
  values for secrets.

## NOT in scope

- Secrets-manager integration (AWS Secrets Manager / Vault) — post-ship.
- Rotation automation — post-ship.
- Sweep of every direct `process.env.X` read in the codebase —
  incremental; accessors available for new code.
- Wiring `runStartupEnvCheck` into Next.js boot (R+1 — easiest path is
  a server component imported once at the root layout).

## Q-ASSUMED

- **Throw-in-prod, warn-in-dev**: matches R024's founder-policy
  shape. Devs can boot without setting every var; production
  refuses to start with secrets missing or weak.
- **`NEXT_PUBLIC_PORTAL_SECURITY` must be exactly `"strict"` in
  prod**: matches the runbook's existing value. R+1 may add other
  modes (e.g. `"strict-with-bypass"` for staging).
- **Levenshtein for typo suggestions**: catches single-character
  typos (`PORTAL_SESION_SECRET` → `PORTAL_SESSION_SECRET`).
  Suggested closest is informational only — never auto-corrects.
- **Empty string treated as unset**: matches `requireEnv` semantics.
  An operator who sets `PORTAL_SESSION_SECRET=` (no value) is the
  same as not setting it at all.
- **`runStartupEnvCheck` is opt-in**: not auto-wired into a Next.js
  boot hook this round. The shape is ready; operators call it
  explicitly today (e.g. from a custom server). R+1 wires it into
  the root layout once we standardise the boot path.
- **Smoke source-marker for secrets.ts**: `server-only` shim makes
  runtime testing painful + the accessors are thin (each is a
  single requireEnv/optionalEnv call). Source-marker covers the
  export contract.
- **Refactor is incremental**: 30+ direct `process.env` reads exist
  across the codebase. Migrating each would create a sprawling
  diff. Accessors are available; new code prefers them; old code
  works untouched.
