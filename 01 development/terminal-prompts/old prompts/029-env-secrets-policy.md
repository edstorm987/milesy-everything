/loop

# T1 — Round 029: Env secrets policy (WS-E R029)

Lock down secrets handling. Fail-closed startup if required env is
missing. No secrets in code.

Plan: chapter #124 WS-E R029. Ship-gate item.

## Pre-read

- R024 founder-password-rotation (introduced env-only seed pattern).
- `runbooks/deploy.md` §2a env table.
- Existing `.env.example` (if missing, this round creates it).

## Scope

**A** — `lib/server/env.ts`: typed env reader. `requireEnv(name)`
throws at startup if missing in production. `optionalEnv(name, default)`
returns default in dev. Allowlist of permitted env keys (typo guard).

**B** — Required in production: `PORTAL_SESSION_SECRET`, `DATABASE_URL`,
`NEXT_PUBLIC_PORTAL_BASE_URL`, `NEXT_PUBLIC_PORTAL_SECURITY=strict`,
`FOUNDER_EMAIL`, `FOUNDER_PASSWORD` (≥12 chars, R024 already enforces).

**C** — Startup self-check: a fail-closed boot that verifies env shape
+ minimum lengths + that secrets aren't the example values.

**D** — `.env.example` — comprehensive template with comments. NEVER
contains real secrets. Update deploy runbook (still flagged STALE) §2a
table to match.

**E** — `lib/server/secrets.ts` — typed accessors for known secrets so
no plain `process.env.X` scattered across the codebase. Refactor
existing direct reads to use the accessors (can be incremental — flag
in chapter what's done vs deferred).

**F** — Smoke `§ Env secrets`: requireEnv throws on missing in prod;
optionalEnv returns default in dev; example-value detection rejects;
length check enforced.

**G** — Chapter `04-env-secrets-policy.md` + MASTER row.

## NOT in scope
- Secrets manager (AWS Secrets Manager / Vault) integration — post-ship.
- Rotation automation — post-ship.

## When done
DONE referencing `029-env-secrets-policy.md`.
