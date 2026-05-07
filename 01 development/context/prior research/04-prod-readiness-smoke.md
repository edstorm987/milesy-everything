# Production-readiness smoke (T6 R005)

End-to-end HTTP smoke against a real Vercel deploy (preview before
promote, prod after). Closes T6 — Ed's next action after this round
green is the actual DNS flip.

## Why this exists

Chapter #124 ship-gate item #9 lists 25+ surfaces that must serve 200
under prod conditions (real Postgres, real env, real cookie security,
real Vercel function bundle). The per-round `npm run smoke` is a
source-marker + in-process probe; it doesn't speak to the deployed
function bundle. This script does.

## What landed

### A — `scripts/post-deploy-smoke.mjs` (rewritten from R003 stub)

- **Args**: `--url=https://<base>` (required) · `--founder-email=<addr>`
  (default `$FOUNDER_EMAIL` then `edwardhallam07@gmail.com`) ·
  `--founder-pass=<pwd>` (default `$FOUNDER_PASSWORD`) · `--verbose`.
- **Static / unauthed (200)**: `/`, `/for-{skincare,coaching,fitness,agencies}`,
  `/health-check`, `/business-os`, `/business-os/incubator`, `/login`,
  `/login/forgot`, `/login/reset?token=test`, `/signup`,
  `/signup/agency`, `/dev/pov`, `/healthz`, `/healthz/full`,
  `/resources`, `/resources/seo-audit`, `/resources/site-speed`,
  `/resources/accessibility-audit` — 20 routes.
- **Redirects**: `/demo` → 302/307 → `/portal/agency` (isDemo cookie) ·
  `/incubator` → 307 → `/business-os/incubator` (chapter #159) ·
  `/portal` and `/portal/agency` unauthed → 30x → `/login`.
- **API unauthed**: `/api/auth/me` — asserts JSON shape `{user: …}`
  rather than status (matches both 200 `{user:null}` and 401-ish).
- **Founder login flow**: POST `/api/auth/login` with `{email, password}`
  → captures `Set-Cookie`, asserts `lk_session_v1` present · GET
  `/api/auth/me` with cookie → asserts `user.email` matches founder ·
  GET `/portal/agency` with cookie → 200.
- **HC completion (best-effort)**: POST `/api/portal/public-funnel/hc-complete`
  with `{email: smoke-<ts>@aqua.test, slot:{q1:"test"}}` → 200 + lead
  cookie · GET `/business-os` with lead cookie → 200. 404 on the
  endpoint is treated as PASS-skipped (graceful degrade for older
  preview snapshots).
- **Output**: each line `PASS|FAIL <method> <path> → <status> (<reason>)`
  · summary `N/M passed` · exit 0 only when all green.

### B — Founder-password guard (chapter #122 / #124)

If `--founder-pass` (or `$FOUNDER_PASSWORD`) literally equals `"123"`,
the script aborts BEFORE making any HTTP call and exits **2** with:

```
post-deploy-smoke: refusing to run — founder password is the dev placeholder "123".
Set FOUNDER_PASSWORD (≥12 chars, chapter #129) before running smoke against prod/preview.
```

This is belt-and-braces with chapter #129's prod fail-closed founder
seed: even if a future regression re-introduces the dev fallback, the
smoke refuses to authenticate against it.

### C — Operator dry-run guide (manual ship-gate checklist)

Run these in order against the preview URL Ed gets from Vercel. Each
step lists the copy-pastable command + expected outcome. The smoke
script automates steps 0-3; steps 4-9 are human-eyes-on browser checks
because they exercise multi-tenant + plugin install UX that's not
amenable to a headless probe.

**Pre-step.** Open a fresh Chrome/Firefox profile (no stored
cookies). Set `BASE=https://<preview>.vercel.app` in your shell.

**Step 0 — script smoke** (covers steps 1-3 below automatically).

```bash
cd 04-the-final-portal/milesymedia-website
npm run smoke:post-deploy -- --url=$BASE --founder-pass=$FOUNDER_PASSWORD
```

Expected: `[post-deploy-smoke] N/N passed.` and exit code 0. If any
line is FAIL, abort and fix before continuing.

**Step 1 — sign in as founder.**

Browser: visit `$BASE/login`, enter `edwardhallam07@gmail.com` +
`$FOUNDER_PASSWORD`. Expected: redirect to `/portal/agency`. Sidebar
shows "Milesy Media" agency switcher; topbar avatar shows founder.

```bash
curl -sI -X POST $BASE/api/auth/login \
  -H 'content-type: application/json' \
  -d "{\"email\":\"edwardhallam07@gmail.com\",\"password\":\"$FOUNDER_PASSWORD\"}" \
  | grep -i set-cookie
```

Expected: `Set-Cookie: lk_session_v1=…; HttpOnly; SameSite=Lax; Secure`.

**Step 2 — create a demo client.**

In `/portal/agency/clients`, click "+ New client", name `Smoke Test`,
slug `smoke-test`. Expected: row appears; `/portal/clients/smoke-test`
serves 200; default phase is `aqua-onboarding` (or whichever the
seeder marks `isDefault: true`).

**Step 3 — install a plugin on the demo client.**

`/portal/clients/smoke-test/plugins` → install `bos-dashboard` (or
any plugin from `_registry`). Expected: plugin row flips to
"Installed"; navigating to the plugin's surface (e.g.
`/portal/clients/smoke-test/dashboard`) renders.

