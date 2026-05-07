/loop

# T6 — Round 003: Vercel config + crons + healthcheck wiring

Lock in `vercel.json` at the right level for the unified single-host
deploy. Wire crons (commented-out, ready to flip when Ed approves
quota). Confirm healthcheck endpoints work under Vercel's runtime.

## Pre-read

- T1 R030 observability (`/healthz` + `/healthz/full` already exist).
- T6 R001 rewritten deploy runbook (env table + crons section).
- Vercel docs: `vercel.json` schema, crons block, runtime config.

## Scope

**A** — `04-the-final-portal/milesymedia-website/vercel.json`:
- `framework: "nextjs"`
- `regions`: pick a sensible default (e.g. `["lhr1"]` London if Ed's
  audience UK-leaning; flag as configurable).
- `buildCommand` / `outputDirectory` left default (Next.js
  auto-detected).
- Functions config: any long-running route gets a higher
  `maxDuration` if needed (probably none for v1).

**B** — Crons (commented-out block per chapter #124 cross-sprint
reminders + existing runbook §8):
- Demo reset 04:00 UTC daily (`/api/dev/seed-demo?reset=1`).
- Healthcheck hourly (`/api/portal/ops/healthcheck`).
- Postgres backup 03:30 UTC daily (`/api/portal/ops/backup`).

**C** — Healthcheck verification: T1 R030 already shipped
`/healthz` + `/healthz/full`. Add a smoke that runs against the
preview deploy URL (manual operator step + scripted via
`scripts/post-deploy-smoke.mjs`).

**D** — Root `.vercelignore` confirms `02 felicias aqua portal work/`,
`03 old portal/`, `01 development/` excluded from build context.

**E** — Chapter `04-vercel-config-and-crons.md` + MASTER row.

## NOT in scope

- Multi-region deploy (post-ship).
- Edge config (post-ship — middleware on nodejs runtime per
  chapter #91).
- Flipping crons live (operator decision after first prod deploy).

## When done
DONE referencing `003-vercel-config.md`.
