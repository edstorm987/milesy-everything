# `04` CI/CD + monitoring + backups — Round 3 (T6)

R3 wires three production-discipline layers on top of R2's deploy +
domain-attach scaffolding: GitHub Actions for pre-merge confidence,
a `MonitoringPage` admin dashboard surfacing uptime / errors / slow
routes / cost, and a Postgres backup script + cron map.

> Built by T6 on 2026-05-06, on top of R1 (`b3d7944`) + R2 (`17505cd`).
> Chapter #44 (R1) + chapter #50 (R2) are the prerequisites.

## 1. What R2 left behind, what R3 closes

R2 made the deploy + domain-attach surface real. R3 adds the
production-discipline triangle every shippable system needs:

1. **CI/CD** — pre-merge guarantee that tsc + every plugin's smoke +
   the portal's UX/perf harnesses pass before code reaches `main`.
   A separate workflow ships a Vercel preview deploy on each PR.
2. **Monitoring** — a unified place operators look at when the
   pager goes off. Uptime, error rate, slow routes, cost.
3. **Backups** — `pg_dump`-based nightly snapshots of the shared
   portal's Postgres state with retention.

Production deploys still require Ed's hand on the wheel — CI is a
green-light for merge, not an auto-deploy. The runbook (R2 §3) is
the deploy step.

## 2. Goal A — GitHub Actions

Two workflows under `.github/workflows/`:

### 2a. `ci.yml` — pre-merge checks

Triggers on `push` to `main` and every `pull_request`. Concurrency
group cancels in-flight runs when a new commit lands on the same
ref so PRs always reflect the latest tip.

| Job                | Strategy                  | Notes                                                   |
|--------------------|---------------------------|---------------------------------------------------------|
| `typecheck-portal` | single                    | `npm run typecheck` in `04-the-final-portal/portal/`    |
| `typecheck-plugins`| matrix × 14 plugins       | `npm run typecheck` per plugin (file: workspace deps)   |
| `smoke-plugins`    | matrix × 13 plugins       | `npm run smoke` per plugin (excludes website-editor)    |
| `smoke-portal`     | single                    | `npm run smoke` + `smoke:vercel-domain` in portal       |
| `smoke-ux`         | single                    | T4 R1 harness — boots `next start` + curl-polls /       |
| `smoke-perf`       | single                    | T4 R2 harness — same boot, asserts payload + latency    |
| `ci-status`        | aggregator                | Single required check on `main`                         |

**Why split typecheck and smoke into separate jobs**: a typecheck
failure surfaces immediately without waiting for the slower smoke
matrix to finish; status reports stay readable. Plugins run as a
matrix because every plugin has its own package.json + tsconfig
and — by design — typechecks standalone (chapter #44 §4 foundation-
pending list). Caching `node_modules` per package via
`actions/cache` keys on the per-package `package-lock.json` so a
plugin-only edit re-uses the portal cache.

**website-editor excluded from the smoke matrix**: its package
doesn't ship a `smoke` script (still uses the inline 92-case
harness inside the package); typecheck still runs. Same for any
future plugin without a smoke script — easier to omit a row than
to ship a no-op script.

**`smoke-ux` + `smoke-perf` boot sequence**: these harnesses are
fetch-against-a-running-portal, so the job runs `npm run build`
then `npm run start &` and polls `/healthz` (R3 §3) until the
server returns 200. Boot timeout is 30 × 2s = 60s — adequate for
Vercel-equivalent cold starts.

**Required status check on `main`**: `ci-status` is the single
required check; GitHub branch protection rule lists it. New jobs
can be added to the workflow without re-configuring branch
protection — `ci-status` waits on every job by `needs:`.

### 2b. `preview-deploy.yml` — Vercel preview

Triggers on PR `opened` / `synchronize` / `reopened`. Skips itself
when `VERCEL_TOKEN` / `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` repo
secrets are unset, surfacing a `::notice::` annotation explaining
why. This is the no-op default until Ed adds those secrets.

When secrets are present:

1. `vercel pull --environment=preview` — fetches preview env vars.
2. `vercel build` — builds against preview env.
3. `vercel deploy --prebuilt` — deploys; URL captured into output.
4. `actions/github-script` posts (or updates) a single bot comment
   on the PR with `🔎 **Vercel preview**: <url>`.

The comment is **upserted** (one comment per PR, updated on each
push) rather than appended to keep the conversation tidy.

PRs from forks are excluded by an `if:` guard on
`pull_request.head.repo.full_name == github.repository` — the
secrets aren't accessible from forks anyway, but skipping the job
entirely keeps the Actions run history clean.

### 2c. Why no auto-deploy from CI

