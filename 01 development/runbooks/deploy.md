# Deploy runbook — Aqua portal + per-client portals

> Operator-facing runbook for shipping `04 the final portal/` to Vercel.
> Authored by T6 in R2 on top of T6 R1's monorepo wiring (commits
> `359b476` / `ef2e82f` / `6045568`) and T1 R8's stitch
> (`04-milesymedia-portal-stitch.md`).

This is the canonical "how do we ship" document. If it disagrees with
a chapter, the chapter is wrong — patch it. If it disagrees with
reality, reality wins; patch this.

## At a glance

| What | Where | Vercel project |
|------|-------|----------------|
| Shared Aqua portal + milesymedia front door | `04 the final portal/portal/` (build copies milesymedia static into `public/_milesy/`) | one project — `aqua-portal` (placeholder name) |
| Per-Live-client portal | `04 the final portal/clients/<slug>/` | one project per Live client — e.g. `client-luv-and-ker` |

Two things that are NOT deployed here:

- `02 felicias aqua portal work/` and `03 old portal/` — reference codebases. Excluded via `.vercelignore`.
- `01 development/` — process artefacts, never deployed.

## 0. Vercel CLI bootstrap

Run once per machine:

```bash
npm install -g vercel              # the CLI
vercel login                       # opens a browser, picks the account
vercel switch <team-slug>          # if the account has multiple teams
```

If you already have `vercel` installed but it's old: `npm i -g vercel@latest`.

## 1. Pre-deploy checklist

Run these before EVERY deploy. Each one is 5–60 seconds; do all of
them. Do NOT skip.

```bash
cd ~/Desktop/ker-v3
git pull --rebase --autostash
git status                         # clean tree
```

```bash
cd '04 the final portal/portal'
npx tsc --noEmit                   # must be clean
npm run smoke                      # must pass — exit 0
```

For each plugin you've changed:

```bash
cd '04 the final portal/plugins/<plugin-id>'
npx tsc --noEmit
npm run smoke
```

For the per-client portal you're shipping:

```bash
cd '04 the final portal/clients/<slug>'
npx tsc --noEmit
npm run dev                        # smoke a few routes locally
```

If any step fails, **stop**. Do not deploy a broken build.

## 2. Environment variables

Two layers — keep them straight.

### 2a. Per-deployment env (Vercel project env)

Set via Vercel dashboard (Project → Settings → Environment Variables)
**or** `vercel env add` from the CLI. Never commit values to the repo.

The full list lives in `04 the final portal/portal/.env.example`.
The required ones for a production deploy of the **shared portal**:

| Var | Required? | Notes |
|-----|-----------|-------|
| `PORTAL_SESSION_SECRET` | YES | `openssl rand -base64 48` — paste the output |
| `DATABASE_URL` | YES | Postgres URL (`?sslmode=require` for cloud providers) |
| `NEXT_PUBLIC_PORTAL_BASE_URL` | YES | The deployed origin — e.g. `https://milesymedia.com` |
| `NEXT_PUBLIC_PORTAL_SECURITY` | YES | `strict` (any non-developer environment) |
| `VERCEL_TOKEN` | optional | Domain-attach via Vercel REST API. Without it: manual-DNS path |
| `VERCEL_TEAM_ID` | optional | When the token has multi-team access |
| `SENTRY_DSN` | optional | Server error capture |
| `SENTRY_ENVIRONMENT` | optional | Tag (`production` / `staging`); default = `NODE_ENV` |
| `SENTRY_TRACES_SAMPLE_RATE` | optional | 0–1, default 0 |
| `NEXT_PUBLIC_SENTRY_DSN` | optional | Browser capture |
| `PORTAL_BACKEND` | optional | `file` / `kv` / `postgres`. With `DATABASE_URL` set + this unset, defaults to `postgres`. |

### 2b. Per-install plugin config

NOT in env. Stripe / Postmark / etc. live on `pluginInstalls[*].config`
in the database, surfaced via each plugin's admin Settings page.
Do NOT add provider creds to env — they don't scale across tenants.

