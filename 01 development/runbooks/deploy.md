# Deploy runbook — Aqua portal (milesymedia-website)

> Deploy `04-the-final-portal/milesymedia-website/` to Vercel. Single
> project. No copy steps.

Post-unification (chapter #122) there is one Next.js app. Marketing
(`public/_marketing/`), Health Check (`public/health-check/`),
Business OS (`public/business-os/`), and Incubator
(`public/incubator/`) all live under the website's `public/`. The
old `04-the-final-portal/portal/` folder + `scripts/build-portal.mjs`
+ `_milesy/` copy step are gone. Per-client portals at
`04-the-final-portal/clients/<slug>/` are deferred behind T5 (chapter
#124 WS-F).

If this runbook disagrees with reality, reality wins — patch this.
If it disagrees with a chapter, the chapter is wrong — patch it.

## 1. Pre-deploy checklist

Run these before every deploy. None of them takes more than ~60s.

**0. CI is green on the latest commit** (T6 R002 / chapter #165).
Open <https://github.com/edsworld27/ker-v3/actions/workflows/ci.yml>
and confirm the run for the commit you're about to deploy is green
(`tsc-and-smoke-portal` + every `tsc-and-smoke-plugins` matrix leg).
Vercel does not block on CI; this manual gate + the local checks
below are what enforce "no broken deploys". When branch protection
on `main` is wired (operator-side GitHub action), the manual check
becomes redundant — keep it documented anyway as the belt to the
suspenders.

```bash
cd ~/Desktop/ker-v3
git pull --rebase --autostash
git status                         # tree must be clean
```

```bash
cd '04-the-final-portal/milesymedia-website'
npx tsc --noEmit                   # must be clean
npm run smoke                      # must pass — exit 0
```

If either step fails, **stop**. Do not deploy a broken build.

## 2. Environment variables

Two layers — keep them straight.

### 2a. Per-deployment env (Vercel project env)

Set via Vercel dashboard (Project → Settings → Environment Variables)
or `vercel env add` from the CLI. Never commit values to the repo.
Canonical list: `04-the-final-portal/milesymedia-website/.env.example`.

| Var | Required? | Notes |
|-----|-----------|-------|
| `PORTAL_SESSION_SECRET` | YES | ≥32 chars. Generate via `openssl rand -base64 48` and paste. HMAC key for `lk_session_v1` cookie + magic-link/reset/nonce HMAC (chapter #138). |
| `DATABASE_URL` | YES | Postgres URL — append `?sslmode=require` for Neon / Supabase / Vercel Postgres (chapter #134). |
| `NEXT_PUBLIC_PORTAL_BASE_URL` | YES | Public origin — `https://milesymedia.com` in prod. Used by embed back-link, OAuth redirect derivation, password-reset email URLs. |
| `NEXT_PUBLIC_PORTAL_SECURITY` | YES | `strict` in any non-developer environment. |
| `FOUNDER_EMAIL` | YES | Real founder address. Production refuses seed when this equals the dev default `edwardhallam07@gmail.com` (chapter #129 fail-closed guard). Rotate before public flip — chapter #124 ship gate. |
| `FOUNDER_PASSWORD` | YES | ≥12 chars in production. Definitely not `123`. Missing → seed throws fail-closed in prod (chapter #129). Rotate before public flip; never reuse the dev password. |
| `FOUNDER_AGENCY_NAME` | optional | Defaults to `Milesy Media`. Override only for niche-agency deploys (e.g. `AquaOasis Web`). |
| `PORTAL_BACKEND` | optional | `file` / `kv` / `postgres`. Auto-derives to `postgres` when `DATABASE_URL` is set (chapter #134). Set explicitly only to override the auto-derive (e.g. force `kv`). |

Optional / observability / integrations:

| Var | Notes |
|-----|-------|
| `SENTRY_DSN` | Server-side error capture (chapter #144). No-op when unset. |
| `SENTRY_ENVIRONMENT` | Tag (`production` / `staging`); defaults to `NODE_ENV`. |
| `SENTRY_TRACES_SAMPLE_RATE` | 0.0–1.0, default 0. |
| `NEXT_PUBLIC_SENTRY_DSN` | Browser capture; unset = no-op. |
| `GOOGLE_OAUTH_CLIENT_ID` | Google Cloud Console → Credentials → OAuth 2.0 Client ID (Web application). All three OAuth vars unset → "Continue with Google" hidden + start/callback routes 404; password + magic-link login still work (chapter #150). |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Paired with the Client ID. Both required for the button to render. |
| `GOOGLE_OAUTH_REDIRECT_URI` | Defaults to `<NEXT_PUBLIC_PORTAL_BASE_URL>/api/auth/oauth/google/callback`. Must match the URI registered in Google Console exactly. |
| `VERCEL_TOKEN` | Required by `@aqua/plugin-domains` for custom-domain attach via Vercel REST. Without it: manual-DNS path (§6d). |
| `VERCEL_TEAM_ID` | When the token has multi-team access. |

Dev-only (do **not** set in production):

| Var | Notes |
|-----|-------|
| `NEXT_PUBLIC_DEV_BYPASS` | `1` bypasses `/portal/*` auth on the dev server. Production: leave unset. |

Env policy: every server-readable key flows through `lib/server/env.ts`
allow-list + typed accessors in `lib/server/secrets.ts` (chapter
#142). Adding a new env var means appending to both surfaces.

### 2b. Per-install plugin config

NOT in env. Stripe per-client, Postmark per-agency, SMTP creds
(chapter #144 outbound), GA4 measurement IDs (chapter #149), and
similar provider creds live on `pluginInstalls[*].config` in the
database. Surface via each plugin's admin Settings page. Do not add
provider creds to env — they don't scale across tenants.

### 2c. Local dev

Copy `.env.example` → `.env.local` and fill in:

```bash
cd '04-the-final-portal/milesymedia-website'
cp .env.example .env.local
$EDITOR .env.local
```

Defaults work without env: `PORTAL_BACKEND=file`, sessions sign with a
fixed dev secret, observability is no-op. Set `PORTAL_SESSION_SECRET`
if you want sessions to survive across restarts.

## 3. First deploy + promote

### 3a. Vercel CLI bootstrap (one-time per machine)

```bash
npm install -g vercel        # or: npm i -g vercel@latest
vercel login                 # browser → pick the account
vercel switch <team-slug>    # if multi-team
```

### 3b. Link the project (one-time)

The Vercel project root is `04-the-final-portal/milesymedia-website/`.

```bash
cd '04-the-final-portal/milesymedia-website'
vercel link                  # interactive — pick team, create project
```

Vercel auto-detects Next.js. No build script wrapping needed (the
old `scripts/build-portal.mjs` is gone — Vercel runs `next build`
directly per `package.json`).

### 3c. Preview deploy + smoke

```bash
vercel deploy                # outputs a preview URL
```

Smoke the preview URL against §5 below. Scripted subset:

```bash
cd '04-the-final-portal/milesymedia-website'
node scripts/post-deploy-smoke.mjs --url=https://<preview>.vercel.app
# exit 0 = all pass; 1 = any fail (chapter #166 — T6 R003).
```

If everything passes, promote.

### 3d. Promote to production

```bash
vercel deploy --prod
```

That's it. Subsequent deploys re-run `vercel deploy --prod`. Vercel's
git integration (if attached) also auto-deploys on push to `main`.

## 4. Per-client portals (deferred until T5 ships)

Lands when T5 R001–R003 ship Felicia (Luv & Ker) at
`04-the-final-portal/clients/luv-and-ker/` (chapter #124 WS-F). The
shape: each Live client gets its own Vercel project rooted at
`clients/<slug>/`, env carries `NEXT_PUBLIC_AGENCY_ID` /
`NEXT_PUBLIC_CLIENT_ID` / `NEXT_PUBLIC_PORTAL_SLUG` /
`NEXT_PUBLIC_PORTAL_BASE_URL`, API calls proxy back to the shared
portal. Custom domain attach is handled by `@aqua/plugin-domains`
(§6) once T6 R004 activates the plugin.

This section will be filled in at T6 R005 (post-T5-ship).

## 5. Post-deploy verification — smoke routes

Hit each surface against the deploy URL (preview before promote, prod
after). Per chapter #124 ship-gate item #9:

```
GET /                                       → 200 marketing home
GET /for-skincare                           → 200 niche page
GET /for-coaching                           → 200
GET /for-fitness                            → 200
GET /for-agencies                           → 200
GET /health-check                           → 200 HC entry
GET /business-os                            → 200 BOS entry
GET /business-os/incubator                  → 200 (chapter #159 R009)
GET /incubator                              → 307 → /business-os/incubator
GET /login                                  → 200
GET /login/forgot                           → 200 (chapter #160)
GET /login/reset?token=…                    → 200 (force-dynamic; see §9)
GET /signup                                 → 200
GET /signup/agency                          → 200
GET /demo                                   → 307 → /portal/agency + Set-Cookie isDemo:true
GET /dev/pov                                → 200 (dev-only personas)
GET /portal/agency                          → 200 (after sign-in) / 401 anon
GET /portal/agency/pipelines/<slug>         → 200 after sign-in (chapter #156 R034)
GET /portal/account                         → 200 after sign-in
GET /portal/account/preferences             → 200 (chapter #155 R036)
GET /portal/account/permissions             → 200 (commander stub)
GET /embed/<slug>/<variant>                 → 200
GET /api/auth/me                            → 200 / 401
GET /healthz                                → 200 JSON
GET /healthz/full                           → 200 JSON (chapter #144 R030)
```

**Canonical post-deploy smoke** (T6 R005, chapter #167) — runs every
route above plus a real founder login + HC-completion flow against the
deploy URL. Exits 0 only when all checks pass; refuses to run (exit 2)
when `FOUNDER_PASSWORD` is the dev placeholder `"123"`:

```bash
cd 04-the-final-portal/milesymedia-website
npm run smoke:post-deploy -- --url=https://<preview>.vercel.app \
  --founder-pass=$FOUNDER_PASSWORD
# add --verbose for response bodies; --founder-email=<addr> if non-default
```

Curl one-liners for the cheap subset:

```bash
BASE=https://milesymedia.com
curl -sI $BASE/                | head -1   # HTTP/2 200
curl -sI $BASE/login           | head -1   # HTTP/2 200
curl -sI $BASE/healthz         | head -1   # HTTP/2 200
curl -s  $BASE/healthz/full    | head -c 200
curl -sIL $BASE/demo           | head      # follow redirect
curl -sIL $BASE/incubator      | head      # 307 → /business-os/incubator
```

Observability check (when `SENTRY_DSN` set): trigger a controlled
500 against an admin-only route with bad payload, confirm the event
in Sentry within ~30s. Vercel Web Analytics page-views appear in the
project dashboard within ~30s too.

## 6. Custom-domain runbook

For each Live client whose portal ships under a custom domain.
`@aqua/plugin-domains` activation is T6 R004's territory; the plumbing
below already exists in the plugin and is reachable once activated.

### 6a. One-time per Vercel team

1. Generate a Vercel token at <https://vercel.com/account/tokens>
   with domain-attach scope on the team that owns per-client projects.
2. Set `VERCEL_TOKEN` (and optionally `VERCEL_TEAM_ID`) on the
   shared milesymedia-website Vercel project.
3. Re-deploy so the env loads into the serverless function bundle.

### 6b. Per-client domain attach (UI path)

1. Sign in as agency owner → `/portal/agency/domains`.
2. Click "Attach a new domain". Enter:
   - Hostname (e.g. `luvandker.com`).
   - Vercel project id (`prj_…` from per-client project Settings).
   - Optional: Vercel team id.
3. Plugin calls Vercel REST + records the response. Vercel returns
   DNS records the operator must add at the registrar (typically a
   verification TXT + an A or CNAME).
4. Operator copies DNS records to the registrar (Cloudflare /
   Namecheap / GoDaddy / etc).
5. Plugin auto-polls Vercel every 30s up to 5 minutes — status badge
   flips `pending` → `verified` once DNS propagates.
6. After 5 minutes polling stops; click "Re-check verify" to retry.

### 6c. Per-client domain attach (CLI path)

```bash
VERCEL_TOKEN=<token> \
VERCEL_PROJECT_ID=prj_xxxxxxxxxxxxxxxx \
VERCEL_TEAM_ID=team_xxxxxxxxxxxxxxxx \
node scripts/attach-domain.mjs --hostname=luvandker.com
```

`--verify` re-checks; `--remove` detaches.

### 6d. Without `VERCEL_TOKEN` (manual path)

```bash
cd '04-the-final-portal/clients/<slug>'
vercel domains add <hostname>            # interactive
# Vercel prints DNS records — copy to registrar
vercel domains verify <hostname>         # once DNS propagates
```

The plugin's local record stays `pending` until `VERCEL_TOKEN` is set
and a verify re-checks via the UI or `attach-domain.mjs --verify`.

## 7. Rollback

### 7a. Vercel rollback (preferred)

Vercel keeps every deployment.

1. Vercel dashboard → Project → Deployments.
2. Find the last known-good deployment.
3. `…` menu → **Promote to Production**.

CLI equivalent:

```bash
vercel rollback <deployment-url> --prod
```

### 7b. Git revert (when the bad code must be in main's history)

```bash
git pull --rebase
git revert <bad-sha> --no-edit
git push
```

Vercel auto-deploys the revert. Use this when the rollback must be
tracked in main (e.g. a security fix with a follow-up patch coming).

### 7c. Postgres PITR (accidental data writes — chapter #134)

The Postgres backend is single-row JSONB at `portal_kv.__portal_state__`.

1. Vercel dashboard → Postgres → check the bad row:
   `SELECT updated_at, length(value::text) FROM portal_kv WHERE key = '__portal_state__';`
2. Restore from the provider's PITR window via its UI:
   - Neon: 24h on free, longer on paid.
   - Supabase: 7d depending on plan.
   - Vercel Postgres: provider-dependent.
3. Re-deploy the milesymedia-website project so cached state hydrates
   from the restored row.

### 7d. Custom-domain rollback

A bad attach can be removed via the UI ("Remove" button) or
`scripts/attach-domain.mjs --remove`. Vercel detaches the domain;
DNS at the registrar can stay (Vercel will reject traffic until
re-attached).

## 8. Crons (staged — flip when Ed approves quota)

Root `vercel.json` carries the live deploy config (chapter #163 +
#166) — `framework`, `regions: ["lhr1"]` (London — Ed-leaning UK
audience; configurable, swap to `iad1` / `fra1` / etc. by editing
the array), `buildCommand`, `outputDirectory`, `cleanUrls`,
`trailingSlash`. JSON has no comments so the staged crons block
lives in a sibling file: `vercel.crons.example.json` at the repo
root.

To enable crons (operator action, after Ed approves quota): copy
the `crons` array from `vercel.crons.example.json` into root
`vercel.json` (merge with existing keys), commit, redeploy. Each
firing counts toward Vercel's cron quota.

The three crons (verbatim from `vercel.crons.example.json`):

```jsonc
{
  "crons": [
    // Demo reset — daily 04:00 UTC.
    { "path": "/api/dev/seed-demo?reset=1", "schedule": "0 4 * * *" },

    // Healthcheck — hourly. Pings every target's /healthz and
    // appends a sample to the ops plugin's UptimeStore.
    { "path": "/api/portal/ops/healthcheck", "schedule": "0 * * * *" },

    // Postgres backup — daily 03:30 UTC. Calls the same flow as
    // scripts/backup-postgres.mjs via a thin server route.
    { "path": "/api/portal/ops/backup", "schedule": "30 3 * * *" }
  ]
}
```

Endpoint readiness (chapter #166 verification):

- `/api/dev/seed-demo` — exists today (`src/app/api/dev/seed-demo/
  route.ts`).
- `/api/portal/ops/healthcheck` — routed via the catch-all
  `/api/portal/[plugin]/[...rest]`; the `@aqua/plugin-ops` plugin
  registers a `healthcheck` route (POST). Before flipping the cron,
  confirm it accepts the GET that Vercel's cron invoker issues, or
  add a thin GET wrapper.
- `/api/portal/ops/backup` — **endpoint pending; owner: T2 ops
  plugin**. The local-first backup flow lives in
  `scripts/backup-postgres.mjs` (§8a); the route that wraps it has
  not landed yet. Don't enable the backup cron until that route
  exists.

Auth: each cron path gates on `NEXT_PUBLIC_DEV_BYPASS=1` for the
cron's environment OR a service token. Quota wiring is operator
action.

### 8a. Postgres backup — `scripts/backup-postgres.mjs`

Local-first, externally schedulable. Runs `pg_dump` against
`DATABASE_URL`, gzips the dump, writes
`backups/aqua-portal-<ts>.sql.gz`, prunes snapshots older than
`BACKUP_RETENTION_DAYS` (default 30).

```bash
DATABASE_URL=postgres://... node scripts/backup-postgres.mjs

BACKUP_DIR=/var/backups/aqua \
  BACKUP_RETENTION_DAYS=60 \
  DATABASE_URL=... \
  node scripts/backup-postgres.mjs
```

Exit codes: `0` ok / `1` no DATABASE_URL / `2` pg_dump failed. Restore:
`gunzip -c backups/aqua-portal-<ts>.sql.gz | psql "$DATABASE_URL"`.

External destinations (`BACKUP_DEST=s3://…` or `vercel-blob`) are
stubbed; uploads land alongside the cron flip.

## 9. Troubleshooting

### Build fails: `Cannot find module '@aqua/plugin-X'`

Cause: workspace plugin folder excluded from the build context.
Check:

- `.vercelignore` doesn't exclude `04-the-final-portal/plugins/`.
- The plugin's `package.json` exists.
- The plugin folder isn't `.gitignore`d.

### Build fails: `Module not found: pg`

Cause: `DATABASE_URL` is set but `pg` isn't a dep of
`milesymedia-website`. Fix:

```bash
cd '04-the-final-portal/milesymedia-website'
npm install pg @types/pg
git add package.json package-lock.json
git commit -m "deps: pg for Postgres backend"
git push
```

### Custom-domain attach: `vercel-token-not-configured`

Cause: `VERCEL_TOKEN` unset on the milesymedia-website Vercel project.
Fix: set it (+ optionally `VERCEL_TEAM_ID`) and re-deploy.

### Prerender error on `/login` in production (chapter #129)

Cause: `FOUNDER_PASSWORD` missing in prod → `founderSeed` throws
fail-closed at boot, taking the route render with it. Fix: set
`FOUNDER_PASSWORD` (≥12 chars) and `FOUNDER_EMAIL` (not the dev
default) on the Vercel project, redeploy.

### `useSearchParams() should be wrapped in a suspense boundary` on `/login/reset` (chapter #160)

Cause: `/login/reset/page.tsx` reads `?token=` via `useSearchParams`
which forces CSR-bailout at build time. Fix: ensure the page exports
`export const dynamic = "force-dynamic"` (chapter #160 R038 ships
this; if a future round regresses it, the build will surface the
identical CSR-bailout error).

## 10. Glossary

| Term | Meaning |
|------|---------|
| milesymedia-website | The single Next.js host at `04-the-final-portal/milesymedia-website/`. Marketing + HC + BOS + Incubator + portal + API all in one project. |
| Per-install config | Plugin provider creds (Stripe, Postmark, SMTP, GA4) on `pluginInstalls[*].config` per tenant. NOT env. |
| Foundation pending | Plumbing the foundation needs to wire a plugin: workspace dep + transpilePackages + side-effect import + `_registry.ts` append + `ActivityCategory` extension. |
| Pool model | Architecture §1 — every row carries `agencyId` (+ `clientId` for client rows). One Postgres serves every tenant. |
