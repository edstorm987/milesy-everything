/loop

# T6 — Round 1: Production deployment + custom domains + observability

You are **terminal 6**, joining the mesh fresh. T1/T2/T3 have shipped
the foundation, plugins, editor; T4 polishes UX; T5 builds the first
real client portal. Your round 1 mandate: **wire production
infrastructure** so we can ship to Vercel, attach custom domains,
and keep an eye on what's running. Everything you build here is
config + tooling — no product code.

## Working environment

- **Repo**: https://github.com/edsworld27/ker-v3
- **Local**: `~/Desktop/ker-v3/`
- **Branch**: `main`. `git pull --rebase --autostash && git push` after each commit.
- Top-level folders contain spaces — quote them.

## Messaging

- **Outbox**: `01 development/messages/terminal-6/to-orchestrator.md`
- **Inbox**: `01 development/messages/terminal-6/from-orchestrator.md`
- Don't stop on questions; log `Q-ASSUMED`. Only stop on `Q-BLOCKED`.

## Mandatory pre-read

1. `01 development/CLAUDE.md` (Mode A — terminal mesh)
2. `01 development/messages/README.md` (mesh protocol)
3. `01 development/context/MASTER.md` (chapter index)
4. `01 development/context/prior research/04-architecture.md` — locked v1
5. `01 development/context/prior research/04-architecture-extension-per-client-portals.md` — chapter 19b (your operating spec for the multi-app monorepo deploy)
6. `01 development/eds requirments.md`
7. `01 development/context/prior research/04-milesymedia-demo.md` — T1 R4 (Vercel deploy already pinned to static site only)
8. Repo root `vercel.json` — current state
9. `01 development/context/prior research/aqua-server-modules.md` §"custom-domain provisioning" — `02`'s code Ed mentioned can be lifted

## Scope — five phases

### Phase A: Vercel monorepo project config

Per chapter 19b, **a single Vercel project** deploys:
- `04 the final portal/milesymedia website/` at root paths (`/`,
  `/login.html`, `/admin.html`, `/styles.css`, ...).
- `04 the final portal/portal/` (Aqua portal Next.js app) at
  `/portal/*` + `/api/*` + `/login` + `/demo` + `/embed/*`.
- `04 the final portal/clients/<slug>/` — each Live client's portal
  on its own custom domain (with edge stitching).

T1 R8 (queued — `T1-round8-milesymedia-portal-stitch.md`) will write
the Next.js rewrites for **localhost dev**. Your job is the **Vercel
production** equivalent + the per-client deployments.

1. Update root `vercel.json` (currently pinned to milesymedia static
   only) to:
   - Build `04 the final portal/portal/` as the primary Next.js
     project (set `rootDirectory` correctly).
   - Add a `rewrites` rule that, when no Next.js route matches,
     falls through to a sibling static deployment of milesymedia OR
     embeds milesymedia's static files directly. Decide based on
     Vercel's monorepo support; log `Q-ASSUMED` if unclear.
   - Per-client portals (`clients/<slug>/`) deploy as separate
     Vercel projects in the same Vercel team. They each have their
     own custom domain. Document this as the recommended pattern
     vs trying to nest them all under one project.