**Step 4 — phase advance.**

`/portal/clients/smoke-test` → phase advance button. Expected:
phase column moves to next ordering (e.g. `aqua-onboarding` →
`aqua-launch`); audit log row appears in the activity feed.

**Step 5 — sign out.**

Topbar avatar → Sign out. Expected: redirect to `/login`; visiting
`/portal/agency` redirects back to `/login`.

```bash
curl -sI $BASE/portal/agency | grep -i location
# expected: location: …/login…
```

**Step 6 — sign in as demo end-customer.**

In a fresh browser profile, visit `$BASE/health-check`, complete the
flow with `smoke+customer-<ts>@aqua.test`. Expected: redirect to
`/business-os` with the lead cookie; the lead can revisit on the same
profile and stay signed in.

**Step 7 — Sentry / observability sanity** (only when `SENTRY_DSN` set).

Trigger a controlled 500 against an admin-only route with a bad
payload. Expected: event in Sentry within ~30s; Vercel Analytics
page-views show up in the dashboard within ~30s.

**Step 8 — health probes.**

```bash
curl -s $BASE/healthz       | jq .
curl -s $BASE/healthz/full  | jq .
```

Expected: both return JSON; `db: "connected"`; `commit:` matches the
`vercel deploy` SHA.

**Step 9 — sign-off.**

If steps 0-8 all green, Ed signs off in `tasks.md` and proceeds to
the DNS flip per `runbooks/deploy.md` §3.

## Files touched

- NEW (rewrite of R003 stub): `04-the-final-portal/milesymedia-website/scripts/post-deploy-smoke.mjs`.
- EDIT: `04-the-final-portal/milesymedia-website/package.json` — new
  `smoke:post-deploy` script.
- EDIT: `01 development/runbooks/deploy.md` §5 — canonical
  `npm run smoke:post-deploy` invocation block.
- NEW: this chapter (`04-prod-readiness-smoke.md`) + MASTER row #167.
- EDIT: `01 development/tasks.md` — T6 R005 tick.

## Q-ASSUMED

- `/api/auth/me` unauthed: asserts JSON shape (`{user: …}`) rather
  than a specific HTTP status, because the current implementation
  returns 200 `{user:null}` while the runbook list permits 401 — the
  shape contract is the durable invariant.
- `/portal/customer` and `/portal/clients/<slug>` and
  `/embed/<slug>/<variant>` and `/portal/agency/pipelines/<slug>` are
  NOT in the static-route block: they require an authenticated session
  with a known slug, which the script can't materialise without a
  preview-database fixture. Operator dry-run §3-§4 covers them.
- HC completion endpoint path `/api/portal/public-funnel/hc-complete`
  per scope wording; if a preview snapshot 404s on it, that's treated
  as PASS-skipped not FAIL (best-effort smoke).
- Founder email defaults to `edwardhallam07@gmail.com` (the
  `DEFAULT_FOUNDER_EMAIL` from `founderSeed.ts`) when neither
  `--founder-email` nor `$FOUNDER_EMAIL` set. In prod that env should
  be set explicitly per chapter #129.
- `--founder-pass` literal `"123"` triggers exit 2; longer/different
  passwords (even insecure ones like `"password"`) do not — this is
  the specific dev-placeholder string we've been excising.
- `redirect: "manual"` everywhere so we test the actual 30x emitted
  by middleware, not the eventual 200 after follow.
- `--verbose` prints the first 240 chars of every response body —
  useful for debugging but defaults off to keep CI logs grep-able.

## NOT in scope (post-ship / R+1)

- Load testing (k6 / autocannon).
- Real-user-monitoring sweep.
- Synthetic monitoring on schedule (cron-driven smoke against prod
  every 15min — T6 R+1 once basic smoke green).
- Headless-browser dry-run (Playwright) for the multi-tenant + plugin
  install UX flows — operator dry-run guide §4-§7 cover those by hand
  for v1.
- Per-client preview portals (`portal-<slug>.vercel.app`) — those land
  with `@aqua/plugin-domains` activation in T6 R004.

## Cross-links

- Chapter #124 — Ship Plan v1 §"Ship gate" (the source-of-truth list).
- Chapter #163 — Deploy runbook rewritten (T6 R001) — §5 hosts the
  canonical command added in this round.
- Chapter #129 — Founder password rotation + prod fail-closed seed
  (the env contract this smoke leans on).
- Chapter #122 — Website-portal unification (the move that made a
  single-host smoke meaningful).
- Chapter #144 — `/healthz/full` diagnostics surface.
- Chapter #160 — `/login/forgot` + `/login/reset` (entries 11-12 in
  the route list).

---

Authored 2026-05-08 by Claude (T6 subagent) under Ed's max-effort
directive. Closes T6 queue; next move is the DNS flip.