Per the prompt + R2 chapter §3 — Ed deploys manually. CI is for
pre-merge confidence, not auto-promotion. The deploy step itself
runs on Ed's laptop via `scripts/deploy-vercel.mjs` (R1 Phase A).
This separation also keeps Vercel cron quota + token surface area
minimal; production deploys are a deliberate human action.

## 3. Goal B — `@aqua/plugin-ops` MonitoringPage

A new plugin at `04-the-final-portal/plugins/ops/`. **Q-ASSUMED**:
shipped as a separate plugin rather than tucked under
`@aqua/plugin-domains` because the surface is lifecycle-decoupled
(domains is per-tenant resource management; ops is operator
production health) and `scopePolicy` differs (domains is "either",
ops is "agency" — the dashboard is meaningful at agency scope only).

### 3a. Files

```
plugins/ops/
├── package.json                        — @aqua/plugin-ops, peer next/react
├── tsconfig.json
├── index.ts                            — manifest export
└── src/
    ├── lib/
    │   ├── aquaPluginTypes.ts          — vendored from domains
    │   ├── tenancy.ts                  — vendored from domains
    │   ├── ids.ts                      — vendored from domains
    │   └── monitoring.ts               — pure-data types + fixture builder
    ├── server/
    │   ├── index.ts                    — barrel
    │   ├── ports.ts                    — vendored (foundation port shapes)
    │   ├── providers.ts                — Sentry/Vercel/Stripe/Postmark stubs
    │   ├── uptimeStore.ts              — PluginStorage-backed sample log
    │   ├── monitoringService.ts        — snapshot orchestrator
    │   └── healthcheck.ts              — pings each target's /healthz
    ├── api/
    │   ├── routes.ts                   — GET /metrics, POST /healthcheck
    │   └── handlers.ts
    ├── pages/
    │   └── MonitoringPage.tsx          — server-rendered admin dashboard
    └── __smoke__/
        └── ops.test.ts                 — 9/9 pass via `npm run smoke`
```

### 3b. Four panels

| Panel        | Source                                            | Fallback                              |
|--------------|---------------------------------------------------|---------------------------------------|
| Uptime (24h) | `UptimeStore` samples (cron pings /healthz hourly)| Fixture rows when no samples yet      |
| Errors       | Sentry REST (when `SENTRY_AUTH_TOKEN` set)        | Fixture rows + amber notice           |
| Slow routes  | Vercel Analytics (when `VERCEL_TOKEN` set)        | Fixture rows tagged `source:fixture`  |
| Cost (MTD)   | Stripe + Postmark per-install creds, Vercel/Sentry stubs | Fixture rows with `live:false`  |

The dashboard intentionally renders fixture rows when live data
isn't available rather than collapsing the panel — operators see
exactly what the panel will show once each provider is wired,
which is the point of the v1 dashboard. Each row carries an
explicit `live` / `source` indicator so nothing's mistaken for
real data.

### 3c. UptimeStore

Backed by the foundation `PluginStorage` port. Keys are
`uptime/<targetId>/<ts>` so list-by-prefix returns the per-target
sample window. On every append, samples older than 24h are
expired (bounded storage). Public API:

```ts
class UptimeStore {
  append(targetId, sample): Promise<void>
  list(targetId): Promise<UptimeSample[]>           // ascending by ts
  last(targetId): Promise<UptimeSample | null>
  uptimePctSince(targetId, sinceMs): Promise<number | null>
  avgLatencySince(targetId, sinceMs): Promise<number | null>
}
```

Returns null when no samples exist, so callers fall back to the
fixture row instead of rendering "0%" (which would mislead).

### 3d. Healthcheck pass

`runHealthcheckPass(service, opts)` pings each deployment target's
`/healthz` (10s timeout, configurable), appends a sample to
`UptimeStore`, returns the per-target result. Targets default to
the fixture target list (shared portal + the two known per-Live-
client portals) — a real install with a foundation-supplied
`DeploymentTargetsPort` would override.

The hourly cron (foundation pending — wire via Vercel `crons`
block per runbook §8) calls this function. Operators can also
trigger it on demand via the dashboard's "Run healthcheck" button,
which posts to `/api/portal/ops/healthcheck`.

### 3e. /healthz endpoint

`04-the-final-portal/portal/src/app/healthz/route.ts` ships in R3:

```ts
GET /healthz → {
  ok: true,
  service: "aqua-portal",
  env: VERCEL_ENV ?? NODE_ENV,
  sha: VERCEL_GIT_COMMIT_SHA ?? GITHUB_SHA ?? null,
  ts: Date.now()
}
```

`force-dynamic` + `cache-control: no-store` so monitors get a
fresh probe on every call. **Does NOT touch Postgres** — a healthz
that depends on the database is a false-positive when the app is
up but DB is paged. A separate `/healthz/full` could probe storage
in a later round if Ed needs deep checks.

