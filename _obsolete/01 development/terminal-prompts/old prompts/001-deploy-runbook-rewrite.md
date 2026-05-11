/loop

# T6 — Round 001: Deploy runbook rewrite (post-unification)

`runbooks/deploy.md` is flagged STALE — references the deleted
`portal/` folder + obsolete `_milesy/` copy step. First T6 round
rewrites it cleanly to match current architecture.

Plan ref: chapter #124 §"Cross-sprint reminders" + ship-gate.

## Pre-read

- Current `runbooks/deploy.md` (with its STALE banner).
- Chapter #122 unification (the new tree).
- Chapter #134 postgres-backend, #138 nonces, #142 env-secrets,
  #129 founder-pw — all the WS-E hardening to document.

## Scope

**A** — Full rewrite. Top of file:
- One-liner: "Deploy `04-the-final-portal/milesymedia-website/` to
  Vercel. Single project. No copy steps."
- §1 Pre-deploy checklist (pull, status clean, npm run smoke at
  project root).
- §2 Env vars (full updated table — keep R024+R029 entries for
  FOUNDER_*, add SENTRY_DSN, SENTRY_TRACES_SAMPLE_RATE — the table
  exists, just merge into the new structure).
- §3 First-deploy + promote (`vercel link` → `vercel deploy` →
  `--prod`).
- §4 Per-client portals (Felicia at clients/luv-and-ker/ when T5
  ships).
- §5 Smoke routes (`/`, `/for-*`, `/health-check`, `/business-os`,
  `/incubator`, `/login`, `/signup`, `/portal/agency`,
  `/embed/[slug]/[variant]`, `/api/auth/me`, `/healthz`,
  `/healthz/full`).
- §6 Custom domain runbook (kept from existing — `@aqua/plugin-domains`
  + manual-DNS path).
- §7 Rollback (Vercel UI → "Promote to Production" of last good).
- §8 Crons (commented-out block in vercel.json, ready to flip).
- §9 Troubleshooting.
- §10 Glossary.

**B** — Remove obsolete sections: build-portal.mjs script reference,
`/_milesy/` copy step, `04-the-final-portal/portal/` paths.

**C** — Verify: `grep -n "portal/" runbooks/deploy.md` shows only the
new `milesymedia-website/` references, never the deleted folder.

**D** — Chapter `04-deploy-runbook-rewritten.md` capturing
before/after delta + MASTER row.

## NOT in scope

- Setting up actual Vercel project (operator action).
- Generating production secrets (operator action).
- Cron flip (operator decides quota timing).

## When done
DONE referencing `001-deploy-runbook-rewrite.md`.
