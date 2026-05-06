/loop

# T6 — Round 4: Real monitoring providers + alert routing

R3 shipped `@aqua/plugin-ops` with MonitoringPage (uptime + error-rate +
slow-routes + cost) on fixture data, plus `/healthz` + `backup-postgres.mjs`.
R4 makes the dashboard real: pluggable provider integrations and alerting.

## Working environment

- **Repo**: https://github.com/edsworld27/ker-v3 (branch `main`).
- **Local**: `~/Desktop/ker-v3/`. Folder `04-the-final-portal/`.
- After every commit: `git pull --rebase --autostash && git push`.

## Mandatory pre-read

1. `01 development/CLAUDE.md`
2. `01 development/context/MASTER.md`
3. `01 development/context/prior research/04-deployment-domains-observability.md`
4. The R3 ops chapter (find via MASTER index).
5. `01 development/messages/terminal-6/from-orchestrator.md`

## Scope

**Goal A — Real provider integrations**
- Vercel Analytics → real cost + traffic (per-deploy bandwidth, function
  invocations). Use existing Vercel API token from R2's domain client.
- Sentry → real error rate + recent issues (24h count, top 5 issues).
- Postgres → real query latency p50/p95 + active connections.
- Pluggable provider port pattern (mirror affiliates Stripe pattern from
  T2 R12) — `setMetricsProvider(impl)` accepts a real or fixture impl.
  Default still fixture so dev runs without keys.

**Goal B — Alert routing**
- New `AlertRule` model: `{metric, threshold, comparison, window,
  channels: ["email", "slack", "webhook"]}`. Stored in `portal_kv`.
- AlertEvaluator runs on a 60s schedule (foundation cron port — define
  the port, soft-fail when not injected, document for T1 to wire).
  When a rule fires, dispatch via T2 R10's email-sender for email,
  via webhook for Slack/custom, dedup by `(ruleId, windowStart)`.
- Admin UI: AlertsPage (list + create + test-fire). MonitoringPage
  gets an "Alerts" panel.

**Goal C — CI/CD pipeline**
- `.github/workflows/ci.yml` — matrix: tsc + smoke per package
  (portal + each plugin) + smoke:ux + smoke:perf. Required check on
  PRs to main. Vercel preview deploys on PR.
- `.github/workflows/deploy.yml` — manual-trigger production deploy
  (Ed pulls the trigger, no auto-deploy on main per R3 design).

**Goal D — Smoke + chapter**
- ops smoke extended: provider-stub round-trips + alert evaluator unit
  tests (rule fires, dedup, channel dispatch). ≥8 new cases.
- Chapter `04-monitoring-round4.md`. MASTER row.

## NOT in scope

- PagerDuty / Datadog (R5 candidate).
- Custom dashboards beyond MonitoringPage tabs.
- Backup verification beyond the existing script.

## Loop discipline

Standard. Goal C (CI/CD) is independent of A+B — could ship first.

## When done

DONE + COMMIT in outbox; chapter; MASTER row; tasks row.
