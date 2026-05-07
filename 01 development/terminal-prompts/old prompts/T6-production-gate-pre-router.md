/loop

# T6 — Production gate: CI + alerts + first-real-deploy readiness

T6 R3 shipped `@aqua/plugin-ops` with fixture data, plus `/healthz` and the
Postgres backup script. This round closes the production-gate checklist so
Ed can pull the trigger on `runbooks/deploy.md` with confidence.

## Working environment

- **Repo**: https://github.com/edsworld27/ker-v3 (branch `main`).
- **Local**: `~/Desktop/ker-v3/`. Folder `04-the-final-portal/`.
- After every commit: `git pull --rebase --autostash && git push`.

## HARD BOUNDARIES — do NOT touch

- `04-the-final-portal/milesymedia website/` — Ed owns this.
- `04-the-final-portal/business-os/` — Ed owns this.

## Mandatory pre-read

1. `01 development/CLAUDE.md`
2. `01 development/context/MASTER.md`
3. `01 development/context/prior research/04-deployment-domains-observability.md`
4. T6 R3 ops chapter (find via MASTER index — the most recent T6 row).
5. `01 development/runbooks/deploy.md`
6. `01 development/messages/terminal-6/from-orchestrator.md`

## Scope

**Goal A — Real metrics providers**
- Plug Vercel Analytics, Sentry, Postgres metrics into the existing
  ops `MonitoringPage`. Default still fixture so dev runs without keys.
- Pluggable provider port pattern (mirror affiliates Stripe pattern).
  `setMetricsProvider(impl)` accepts real or fixture.

**Goal B — Alert routing**
- New `AlertRule` model: `{metric, threshold, comparison, window,
  channels: ["email", "slack", "webhook"]}` stored in `portal_kv`.
- AlertEvaluator (60s schedule via foundation cron port — define the
  port, soft-fail when not injected). On fire: dispatch via T2 R10
  email-sender for email, webhook for slack/custom. Dedup by
  `(ruleId, windowStart)`.
- AlertsPage admin UI (list + create + test-fire). MonitoringPage
  gets an Alerts panel.

**Goal C — CI/CD pipeline**
- `.github/workflows/ci.yml` — matrix per package (portal + each
  plugin): tsc + smoke. Plus repo-level smoke:ux + smoke:perf.
  Required check on PRs to `main`. Vercel preview deploys on PR.
- `.github/workflows/deploy.yml` — manual-trigger production deploy
  (Ed pulls the trigger; no auto-deploy on main per R3 design).

**Goal D — Smoke + chapter**
- ops smoke: provider-stub round-trips, alert evaluator (rule fires,
  dedup, channel dispatch). ≥8 new cases.
- Chapter `04-production-gate.md`. MASTER row. Update `runbooks/deploy.md`
  with a "Pre-flight: CI green + alerts wired" section.

## NOT in scope

- PagerDuty / Datadog (later round).
- KMS / vault for secrets (T1's territory).
- Touching milesymedia / business-os (HARD BOUNDARY).
- New plugins.

## Loop discipline

Standard. Goal C (CI) is independent of A+B — could ship first.

## When done

DONE + COMMIT; chapter; MASTER row; tasks row.