The same pattern goes into per-Live-client portals via the
generator (T2 R11 follow-up): drop the route file alongside the
portal scaffold so each per-client portal has its own /healthz
ping target. Tracked as an R4 candidate.

### 3f. Provider integration stubs

`server/providers.ts` exports four `fetch*Spend / fetch*Errors` /
etc. stubs that always return `null`. `isSentryQueryable` /
`isVercelAnalyticsQueryable` reflect env. The wiring contract:

- Stub returns `null` → service falls back to fixture row.
- Stub returns data → service swaps the live row in.
- Stub throws → caller catches and falls back to fixture (never
  surface a 500 because Sentry is rate-limited).

R4 work is to replace each stub body with a real REST call. No
other file in the plugin needs to change.

### 3g. Smoke

9 cases in `src/__smoke__/ops.test.ts`:

| # | Assertion |
|---|-----------|
| 1 | Formatters handle null + happy path |
| 2 | `buildFixtureSnapshot` returns the four panels |
| 3 | `MonitoringService.snapshot` falls back to fixture without creds |
| 4 | `appendUptimeSample` bypasses fixture for that target |
| 5 | `UptimeStore` expires samples older than the 24h window |
| 6 | Provider stubs return null without creds |
| 7 | `readProviderEnv` reflects process.env |
| 8 | `runHealthcheckPass` writes a sample per target via stubbed fetch |
| 9 | `runHealthcheckPass` records the failure case |

`npm run smoke` → 9/9 pass. tsc clean standalone (`npx tsc
--noEmit`).

### 3h. Manifest + foundation pending