If you're moving creds from a non-Aqua source (e.g. a previous Stripe
dashboard for an existing client), open the relevant plugin's
Settings page in the portal and paste them there.

### 2c. Per-client portal env

Each per-Live-client Vercel project has its OWN env block. The
template lives at `scripts/templates/client.env.example`. Required:

| Var | Notes |
|-----|-------|
| `NEXT_PUBLIC_AGENCY_ID` | Static — pinned at deploy time |
| `NEXT_PUBLIC_CLIENT_ID` | Static |
| `NEXT_PUBLIC_PORTAL_SLUG` | Static — matches the folder name under `clients/` |
| `NEXT_PUBLIC_PORTAL_BASE_URL` | Pointer back to the shared portal — e.g. `https://milesymedia.com` |

Per-client portals do NOT carry Stripe / Postmark creds. They proxy
API calls to the shared portal, which reads each tenant's
`install.config` and dispatches.

### 2d. Local dev

For local dev, copy `.env.example` → `.env.local` and fill in:

```bash
cd '04 the final portal/portal'
cp .env.example .env.local
$EDITOR .env.local
```

The dev defaults work without any env: `PORTAL_BACKEND=file`,
sessions sign with a fixed dev secret, observability is no-op.
Set `PORTAL_SESSION_SECRET` if you want sessions to survive across
restarts.

## 3. Deploy — shared portal

### 3a. First deploy (one-time)

```bash
cd ~/Desktop/ker-v3
node scripts/deploy-vercel.mjs --target=portal
```

This script invokes `vercel link` interactively the first time.
Pick the right team + create or link to the existing `aqua-portal`
project.

The script then runs `vercel deploy` in preview mode (NOT prod).
The output prints the preview URL — visit it, smoke the surface
(see §5 below), then promote to prod.

### 3b. Promote to production

```bash
node scripts/deploy-vercel.mjs --target=portal --prod
```

That's it. Vercel runs:

1. `node scripts/build-portal.mjs` — copies `04 the final portal/milesymedia website/*` into `04 the final portal/portal/public/_milesy/`, then `npm install` + `next build` inside the portal folder.
2. Outputs at `04 the final portal/portal/.next` (per root `vercel.json`).
3. Edge rewrites map `/`, `/index.html`, `/login.html`, `/admin.html`, `/styles.css` → `/_milesy/<file>` so the milesymedia front door wins at root paths.
4. Every Aqua portal handler keeps its native route (`/login`, `/embed/login`, `/demo`, `/portal/*`, `/api/*`).

### 3c. Subsequent deploys

After the first link, `node scripts/deploy-vercel.mjs --target=portal --prod`
just deploys. Vercel's git integration (if set up) also auto-deploys
on push to `main`.

## 4. Deploy — per-client portal

Each Live client's portal is its OWN Vercel project. Repeat per client.

### 4a. First-time link

```bash
cd ~/Desktop/ker-v3
node scripts/deploy-vercel.mjs --target=clients/<slug>
```

Interactive `vercel link` runs once — pick the right team + create
a new project (recommended name: `client-<slug>`). Vercel auto-detects
Next.js framework from the client folder's `package.json`.

### 4b. Set the per-client env

In the Vercel dashboard for the new project:

```
NEXT_PUBLIC_AGENCY_ID         <agency id from shared portal>
NEXT_PUBLIC_CLIENT_ID         <client id from shared portal>
NEXT_PUBLIC_PORTAL_SLUG       <slug — matches folder name>
NEXT_PUBLIC_PORTAL_BASE_URL   https://milesymedia.com
```

Optionally also: `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`,
`SENTRY_ENVIRONMENT`.

### 4c. Promote to production

```bash
node scripts/deploy-vercel.mjs --target=clients/<slug> --prod
```

### 4d. Attach the custom domain

See §6 (custom domain runbook).

## 5. Post-deploy verification

Visit each surface and smoke it.

### Shared portal