2. Add a deploy-orchestration script
   (`scripts/deploy-vercel.mjs`) that, given `--target=portal` or
   `--target=clients/<slug>`, runs the right Vercel CLI commands
   (assumes operator has `vercel login` done locally — the script
   doesn't manage credentials).

### Phase B: Environment variables management

Each deployment target needs:
- `DATABASE_URL` (T1 R7 Postgres)
- `STORAGE_BACKEND` (file | postgres)
- `LK_SESSION_SECRET` (HMAC cookie key)
- Plugin-specific keys (Stripe, Postmark, etc) live in per-install
  config — NOT env. But provider creds for the global agency might
  go in env per architecture decision.
- `NEXT_PUBLIC_PORTAL_BASE` (public-facing portal origin)

Write `04 the final portal/portal/.env.example` (extending what's
there) + `clients/<slug>/.env.example` template.

Document in chapter: **what's per-deployment env vs per-install
config** — clear separation rules so future plugins don't leak
secrets into env.

### Phase C: Custom domain attachment

Lift `02 felicias aqua portal work/`'s domain code (per
architecture §13 parked item, "the code is in `02`, just not
wired"). Specifically:
- Vercel API client that, given an agency's API token + a domain
  string + a target Vercel project, attaches the domain.
- DNS verification flow (operator copies the TXT record into their
  registrar; portal polls until verified).
- Agency-side admin UI lives in fulfillment plugin's marketplace OR a
  new tiny plugin `@aqua/plugin-domains` (decide which — log a
  `Q-ASSUMED`; my preference: a new tiny plugin so domain logic is
  self-contained, mirrors your other plugin patterns).

For v1, ship the API client + verification flow + a manual operator
runbook. Wiring it into a UI can happen in R2 if time runs out.

### Phase D: Observability

Pick one (decide based on Vercel friction):
- **Sentry** — error tracking. Wire `@sentry/nextjs`. Per-deployment
  DSN via env.
- **Vercel Analytics** — already free with Vercel; just opt in.
- **OpenTelemetry traces** — heavier; defer to R2 unless trivial.

Write a small observability layer at
`04 the final portal/portal/src/lib/server/observability.ts` that:
- Captures uncaught errors → Sentry.
- Records request-level metrics (duration, status code) on every API
  route via a wrapper.
- Per-tenant breadcrumb tagging (every captured event includes
  `agencyId` + `clientId` if available).

Same wrapper exported as a workspace dep for plugins to adopt
(but don't force them — opt-in).

### Phase E: Smoke + chapter

1. `vercel dev` (if available locally) brings up the stitched
   project. If not, document the Vercel-side deployment runbook + a
   localhost equivalent run via T1 R8's `dev:all` script.
2. Smoke a custom-domain attach against a sandbox Vercel project (or
   document the call shape clearly if no test creds available).
3. Sentry / Analytics opt-in confirmed working in a test environment
   (or documented + flagged for ops).
4. Chapter `04-deployment-domains-observability.md` documenting:
   - Vercel monorepo config decisions.
   - Env var taxonomy (per-deployment vs per-install).
   - Custom domain runbook.
   - Observability wiring + per-tenant breadcrumbs.
   - Cross-team handoffs:
     - T1: `LK_SESSION_SECRET` + `DATABASE_URL` env wiring in their
       startup path.
     - T2: per-install config remains the home for Stripe / Postmark /
       provider keys; env is for global agency-level only.
     - T5: each `clients/<slug>/` deploys as its own Vercel project;
       custom-domain attach happens after deploy.
5. MASTER row.
6. `tasks.md` row done.
7. Final `DONE` + `COMMIT`.

## Authority + scope discipline

You CAN edit:
- `vercel.json` (root) + per-deployment `vercel.json` files
- `.env.example` files anywhere
- `scripts/*` (new tooling)
- `04 the final portal/portal/src/lib/server/observability.ts` (new)
- `04 the final portal/plugins/domains/` if you decide to ship the
  domain plugin (your call — log Q-ASSUMED on the structure)
- Chapter docs

You must NOT:
- Edit foundation server modules (T1's territory).
- Edit existing plugin source — if observability needs a hook in a
  plugin, expose it as an opt-in import; don't rewire the plugin.
- Edit T5's `clients/luv-and-ker/` — that's their build; you may
  configure the deploy target but not the source.
- Edit T4's UX work.
- Push secrets or real API keys into the repo. Anything sensitive
  goes in `.env.example` as placeholder only.

## Loop discipline

Each cycle: pull → read inbox + outbox → progress → commit → push →
append `COMMIT` → `ScheduleWakeup` with `<<autonomous-loop-dynamic>>`.
Mid-task 600–900s, fully DONE 1500s, 3 empty wakes → omit ScheduleWakeup
to end. Phase A is biggest (Vercel config + monorepo decisions).

## When done

1. Vercel config supports the stitched deploy.
2. Env taxonomy documented + `.env.example` files exist.
3. Custom-domain attach API client lifted + runbook written.
4. Observability wired (at least one of Sentry / Vercel Analytics).
5. Chapter `04-deployment-domains-observability.md` written.
6. MASTER row.
7. `tasks.md` row done.
8. `tsc --noEmit` clean.
9. Final `DONE` + `COMMIT` to outbox.

If the full pass takes more than one loop, partial DONE is fine.
Real production deploy doesn't happen in this round — Ed deploys
when ready. Your job is to make ready.
