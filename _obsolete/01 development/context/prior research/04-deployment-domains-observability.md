# `04` Deployment + custom domains + observability (T6 — Round 1)

T6's Round-1 deliverable. Wires the Vercel monorepo deploy, lifts
02's Vercel API code into a self-contained `@aqua/plugin-domains`,
and lands a server-side observability wrapper that production deploys
turn on by setting `SENTRY_DSN` + adding the SDK.

> Built by T6 on 2026-05-05, on top of the architecture extension
> chapter ([04-architecture-extension-per-client-portals.md]
> (04-architecture-extension-per-client-portals.md)).

## 1. Deployment topology — single project + per-client siblings

Architecture §11 and the extension chapter both want
**`milesymedia.com`** as one origin: marketing pages at root, Aqua
portal under `/portal/*`, login + demo + iframe-login + APIs on the
same domain. Cookies are scoped to that origin so the same session
works across every surface.

Per-Live-client portals (`04-the-final-portal/clients/<slug>/`) ship
as their own Next.js apps with their own custom domains. Each is its
own Vercel project. A Live client's site (e.g. `luvandker.com`)
iframe-embeds parts of their per-client portal for performance, and
auth round-trips to milesymedia.com.

```
milesymedia.com  (Vercel project: aqua-portal)
├── /                          ← milesymedia static (front door)
├── /index.html /login.html /admin.html /styles.css
├── /login                     ← Aqua portal login
├── /demo /demo/toggle         ← sandbox
├── /embed/login               ← iframe-able login
├── /api/*                     ← portal + plugin APIs
└── /portal/*                  ← agency + pre-Live + Live editor

luvandker.com    (Vercel project: client-luv-and-ker)
└── /*                         ← clients/luv-and-ker/ Next.js app
                                  (proxies API back to milesymedia.com)

future-client.com (Vercel project: client-future-client)
└── ...
```

### Why single Vercel project for the shared portal + static

We considered two strategies:

| | Single project + bundled static | Multi-project + Vercel rewrites |
|---|---|---|
| Origin | One — cookies + auth work end-to-end | Two — rewrites reverse-proxy at the edge |
| Build | One `next build`, milesymedia copies into `public/_milesy/` | Two builds, two deploy targets |
| Cache | One CDN cache | Two CDN caches |
| Risk | Single blast radius if one breaks | Edge-rewrite latency, cross-project drift |

We picked **single project + bundled static**. The build script
(`scripts/build-portal.mjs`) copies `04-the-final-portal/milesymedia
website/*` into `04-the-final-portal/portal/public/_milesy/` before
running `next build`. Repo-root `vercel.json` adds `rewrites` mapping
`/`, `/index.html`, `/login.html`, `/admin.html`, `/styles.css` →
`/_milesy/<file>`. T1 R8's planned `next.config.ts` rewrites mirror
the same rules for localhost dev so the surface looks identical in
both environments.

### Why per-client portals = separate Vercel projects

Architecture extension §"Why per-client folders, not per-tenant in
shared app" lists the structural reasons:

- **Isolation.** A bug in one client's portal can't take down the
  agency or other clients.
- **Domain bookkeeping.** Each Vercel project owns its own custom
  domain — Vercel's domain attach is scoped at the project level.
  One project trying to hold many production domains adds operational
  friction (which deploy gets which domain on each revision?) and
  blocks features like per-domain ISR cache.
- **Branded build artefact.** Each Live client's portal becomes a
  predictable, exportable, audit-friendly thing.
- **Preset + fork friendliness.** A client can eject from the portal
  by forking their own deploy without ripping data out of a shared
  project.

A nested approach (one project with rewrites for each client's
domain) would force every domain attach to land on the shared portal
project — fine at 1–2 clients, painful at 50+. Split projects scale
linearly with the number of Live clients.

## 2. Files shipped — Phase A

