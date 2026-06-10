/loop

# T6 — Round 3: CI/CD pipeline + monitoring dashboard

R2 shipped real deploy runbook + Vercel domain-attach + `@aqua/plugin-domains`
(`17505cd`). R3 wires **CI/CD** (GitHub Actions running smoke tests
+ tsc + per-plugin builds pre-merge) and a **monitoring dashboard**
that surfaces production health (uptime, error rate, slow routes,
Sentry counts).

## Working environment

- Repo / local / branch — same.

## Messaging

- **Outbox**: `01 development/messages/terminal-6/to-orchestrator.md`
- **Inbox**: `01 development/messages/terminal-6/from-orchestrator.md`

## Mandatory pre-read

1. Your R1+R2 chapters
2. `04-deployment-domains-observability.md` (your R1 chapter — observability layer)
3. T4 R1 chapter `04-ux-accessibility-pass.md` — `npm run smoke:ux`
4. T2 chapters — every plugin has its own `npm run smoke` (~80 cases catalogue-wide)

## Scope — three goals

### Goal A: GitHub Actions CI

`.github/workflows/ci.yml`:
- On push + PR: tsc --noEmit across portal + every plugin package
  (matrix per package).
- Run `npm run smoke` per plugin (matrix).
- Run `npm run smoke:ux` (T4 R1's harness).
- Run `npm run smoke:perf` (T4 R2's harness when shipped).
- Cache `node_modules` per package via `actions/cache`.
- Status-check required on `main` for merge.

`.github/workflows/preview-deploy.yml`:
- On PR open/update: deploy a preview to Vercel via Vercel GitHub
  integration; comment the preview URL on the PR.

### Goal B: Monitoring dashboard

A new admin page `MonitoringPage` (under your `@aqua/plugin-domains`
plugin or a new `@aqua/plugin-ops` — your call, log Q-ASSUMED) that
surfaces:
- Uptime per deployment (poll a `/healthz` endpoint hourly).
- Error rate (read from Sentry's API if DSN configured).
- Slow-route table (read from Vercel Analytics if available; fallback
  to a local middleware that logs request durations).
- Cost snapshot (Stripe / Postmark monthly spend if APIs available).

For v1 ship the page + fixture data; real provider integrations
flagged as R4 follow-ups when each provider's creds land.

### Goal C: Backup automation

A nightly Vercel cron (or `scripts/backup-postgres.mjs` triggered
externally) that:
- Dumps the shared portal's Postgres state to a timestamped snapshot.
- Stores in a `backups/` bucket (S3 or Vercel Blob).
- Retains 30 days.

For v1 ship the script + runbook; cron wiring documented in R2's
runbook gets an extension here.

## NOT in scope

- Don't add full APM tooling beyond Sentry — Datadog / New Relic
  are R4+.
- Don't build a real-time log viewer — `vercel logs` CLI works.
- Don't deploy production from the CI — Ed deploys manually.

## Loop discipline

Standard. `<<autonomous-loop-dynamic>>`.

## When done

1. CI workflow runs locally (`act` or just commit + push and verify
   GitHub Actions tab).
2. MonitoringPage renders with fixture data; provider integrations
   stub-clean.
3. Backup script runs against dev Postgres; runbook updated.
4. tsc clean.
5. Chapter `04-cicd-and-monitoring.md`.
6. MASTER row.
7. tasks.md row done.
8. DONE + COMMIT.