```
GET https://milesymedia.com/                  → 200 (milesymedia static)
GET https://milesymedia.com/login.html        → 200 (static)
GET https://milesymedia.com/styles.css        → 200 text/css
GET https://milesymedia.com/login             → 200 (Next.js login)
GET https://milesymedia.com/embed/login       → 200
GET https://milesymedia.com/demo              → 307 → /portal/agency  + Set-Cookie isDemo:true
GET https://milesymedia.com/portal/agency     → 200 after sign-in
GET https://milesymedia.com/api/auth/me       → 200 / 401 depending on session
```

Curl one-liners:

```bash
curl -sI https://milesymedia.com/ | head -1                       # HTTP/2 200
curl -s  https://milesymedia.com/styles.css | head -3
curl -sI https://milesymedia.com/login | head -1                  # HTTP/2 200
curl -sIL https://milesymedia.com/demo | head                     # follow redirect
```

### Per-client portal

```bash
curl -sI https://luvandker.com/                     # HTTP/2 200
curl -sI https://luvandker.com/api/auth/me          # proxies to shared portal
```

### Observability (when SENTRY_DSN is set)

1. Trigger a controlled error (e.g. an admin-only route with bad
   payload) and check the Sentry project for the event.
2. Open Vercel project → Web Analytics — page-view should appear
   within ~30s.

## 6. Custom domain runbook

For each Live client whose portal ships under a custom domain.

### 6a. One-time per Vercel team

1. **Generate a Vercel token** — <https://vercel.com/account/tokens>
   with domain-attach access scoped to the team that owns the
   per-client projects.
2. **Set `VERCEL_TOKEN`** as env on the **shared portal** Vercel
   project (where the `@aqua/plugin-domains` plugin runs).
   Optionally set `VERCEL_TEAM_ID` for multi-team tokens.
3. **Re-deploy** the shared portal so the env loads into the
   serverless function bundle.

### 6b. Per-client domain attach (UI path)

1. Sign in as agency owner, navigate to `/portal/agency/domains`.
2. Click "Attach a new domain". Enter:
   - Hostname (e.g. `luvandker.com`)
   - Vercel project id (Vercel dashboard → per-client project →
     Settings → General → "Project ID" `prj_...`)
   - Optional: Vercel team id
3. The plugin calls Vercel REST + records the response. Vercel
   returns DNS records the operator must add at the registrar
   (typically a TXT for verification + an A or CNAME for routing).
4. **Operator copies DNS records** to the registrar (Cloudflare /
   Namecheap / GoDaddy / etc).
5. **The plugin auto-polls** Vercel every 30s up to 5 minutes —
   status badge flips `pending` → `verified` once DNS propagates.
6. After 5 minutes, polling stops; click "Re-check verify" to retry.

### 6c. Per-client domain attach (CLI path)

For scripting / batch operations:

```bash
VERCEL_TOKEN=<token> \
VERCEL_PROJECT_ID=prj_xxxxxxxxxxxxxxxx \
VERCEL_TEAM_ID=team_xxxxxxxxxxxxxxxx \
node scripts/attach-domain.mjs --hostname=luvandker.com
```

Output prints the DNS records the operator must add. Run again with
`--verify` to re-check verification:

```bash
VERCEL_TOKEN=<token> VERCEL_PROJECT_ID=prj_xxx \
node scripts/attach-domain.mjs --hostname=luvandker.com --verify
```

Or remove:

```bash
VERCEL_TOKEN=<token> VERCEL_PROJECT_ID=prj_xxx \
node scripts/attach-domain.mjs --hostname=luvandker.com --remove
```

### 6d. Without VERCEL_TOKEN (manual path)

If the token isn't configured yet, the plugin still records the
hostname locally and shows the operator which Vercel project the
domain is meant for. Manual steps:

```bash
cd '04 the final portal/clients/<slug>'
vercel domains add <hostname>             # interactive — auth needed
# Vercel prints DNS records — copy to registrar
vercel domains verify <hostname>          # once DNS propagates
```

The plugin's local record stays in `pending` until `VERCEL_TOKEN` is
set + a verify re-checks via the UI or `attach-domain.mjs --verify`.

## 7. Rollback

### 7a. Vercel rollback (preferred)

Vercel keeps every deployment. To roll back:

1. Vercel dashboard → Project → Deployments.
2. Find the last known-good deployment.
3. Click the `…` menu → **Promote to Production**.