```
vercel.json                            (root — rewrites + build entry)
.vercelignore                          (portal + plugins ship; clients/ excluded)
package.json                           (root — vercel-build hooks build-portal.mjs)
scripts/build-portal.mjs               (Vercel build entrypoint)
scripts/deploy-vercel.mjs              (deploy orchestrator)
scripts/templates/client-vercel.json   (per-Live-client vercel.json template)
scripts/templates/README.md            (template docs)
```

`scripts/deploy-vercel.mjs --target=portal|clients/<slug> [--prod]`
orchestrates the per-target Vercel CLI deploy. Operator must have
`vercel login` done locally; the script does NOT manage credentials.
First deploy of a new target prompts `vercel link` interactively;
subsequent deploys reuse the link.

## 3. Env-var taxonomy — Phase B

Two kinds of secrets coexist in this stack and the split is load-
bearing:

### Per-deployment env (lives in `.env` / Vercel project env)

| Var | Purpose | Required |
|-----|---------|----------|
| `PORTAL_SESSION_SECRET` | HMAC key for `lk_session_v1` cookie | Production yes |
| `PORTAL_BACKEND` | `file` / `postgres` / `kv` | Default `file` |
| `DATABASE_URL` | Postgres URL (T1 R7) | When backend = postgres |
| `PORTAL_PG_POOL_MAX` / `_IDLE_MS` / `_CONNECT_MS` | Postgres pool tuning | Optional |
| `PORTAL_KV_URL` / `PORTAL_KV_TOKEN` | Upstash REST | Alternative to Postgres |
| `NEXT_PUBLIC_PORTAL_SECURITY` | `strict` / `dev` | Use `strict` outside dev |
| `NEXT_PUBLIC_PORTAL_BASE_URL` | Public origin | Yes |
| `VERCEL_TOKEN` | Domain attach via Vercel REST API | Optional (T6 Phase C) |
| `VERCEL_TEAM_ID` | Team scope for Vercel API | Optional |
| `SENTRY_DSN` | Server error capture | Optional (T6 Phase D) |
| `SENTRY_ENVIRONMENT` | Environment tag on events | Defaults to `NODE_ENV` |
| `SENTRY_TRACES_SAMPLE_RATE` | 0.0–1.0 | Default 0 |
| `NEXT_PUBLIC_SENTRY_DSN` | Client-side capture | Optional |

> Naming note: the Round-1 prompt called out `LK_SESSION_SECRET` /
> `STORAGE_BACKEND` / `NEXT_PUBLIC_PORTAL_BASE`. T1 R1+R7 actually
> shipped `PORTAL_SESSION_SECRET` / `PORTAL_BACKEND` /
> `NEXT_PUBLIC_PORTAL_BASE_URL`. T6 honoured the existing names; if
> a future round wants to rename for consistency, do it as a single
> orchestrator-led rename across env + code so deploys stay green.

### Per-install plugin config (lives in `pluginInstalls[*].config`)

| Plugin | What's in config |
|--------|-----------------|
| ecommerce | Stripe secret key + publishable key + webhook signing secret (per client) |
| memberships | Stripe price ids per plan (per client) |
| email-sender | Postmark server token, From address (per agency or per client) |
| forms | Webhook URLs, notify email lists (per form) |
| ... | each plugin owns its own config schema in its `settings` manifest |

**Provider creds NEVER go in env.** Reasons:

- Pool-model multi-tenancy: one deploy serves hundreds of agencies +
  thousands of clients. Per-tenant env entries don't scale.
- Rotation: per-install config rotates without redeploys.
- Surface area: env leaks via build logs / function bundles; per-
  install config stays scoped + in DB.

### Per-client portal env (per Vercel project)

A Live client's portal ships with its own minimal env at
`04-the-final-portal/clients/<slug>/.env.example`. Template lives at
`scripts/templates/client.env.example`. It carries:

- `NEXT_PUBLIC_AGENCY_ID` / `_CLIENT_ID` / `_PORTAL_SLUG` — tenancy
  pinned at deploy time, read by the client's API proxy.
- `NEXT_PUBLIC_PORTAL_BASE_URL` — pointer back to the shared portal
  for API + auth.
