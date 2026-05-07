# Chapter 129 — Founder password rotation (T1 R024, WS-A)

Chapter #122 unify-3 introduced a founder seed that hardcoded a 3-char
dev password and bypassed `validatePassword` via a direct `mutate`.
Chapter #124 ship gate flagged this as a critical fix before any
public flip. R024 ships it.

## Goal A — Env-driven credentials

`founderSeed.ts` now reads three env vars:

| var | default | required? |
|-----|---------|-----------|
| `FOUNDER_EMAIL` | `edwardhallam07@gmail.com` (dev) | YES in production |
| `FOUNDER_PASSWORD` | none | YES — no default ever |
| `FOUNDER_AGENCY_NAME` | `Milesy Media` | optional |

The exported constants `DEFAULT_FOUNDER_EMAIL` /
`DEFAULT_FOUNDER_AGENCY_NAME` document the dev defaults. `FOUNDER_EMAIL`
is exported as a resolved string (env-or-default) so existing callers
(`/dev/pov` reads it) keep working.

## Goal B — Drop the bypass

The direct-mutate path that injected a user with a 3-char password
hash is gone. Seeding now goes through `createUser` — same call
signup uses — which runs `validatePassword` (≥8 chars), hashes via
the standard scrypt path, and emits `user.signed_up`.

If `FOUNDER_PASSWORD` is missing:

- Dev / test → `console.warn` + skip. Operators sign in with their
  own signed-up agency instead.
- Production → throws `[founderSeed] FOUNDER_PASSWORD not set —
  skipping founder seed.` Fail-closed startup error.

## Goal C — `.env.example`

Three new entries between `PORTAL_SESSION_SECRET` and the Storage
section. `FOUNDER_PASSWORD=` deliberately empty (no default value
ever — operator must paste).

## Goal D — Production guard

NEW pure helper `checkFounderPolicy({email, password, nodeEnv})`
returns `{ ok, reason? }`. Branches:

1. `!password` → `not ok` ("FOUNDER_PASSWORD not set — skipping
   founder seed.")
2. `nodeEnv === "production"` AND `password.length < 12` → `not ok`
   ("FOUNDER_PASSWORD must be ≥12 chars in production.")
3. `nodeEnv === "production"` AND `email === DEFAULT_FOUNDER_EMAIL` →
   `not ok` ("FOUNDER_EMAIL is the dev default — set a real address
   before deploying.")
4. Otherwise → `ok`.

In production, `not ok` throws (fail-closed). In dev, `not ok` warns
+ skips. Helper is pure + exported so the smoke can drive every branch
without `process.env` mutation.

## Goal E — Deploy runbook §2a

`runbooks/deploy.md` env table extended with three rows:
`FOUNDER_EMAIL` / `FOUNDER_PASSWORD` / `FOUNDER_AGENCY_NAME`. Each
carries a "Rotate before public flip" note tied back to chapter #124
ship gate. Targeted update only — the broader STALE-runbook rewrite
(deleted `portal/` references, `_milesy/` copy step) is still on the
WS-E queue.

## Goal F — Smoke

NEW `scripts/smoke-founder-seed.test.ts` (run via
`npm run smoke:founder-seed`, 12/12 pass, ~2s).

Five suites, all source-marker since `founderSeed.ts` carries
`server-only` (same constraint as R022/R023 smokes):

- **Policy contract** (6 tests) — every `checkFounderPolicy` branch:
  missing password, prod+short, prod+default-email, dev+ok path
  (uses `createUser({password})` not direct hash); prod+missing
  fail-closed throw; dev+missing warn+skip.
- **Env wire-up** (3 tests) — three `process.env.FOUNDER_*` reads;
  `FOUNDER_EMAIL` has dev default; `FOUNDER_PASSWORD` has no default;
  no remaining 3-char dev literal; `checkFounderPolicy` exported.
- **`.env.example`** (1 test) — new vars present, `FOUNDER_PASSWORD=`
  empty, "Rotate before public flip" note.
- **Deploy runbook** (1 test) — §2a lists FOUNDER_EMAIL/PASSWORD with
  rotate note.
- **Repo verify** (1 test) — no remaining 3-char dev password literal
  in the seed file. The prompt's `grep -r '"123"' src/` returns clean
  (verified at commit time).

## NOT in scope

- Multi-founder support (R+1).
- Password reset UI for the founder (R+1).
- Broader runbook STALE rewrite (WS-E queue — references to deleted
  `portal/` folder + `_milesy/` copy step still need a separate sweep).

## Q-ASSUMED

- **No FOUNDER_PASSWORD default**: missing must be loud, not silent.
  Dev warns; production throws. Either way, no unauthenticated
  founder ever lands in storage.
- **≥12 chars in production over `validatePassword`'s ≥8**: ship-gate
  guidance. `validatePassword` runs anyway via `createUser` so dev
  still rejects <8-char passwords, just by a different error path.
- **Dev default email kept**: chapter #122 documented this as the
  "Ed's local sign-in". Production guard refuses it. Operators
  intending to deploy must override.
- **Runbook targeted update**: full STALE rewrite is WS-E scope.
  This round only adds the FOUNDER_* rows + a rotate note — the
  smallest delta that meets ship-gate `founder password ≠ "123"`.
- **`/dev/pov` still imports `FOUNDER_EMAIL`**: kept as a resolved
  string export so the existing caller doesn't break. POV bypass
  exists only when `NODE_ENV !== production`, and the seed is
  idempotent on `getUser(FOUNDER_EMAIL)` lookup.
- **Smoke source-marker over runtime**: `server-only` constraint;
  same pattern as R022/R023. The pure `checkFounderPolicy` helper
  is exported and could be runtime-tested if a future smoke isolates
  it; today's source markers cover every documented branch.