Done. No git activity needed.

CLI equivalent:

```bash
vercel rollback <deployment-url> --prod
```

### 7b. Git rollback (when the bad code is the issue)

```bash
git pull --rebase
git revert <bad-sha> --no-edit
git push
```

Vercel auto-deploys the revert. Only do this when the rollback
must be tracked in main's history (e.g. a security fix with a
follow-up patch coming).

### 7c. Database rollback (Postgres backend)

The Postgres schema is single-row JSONB (per T1 R7's `04-foundation-round7-postgres.md`).
A bad write to the blob is reversible:

1. Vercel dashboard → Postgres → query `SELECT value, updated_at FROM portal_kv WHERE key = '__portal_state__';`
2. The previous row is captured in your provider's PITR window
   (Neon: 24h; Supabase: 7d depending on plan; Vercel Postgres:
   varies). Restore from PITR via the provider's UI.
3. Re-deploy the shared portal so cached state hydrates from the
   restored row.

### 7d. Custom-domain rollback

A bad domain attach can be removed via the UI ("Remove" button) or
CLI (`scripts/attach-domain.mjs --hostname=... --remove`). Vercel
de-attaches the domain from the project; DNS at the registrar can
stay (Vercel will reject traffic until re-attached).

## 8. Cron — nightly demo reset (deferred)

`/api/dev/seed-demo?reset=1` resets the sandbox demo agency. Per
T1 R4 chapter `04-milesymedia-demo.md` §5, a Vercel cron entry
hitting that endpoint nightly at 04:00 UTC is the intended setup.

To wire it once ready:

```jsonc
// add to root vercel.json
{
  "crons": [
    { "path": "/api/dev/seed-demo?reset=1", "schedule": "0 4 * * *" }
  ]
}
```

Auth: gate on `NEXT_PUBLIC_DEV_BYPASS=1` for the cron's environment
OR a service token. Out of scope for R2 — wire when Ed is ready.

## 9. Troubleshooting

### Build fails with "Cannot find module '@aqua/plugin-X'"

Cause: workspace plugin folder isn't being copied into the build
context. Check:
- `.vercelignore` doesn't exclude `04 the final portal/plugins/`.
- The plugin's `package.json` exists.
- The plugin folder isn't in a `.gitignore`.

### Build fails with "Module not found: pg"

Cause: `DATABASE_URL` is set but `pg` isn't installed in
`04 the final portal/portal/`. Fix:

```bash
cd '04 the final portal/portal'
npm install pg @types/pg
git add package.json package-lock.json
git commit -m "deps: pg for Postgres backend"
git push
```

### Shared portal returns 500 on `/`

Cause: milesymedia static files didn't get copied into `public/_milesy/`.
Check the build log for `▶ Copy milesymedia static → portal/public/_milesy/`.
If absent, `scripts/build-portal.mjs` didn't run.

### Custom-domain attach returns "vercel-token-not-configured"

Cause: `VERCEL_TOKEN` env is unset on the shared portal's Vercel
project. Fix: set it + re-deploy.

### Per-client portal renders but API calls 502

Cause: `NEXT_PUBLIC_PORTAL_BASE_URL` on the per-client project
points at an unreachable shared portal. Fix: confirm the URL is
correct (and reachable from the per-client project's region).

## 10. Glossary

| Term | Meaning |
|------|---------|
| Shared portal | The Aqua portal Next.js app at `04 the final portal/portal/`. One per Vercel team. Hosts agency + pre-Live clients + Live-client editor. |
| Per-client portal | Each Live client's branded portal at `04 the final portal/clients/<slug>/`. One Vercel project per client. |
| Milesymedia front door | Static marketing pages at `04 the final portal/milesymedia website/`. Bundled into the shared portal's public/ at build time. |
| Foundation pending | Plumbing the foundation needs to add to wire a plugin: workspace dep + transpilePackages + side-effect-import + `_registry.ts` append + `ActivityCategory` extension. |
| Pool model | Architecture §1 — every row carries `agencyId` (+ `clientId` for client rows). One Postgres serves every tenant. |