- `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` — separate Sentry project
  per client (cross-project correlation via tags from the shared
  portal's per-tenant breadcrumbs).
- **No provider creds.** Client portal calls back into the shared
  portal's API; the shared portal's foundation reads the right
  tenant's `install.config` and dispatches. Keeps secrets centralised
  + rotatable.

## 4. `@aqua/plugin-domains` — Phase C

Lifted from `02 felicias aqua portal work/src/lib/vercel/server.ts`.
Self-contained plugin at `04-the-final-portal/plugins/domains/`.

| Field | Value |
|-------|-------|
| `id` | `"domains"` |
| `scopePolicy` | `"either"` |
| `core` | `false` (opt-in via marketplace) |
| `category` | `"ops"` |

Domain model:

```ts
DomainRecord {
  id, agencyId, clientId?, hostname,
  vercelProjectId, vercelTeamId?,
  status: "pending" | "verified" | "error",
  pending: DnsRequirement[],
  lastError?, createdAt, updatedAt, lastCheckedAt?, attachedBy?
}
```

Storage: `domains/<id>` + `by-host/<hostname>` index. Scoped reads
by `(agencyId, clientId)` — a single install can hold many domains
across many per-client Vercel projects.

API surface (mounted at `/api/portal/domains/*`):

| Method | Path | Visibility | Purpose |
|--------|------|-----------|---------|
| GET | `status` | viewers | `{ ok, configured }` |
| GET | `list` | viewers | scoped list of attached domains |
| POST | `attach` | admins | `{ hostname, vercelProjectId, vercelTeamId? }` |
| POST | `verify` | admins | `{ id }` re-verify |
| DELETE | `?id=...` | admins | remove |

Vercel REST calls:
- `POST /v10/projects/{id}/domains` — attach
- `POST /v9/projects/{id}/domains/{hostname}/verify`
- `DELETE /v9/projects/{id}/domains/{hostname}`

`attachDomain` treats `409 domain_already_in_use` as success
(operator's intent satisfied). Network errors / non-JSON responses
return `{ ok: false, error }` instead of throwing — handlers care
about happy/sad path, not stack traces.

### Behaviour without VERCEL_TOKEN

The plugin captures the hostname locally, sets status `pending`,
logs `domain.attach.skipped` activity, returns
`{ ok: false, configured: false, error: "vercel-token-not-configured" }`.
The manual-DNS runbook (§"Custom domain runbook" below) still
applies. Verify + remove follow the same shape.

### Smoke results

`npm run smoke` in the plugin folder, 8/8 pass:

- isConfigured = false when VERCEL_TOKEN unset
- attach without token captures hostname + skips API
- attach idempotent on duplicate hostname
- list scopes by agencyId + clientId
- verify on missing record returns not-found
- remove drops the record (no Vercel call when token unset)
- rejects empty hostname
- rejects missing projectId

`npx tsc --noEmit` clean standalone.

### Foundation pending

Mirrors the wire-up of every other T2 plugin:

1. Add `"@aqua/plugin-domains": "file:../plugins/domains"` to
   `04-the-final-portal/portal/package.json`.
2. Append `"@aqua/plugin-domains"` to `transpilePackages` in
   `next.config.ts`.
3. Create `04-the-final-portal/portal/src/plugins/foundation-adapters/domainsFoundation.ts`
   side-effect-import calling `registerDomainsFoundation({...})` with
   foundation port adapters (TenantPort, ActivityLogPort, EventBusPort,
   PluginInstallStorePort).
4. Append the manifest to `04-the-final-portal/portal/src/plugins/_registry.ts`.
5. Extend `ActivityCategory` with `"domains"` so log entries from this
   plugin pass `_validate.ts`.

## 5. Custom domain runbook

For each Live client whose portal is shipping under a custom domain:

### One-time setup per Vercel team (operator)

1. **Generate a Vercel token** with domain-attach access at
   <https://vercel.com/account/tokens>. Scope: the team that owns
   the per-client projects.
2. **Set the token** as `VERCEL_TOKEN` env on the **shared portal**
   Vercel project (where the domains plugin runs). Optionally set
   `VERCEL_TEAM_ID` if the token has multi-team access.
3. **Re-deploy** the shared portal to load the env into the function
   bundle.

### Per-client domain attach

1. **Create the per-client Vercel project.** First-deploy via
   `node scripts/deploy-vercel.mjs --target=clients/<slug>` runs
   `vercel link` interactively; create + select the right team.
2. **Note the project id** — Vercel dashboard → Project → Settings
   → General → "Project ID" (`prj_...`).
3. **In the shared Aqua portal** (agency owner sign-in), navigate
   to `/portal/agency/domains`. Enter the hostname (e.g.
   `luvandker.com`) + the per-client project id from step 2.
4. **The plugin** calls Vercel's API and returns the DNS records
   the operator must add at the registrar (typically a TXT record
   for verification + an A or CNAME for routing).
5. **Operator copies the DNS records** to the client's DNS provider
   (Cloudflare / Namecheap / GoDaddy / etc.). DNS propagation is
   typically 1–60 minutes.
6. **Operator clicks "Re-check verify"** in the portal UI. The
   plugin polls Vercel; on success the status flips to `verified`.

### Without VERCEL_TOKEN (no-API path)

The plugin still records the hostname locally and shows the operator
which Vercel project the domain is meant for. Manual steps:

1. Operator runs `vercel domains add <hostname>` in the per-client
   project's local checkout (after `vercel link`).
2. Operator copies the DNS records Vercel prints back to the
   registrar.
3. Operator runs `vercel domains verify <hostname>` once DNS
   propagates.

The portal's local record stays in `pending` until VERCEL_TOKEN is
set + a verify re-checks.

## 6. Observability wiring — Phase D

Server-side wrapper at
`04-the-final-portal/portal/src/lib/server/observability.ts`.
Captures uncaught errors to Sentry; records duration + status on
every API route via the wrapper; tags every event with per-tenant
breadcrumbs.

### Public API

```ts
captureError(err, breadcrumb?)              // tagged exception
recordBreadcrumb(message, data?)            // free-form trace
withApiObservability(handler, {route, resolveBreadcrumb})
setSessionScope(breadcrumb)                 // request-entry tag
flushObservability(timeoutMs?)              // serverless flush
isObservabilityConfigured()                 // healthcheck
```

`ObservabilityBreadcrumb { agencyId?, clientId?, userId?, pluginId?, extra? }`
becomes Sentry tags + user. Cross-tenant correlation across separate
Sentry projects (e.g. shared portal + each per-client portal) works
via these tags — search by `agencyId:<id>` finds every event for that
tenant regardless of which Sentry project caught it.

### Optional-dep contract

`@sentry/nextjs` is loaded LAZILY via dynamic `import("@sentry/nextjs")`
gated on `SENTRY_DSN`. When the env is unset, every helper is a no-op
— no error if the npm dep isn't installed yet. `console.error` always
fires so dev + Vercel function logs show traces.

To activate Sentry in production:

1. `cd '04-the-final-portal/portal' && npm install @sentry/nextjs`
2. Set `SENTRY_DSN` + `SENTRY_ENVIRONMENT` + `SENTRY_TRACES_SAMPLE_RATE`
   in Vercel project env.
3. Optionally set `NEXT_PUBLIC_SENTRY_DSN` for browser capture.
4. Re-deploy.

No rewire of existing routes required — wrapper is opt-in per route.
Plugins can adopt by importing the helper.

### Vercel Analytics (no env needed)

Independent of Sentry. Operator flips Vercel project dashboard →
Web Analytics → toggle on. Vercel auto-injects `@vercel/analytics`
client scripts at deploy time. No code change. Free for hobby +
included in Pro plan.

We chose Sentry **and** Vercel Analytics because they cover
different surfaces: Sentry catches errors + traces; Analytics
captures page views + Web Vitals without a privacy-impacting
fingerprint. OpenTelemetry deferred to R2 — heavier wire-up, no
immediate need.

### Workspace-dep export for plugins

Foundation-pending. The wrapper currently lives at
`portal/src/lib/server/observability.ts`. Plugins that want to adopt
can:

- Copy-paste the helper signatures (small; depends only on Sentry +
  Web `Request`/`Response`).
- Wait for the orchestrator to lift the helper into a canonical
  workspace package — likely `@aqua/observability` at
  `04-the-final-portal/observability/` — once the plugin contract
  unification round lands.

## 7. Smoke + handoff

### Local

`vercel dev` is not currently part of the dev loop. Local
verification path:

```
cd '04-the-final-portal/portal'
npm install
npm run dev          # T1 R8 wire next.config.ts rewrites for stitch
node ../../scripts/build-portal.mjs    # production-shape build
```

### Production

Operator runs `node scripts/deploy-vercel.mjs --target=portal --prod`
(or via Vercel git integration) once env is set. First run prompts
`vercel link`; pick the existing aqua-portal project.

For each Live client's domain, follow the runbook (§5) once the
per-client project is deployed.

### Cross-team handoffs

- **T1 (foundation)**: env vars `PORTAL_SESSION_SECRET` +
  `DATABASE_URL` are read in T1's startup path (auth.ts +
  storage.ts). Already wired. R6 foundation registry / activity
  category extension are needed when the domains plugin is wired —
  see §4 "Foundation pending".
- **T2 (plugins)**: per-install config remains the home for Stripe
  / Postmark / provider keys. Env is for global agency-level only
  (e.g. `VERCEL_TOKEN` for the domains plugin's API client). Each
  plugin owns its own `config` schema in its manifest.
- **T5 (per-client portal)**: each `clients/<slug>/` deploys as its
  own Vercel project. Custom-domain attach happens AFTER deploy via
  the runbook. Per-client `.env.example` template lives at
  `scripts/templates/client.env.example`.

## 8. Where each artefact landed

T6 R1 had four code-shipping commits + one chapter commit. Two of
them landed under other terminals' messages because of parallel-
staging in the mesh (the chief commander's protocol guidance on
isolating per-terminal stages applies). The actual content is on
main:

| Phase | Commit | Message it landed under | Files |
|-------|--------|------------------------|-------|
| A | `359b476` | T6 R1 Phase A (actual content) | vercel.json + .vercelignore + package.json + scripts/{build-portal,deploy-vercel,templates/*} |
| B | `ef2e82f` | T6 R1 Phase B | portal/.env.example + scripts/templates/client.env.example |
| C | `a943673` | (mislabel) T5 R1 outbox commit | plugins/domains/* full plugin |
| D | `6045568` | T6 R1 Phase D | portal/src/lib/server/observability.ts |
| E | `<this commit>` | T6 R1 Phase E DONE | this chapter + MASTER row + tasks.md row |

Mislabel root cause: another terminal's `git commit` ran with a
swept index that included this terminal's untracked files. Mitigation
for future rounds: prefer `git add <explicit-path>` over `git add
<dir>/`; verify `git diff --cached --stat` before each commit; commit
+ push more frequently to shrink the autostash window.

## 9. Out of scope (R2 candidates)

- **Plugin-domains UI polish** — the v1 admin page is
  intentionally plain (server-rendered list + plain `<form>`). T4's
  UX round will refine forms / focus / loading states.
- **OpenTelemetry tracing** — heavier wire than Sentry; deferred.
- **Sentry Release tracking** — wiring `sentry-cli` + the Vercel
  build to upload sourcemaps + tag deploys. Trivial once `@sentry/
  nextjs` is installed; left to the deploy-time activation step.
- **Per-install Vercel token override** — token rotation per
  agency/client. Foundation-pending: needs per-install secret
  storage, not yet wired.
- **Cron for nightly demo reset** — `GET /api/dev/seed-demo?reset=1`
  scheduling. Touches Vercel cron config + auth gate; tracked in
  tasks.md backlog.