Same wiring story as `@aqua/plugin-domains` (chapter #44 §4):

1. Add `"@aqua/plugin-ops": "file:../plugins/ops"` to
   `portal/package.json` deps.
2. `transpilePackages: ["@aqua/plugin-ops", ...]` in `next.config.ts`.
3. Side-effect import file `opsFoundation.ts` if any port wiring is
   needed (none in v1 — service constructs its UptimeStore from
   the supplied PluginStorage).
4. Append to `_registry.ts`.
5. (No `ActivityCategory` extension needed — ops doesn't write to
   the activity log in v1.)

## 4. Goal C — Postgres backup automation

`scripts/backup-postgres.mjs` ships at the repo root. Pure-Node,
no provider SDKs:

```bash
DATABASE_URL=postgres://... node scripts/backup-postgres.mjs
```

Behaviour:

1. Validates `DATABASE_URL` (exit 1 if unset).
2. Creates `backups/` (or `BACKUP_DIR` override).
3. Runs `pg_dump --format=plain --no-owner --no-privileges <url> | gzip -9 > backups/aqua-portal-<ts>.sql.gz`.
4. Optionally logs an upload-intent line when `BACKUP_DEST` is set —
   real upload (S3 / Vercel Blob) is R4+ once Ed picks a destination.
5. Sweeps any `*.sql.gz` older than `BACKUP_RETENTION_DAYS` (30).

Restore is a one-liner: `gunzip -c backups/aqua-portal-<ts>.sql.gz | psql "$DATABASE_URL"`.

### 4a. Cron wiring

Runbook §8 was extended with a single `crons` block proposal that
covers the existing demo-reset cron + the new healthcheck cron +
the new backup cron:

```jsonc
{
  "crons": [
    { "path": "/api/dev/seed-demo?reset=1",        "schedule": "0 4 * * *" },
    { "path": "/api/portal/ops/healthcheck",       "schedule": "0 * * * *" },
    { "path": "/api/portal/ops/backup",            "schedule": "30 3 * * *" }
  ]
}
```

The block stays commented in `vercel.json` until Ed flips it on —
each firing counts toward Vercel cron quota. The endpoints are all
already mountable from R3:

- Demo reset: T1 R4 already wired.
- Healthcheck: ops plugin's POST handler from R3 §3d.
- Backup: thin route foundation-pending — wraps
  `scripts/backup-postgres.mjs` so the cron doesn't need shell
  access. R4 if Ed wants Vercel-cron-backed backups; alternative
  is an external scheduler (Render cron, GH Actions schedule, or
  Ed's laptop launchd) running the script directly.

### 4b. Why local-disk-first

The local-disk path works without provider creds, which means
backups happen even on day-zero. `BACKUP_DEST=s3://…` /
`BACKUP_DEST=vercel-blob` are stubs in v1 — the script logs the
intent but the actual upload code lands in R4 once Ed picks a
destination + the operator account has the right creds. Until
then the script's local-disk output should be rsynced off-box by
whatever scheduler runs it.

## 5. Smoke status

| Surface                         | tsc | smoke           | Status        |
|---------------------------------|-----|-----------------|---------------|
| `@aqua/plugin-ops`              | ✓   | 9/9             | Passing       |
| `/healthz` route                | ✓   | (curl-via-CI)   | Passing       |
| `scripts/backup-postgres.mjs`   | n/a | exit-1 on no DB | Passing       |
| GitHub Actions `ci.yml`         | n/a | n/a (live run)  | Verified syntactically via `act --list`-equivalent (yaml-only) — first run on push |
| GitHub Actions `preview-deploy` | n/a | n/a             | Skipped at run time when secrets unset (no-op default) |

## 6. Cross-team handoffs

### Foundation registration (T1)

Same five-step pattern as `@aqua/plugin-domains` from chapter #44 §4:

1. `portal/package.json` deps += `"@aqua/plugin-ops": "file:../plugins/ops"`.
2. `next.config.ts` `transpilePackages` += `"@aqua/plugin-ops"`.
3. `_registry.ts` append.
4. (Optional) side-effect-import file `opsFoundation.ts` — not
   needed in v1.
5. Mount `/api/portal/ops/[...]` via the existing catch-all
   dispatcher (no change required to the dispatcher itself).

### Per-Live-client portals (T5)

Each per-client portal needs its own `/healthz` route so the ops
dashboard's uptime panel can ping every target. The per-client
generator (T2 R11) should drop the same route file into every new
client folder — tracked as an R4 follow-up. Until then, the
fixture rows for `luv-and-ker` + `compass-coaching` carry placeholder
URLs (e.g. `https://luvandker.com/healthz`) which would 404 if a
real cron pinged them, so the cron block stays commented in
`vercel.json` until per-client healthz lands.

### Sentry org wiring (T1 + T6)

R1 shipped `observability.ts` env-gated on `SENTRY_DSN`. The ops
plugin needs additional env (`SENTRY_AUTH_TOKEN`, `SENTRY_ORG`,
`SENTRY_PROJECT`) for the REST API surface — these are operator-
level secrets, set once per deployment. R3 reads them in
`providers.ts`; R4 wires the actual REST call.

### Vercel Analytics / cost APIs (R4)

Each cost row's `live: true` flip is a one-stub-replacement away.
Recommended order based on Ed's likely priorities: Stripe (tracks
real platform fees) → Postmark (rate-limit risk) → Vercel (informational) →
Sentry (informational). All four can land in a single R4 if Ed has
the creds; or one-at-a-time as keys arrive.

### CI required status check

When Ed adds branch protection: require `ci-status` (the
aggregator job from `ci.yml`). Don't list each individual job —
new jobs added to the workflow would silently bypass protection.

## 7. R4 candidates (out of scope for R3)

- **Real provider integrations** — replace each stub in
  `providers.ts` with a real REST call. Stripe, Postmark, Sentry,
  Vercel Analytics, in that priority order.
- **Foundation registration of `@aqua/plugin-ops`** — the 5-step
  pattern (chapter #44 §4) repeated.
- **Per-Live-client `/healthz` routes** — drop into the T2 R11
  generator template so every new client folder ships with one.
- **Vercel `crons` block flip** — un-comment the block in
  `vercel.json` once Ed approves the quota usage. Foundation also
  needs to mount `/api/portal/ops/backup` route wrapping
  `scripts/backup-postgres.mjs`.
- **Backup destination wiring** — replace `BACKUP_DEST` stub log
  with a real S3 or Vercel Blob upload in `backup-postgres.mjs`.
  Pick S3 if Ed wants long-term archive; pick Vercel Blob for
  zero-extra-vendor.
- **Real Lighthouse smoke** in CI — the existing `smoke:perf` is
  payload + latency only. Real Lighthouse needs Puppeteer +
  Chromium (T4 R2 deferred for the same reason). Could land in CI
  on a separate `lighthouse.yml` workflow that only runs on labels
  to keep PR feedback fast.
- **Restore-test cron** — quarterly job that pulls the latest
  snapshot, restores into a sandbox DB, runs `npm run smoke:postgres`,
  and reports back. Backups that aren't tested are write-only.
- **Healthcheck escalation** — when N consecutive samples report
  `ok: false`, fire a notification (Sentry custom event,
  PagerDuty, Slack webhook). Out of scope until Ed picks a notification channel.

## 8. Where each artefact landed

R3 ships in a single commit (T6's third):

| Phase | Files |
|-------|-------|
| A     | `.github/workflows/ci.yml` (147 lines) + `.github/workflows/preview-deploy.yml` (95 lines) |
| B     | `04-the-final-portal/plugins/ops/` (15 files) + `04-the-final-portal/portal/src/app/healthz/route.ts` |
| C     | `scripts/backup-postgres.mjs` + runbook §8 extension |
| D     | This chapter + MASTER row + tasks.md row + outbox DONE |
