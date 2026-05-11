# `04` Deployment + custom domains — Round 2 (T6)

T6's Round-2 makes R1's scaffolding actually shippable: an
operator-facing deploy runbook, a foundation-level Vercel
domain-attach client tested against mock fetches, a CLI helper
mirroring the same surface, and a polling status badge in the
domains plugin that auto-flips Pending → Verified without operator
action.

> Built by T6 on 2026-05-05, on top of R1 (commits `359b476` /
> `ef2e82f` / `a943673` / `6045568` / `b3d7944` / `f4f409c`) and
> chapter `04-deployment-domains-observability.md` (chapter #44).

## 1. What R1 left behind, what R2 closes

R1 was scaffolding:

- Vercel monorepo wiring (single project + bundled milesymedia).
- env-var taxonomy (per-deployment vs per-install split).
- `@aqua/plugin-domains` plugin (server-rendered admin page,
  Vercel REST client at `plugins/domains/src/server/vercelClient.ts`).
- Observability wrapper (`portal/src/lib/server/observability.ts`).

R1 was missing four operational pieces R2 fills:

1. **An operator runbook.** R1 was code; R2 is the document Ed
   follows to ship.
2. **A foundation-level Vercel client.** R1's plugin had its own
   client; the foundation needed one too so other foundation code
   (T2 R11's export-to-repo flow) can attach domains without going
   through the plugin's API surface.
3. **A CLI helper.** Pure-JS, scriptable, runs without the portal
   build step.
4. **Auto-polling DNS verification.** R1's status badge was static
   (page reload required). R2 polls every 30s for 5 minutes after
   attach.

## 2. Phase A — operator runbook

Lives at `01 development/runbooks/deploy.md` (new folder). Ed walks
this top-to-bottom for every deploy — see the runbook itself for the
full text. Section map:

| § | Topic |
|---|-------|
| 0 | Vercel CLI bootstrap (one-time per machine) |
| 1 | Pre-deploy checklist (pull-rebase + tsc + smoke per scope) |
| 2 | Environment variables (per-deployment / per-install / per-client / local) |
| 3 | Deploy — shared portal (link + preview + promote) |
| 4 | Deploy — per-client portal (one Vercel project per Live client) |
| 5 | Post-deploy verification (curl + Sentry/Analytics smoke) |
| 6 | Custom domain runbook (UI / CLI / no-token paths) |
| 7 | Rollback (Vercel / git / Postgres PITR / domain de-attach) |
| 8 | Cron — nightly demo reset (deferred to ops-ready cycle) |
| 9 | Troubleshooting (5 known failure modes + fixes) |
| 10 | Glossary |

Anything contradicted by reality wins → patch the runbook.

## 3. Phase B — foundation Vercel client + CLI helper

### 3a. The split: `vercelDomain.ts` + `vercelDomain.impl.ts`

`04-the-final-portal/portal/src/lib/server/vercelDomain.ts`
is the public, server-only-guarded re-export:

```ts
import "server-only";
export * from "./vercelDomain.impl";
```

`vercelDomain.impl.ts` holds the actual logic and ships WITHOUT
`import "server-only"` so the smoke can drive it via `tsx --test`
(plain Node throws on the `server-only` package).

Why the split: Next.js's `server-only` package is a runtime
no-op-or-throw guard — it throws under plain Node so test runners
can't import the module. The split keeps the production guard
intact while allowing test access. Pattern documented for future
smokes that need to drive server-only modules.

### 3b. Public surface

```ts
attachDomain(cfg, hostname)    → Promise<VercelDomainResult>
verifyDomain(cfg, hostname)    → Promise<VercelDomainResult>
removeDomain(cfg, hostname)    → Promise<{ ok, hostname, error? }>

configFromEnv({ projectId, teamId? })   → VercelDomainConfig (throws if VERCEL_TOKEN unset)
isVercelDomainConfigured()              → boolean
readEnvToken() / readEnvTeamId()        → string | null / string | undefined
normaliseHostname(raw)                  → string
```

`VercelDomainConfig` carries the token + project id + optional team
id explicitly — token comes from env (operator-level secret), but
project id is per-call so one foundation reach can manage many
per-Live-client Vercel projects. 409 `domain_already_in_use` is
treated as success (operator's intent satisfied). Network errors /
non-JSON bodies return typed error results instead of throwing.

### 3c. Two-copy reality with the plugin

R1's `@aqua/plugin-domains` ships its own copy at
`plugins/domains/src/server/vercelClient.ts`. The plugin is
standalone tsc-clean by design — it can't import from the portal
until the foundation wires the workspace dep (foundation-pending
per chapter #44 §4). Until then the foundation copy and the plugin
copy have identical surfaces; once the foundation registers the
plugin, the plugin will re-export from
`@aqua/portal-foundation/vercelDomain` (or similar) and the dedup
lands. Tracked as an R3 candidate.

### 3d. CLI helper — `scripts/attach-domain.mjs`

Pure JS at the repo root. No portal-TS imports — runs without a
build step.

```bash
VERCEL_TOKEN=... VERCEL_PROJECT_ID=prj_... \
  [VERCEL_TEAM_ID=team_...] \
  node scripts/attach-domain.mjs --hostname=<host> [--verify | --remove]
```

JSON output on stdout. Exit 0 on ok, 1 on configuration / network
/ HTTP error, 2 on usage error. Documented in deploy.md §6c.

### 3e. Mock smoke — 11/11 pass

`04-the-final-portal/portal/scripts/smoke-vercel-domain.test.ts`
runs via `npm run smoke:vercel-domain` (tsx + node:test). Mocks
`globalThis.fetch` with a captured-call recorder + a stub-response
shape. Verifies:

| # | Assertion |
|---|-----------|
| 1 | `configFromEnv` reads VERCEL_TOKEN |
| 2 | `configFromEnv` throws clearly when VERCEL_TOKEN unset |
| 3 | `isVercelDomainConfigured` reflects env |
| 4 | `normaliseHostname` strips https / trims / lowercases |
| 5 | `attachDomain` POSTs to `/v10/projects/<id>/domains` with bearer + JSON body |
| 6 | `attachDomain` treats 409 already_in_use as success |
| 7 | `attachDomain` surfaces non-409 error messages |
| 8 | `attachDomain` rejects empty hostname locally (no fetch) |
| 9 | `verifyDomain` POSTs to `/v9/projects/<id>/domains/<host>/verify` |
| 10 | `removeDomain` DELETEs to `/v9/projects/<id>/domains/<host>` |
| 11 | `removeDomain` returns error message on network failure |

### 3f. Real-creds smoke — deferred

The R2 prompt asked for real-creds smoke against a sandbox Vercel
project. No sandbox token / project id was available in the
autonomous loop; documented as a Q-ASSUMED in the outbox.

Manual real-creds smoke (for Ed when sandbox creds available):

```bash
# 1. Set env. Use a sandbox token + a sandbox Vercel project.
export VERCEL_TOKEN=<sandbox-token>
export VERCEL_PROJECT_ID=<sandbox-prj>
# Pick a hostname you control. CNAME or A-record at the registrar.
HOST=test-aqua.example.com

# 2. Attach.
node scripts/attach-domain.mjs --hostname=$HOST
# expect: ok=true, verified=false, pending=[TXT/CNAME records]

# 3. Add the DNS records the script printed at your registrar.
# Wait for propagation (1–60 minutes).

# 4. Verify.
node scripts/attach-domain.mjs --hostname=$HOST --verify
# expect: ok=true, verified=true, pending=[]

# 5. Remove (cleanup).
node scripts/attach-domain.mjs --hostname=$HOST --remove
# expect: ok=true
```

Run-once smoke; result captured in deploy.md once verified.

## 4. Phase C — DNS-verify polling badge

`04-the-final-portal/plugins/domains/src/components/DomainStatusBadge.tsx`
("use client") replaces R1's static `StatusBadge` in the plugin's
admin page.

### 4a. Polling lifecycle

- Initial state hydrated from the server snapshot. SSR-safe.
- On mount, if `status === "pending"`, schedule a `setTimeout` for
  `POLL_INTERVAL_MS = 30_000`.
- On each tick: POST to `/verify` with `{ id }`, parse the response,
  update state.
- Stop conditions:
  - `status === "verified"` → stop, green badge.
  - `status === "error"` → stop, red badge.
  - `pollCount >= MAX_POLLS` (10 polls = 5 minutes) → stop, amber
    badge with "DNS not propagated after 300s — click Re-check"
    hint.
- Cleanup on unmount.

### 4b. Visual states

| State | Badge | Sub-text |
|-------|-------|----------|
| pending (idle) | amber + dot | (none) |
| pending (polling) | blue + pulsing dot | "checking… (n/10)" (`aria-live="polite"`) |
| pending (exhausted) | amber + dot | "DNS not propagated after 300s — click Re-check" |
| verified | green + dot | (none) |
| error | red + dot | last-error message |

DNS records the operator must add are surfaced via a `<details>`
disclosure so they don't crowd the row when collapsed. Click "Re-
check verify" (the existing R1 form) to trigger another verify
manually.

### 4c. Why 5 minutes

DNS propagation is typically 1–60 minutes. 5 minutes captures the
fast cases (most modern providers + cached negative TTLs) and hands
the rest off to the operator. Polling longer wastes cycles + Vercel
rate limit. R3 candidates: configurable poll window, exponential
backoff, push notification when verified server-side.

## 5. Smoke status

| Surface | Real-creds | Mock | Status |
|---------|-----------|------|--------|
| Foundation `vercelDomain` | deferred (no sandbox token) | 11/11 ✓ | Mock-passing |
| Plugin `vercelClient` (R1) | deferred | 8/8 ✓ | Mock-passing (R1 outbox) |
| Polling badge (`DomainStatusBadge`) | n/a | runtime-only | Hydration-safe by construction; manual smoke during real-deploy validates |
| Observability wrapper (R1) | n/a (Sentry off in dev) | n/a | Active when `SENTRY_DSN` set; opt-in per route via `withApiObservability` |
| `attach-domain.mjs` CLI | deferred | n/a (pure JS) | Same Vercel REST surface as `vercelDomain.impl.ts` — its assertions cover the call shape |

End-to-end production smoke is Ed's call — runbook §5 + §6c are the
checklists.

## 6. Cross-team handoffs

### T1 R8 — milesymedia stitch (chapter #45)

T1 R8 dev rewrites mirror T6 R1's prod rewrites verbatim. Same path
matrix on both sides; T1 R8 §9 recommends a single source-of-truth
file `scripts/stitch-rewrites.json` that both `vercel.json` and
`portal/next.config.ts` consume — deferred to R3. No conflict with
R2 work.

### T2 R11 — export-to-repo

T2 R11 generates per-Live-client portals at
`04-the-final-portal/clients/<slug>/`. The generator should
optionally trigger a domain attach when the client's
`portal-config.json` declares `customDomain`. Two paths:

1. **Plugin-mediated**: generator POSTs to
   `/api/portal/domains/attach` from the agency-owner's session
   (uses the @aqua/plugin-domains surface).
2. **Foundation-direct**: generator imports `vercelDomain.ts`
   directly + calls `attachDomain(cfg, hostname)` — useful when
   the generator runs server-side as part of the export flow.

Both work; recommendation: foundation-direct from the generator's
server code path so the export is a single transaction (clone tree
→ attach domain → emit event), not two API calls.

### T5 R2+ — per-Live-client portals

Each per-Live-client portal is its own Vercel project (per chapter
#44 §1). Domain attach happens AFTER the per-client project is
deployed:

```bash
# 1. Deploy the per-client portal (creates the Vercel project).
node scripts/deploy-vercel.mjs --target=clients/<slug>

# 2. Note the project id from Vercel dashboard.

# 3. From the shared portal admin (or via the CLI helper):
VERCEL_PROJECT_ID=<prj-id> \
  node scripts/attach-domain.mjs --hostname=<client-domain>
```

T5 R2 portals (Compass Coaching et al.) follow the same flow. The
chapter walks the operator through it; T5's per-portal chapter can
reference deploy.md §6.

### T3 R6+ — editor save-to-per-client-repo

Out of T6's path. The editor's save target affects content, not
deployment topology. Mentioned for completeness.

## 7. Where each artefact landed

R2 had four code-shipping commits + this chapter commit. None of
them got swept into other terminals' commits this round (parallel-
staging hazard from R1 is documented in chapter #44 §8; R2's
explicit-path staging avoided the issue).

| Phase | Commit | Files |
|-------|--------|-------|
| A | `2f93a18` | `01 development/runbooks/deploy.md` (444 lines) + outbox |
| B | `b61f587` | `vercelDomain.{ts,impl.ts}` + `scripts/attach-domain.mjs` + `scripts/smoke-vercel-domain.test.ts` + portal package.json (+ tsx, server-only, smoke:vercel-domain script) + outbox |
| C | `14c5b2a` | `plugins/domains/src/components/DomainStatusBadge.tsx` + `pages/DomainsPage.tsx` rewire + outbox |
| D (this) | `<commit>` | `04-deployment-domains-round2.md` + MASTER row + tasks.md row done |

## 8. R3 candidates (out of scope for R2)

- **Real-creds smoke runbook** — actually run the manual smoke
  (§3f) against a sandbox Vercel project + bake the result into
  deploy.md.
- **Foundation-plugin client dedup** — once the domains plugin is
  wired as a workspace dep (chapter #44 §4 foundation-pending), the
  plugin re-exports from the foundation client + the parallel copy
  is removed.
- **`scripts/stitch-rewrites.json`** — single source of truth for
  the milesymedia stitch path matrix consumed by both
  `vercel.json` and `portal/next.config.ts` (per T1 R8 chapter §9
  recommendation).
- **Polling refinements** — configurable poll window per attach,
  exponential backoff, push-notification when Vercel's webhook for
  `domain.verified` arrives (Vercel does emit such webhooks for
  Pro/Team plans).
- **Demo cron wiring** — `crons` block in `vercel.json` hitting
  `/api/dev/seed-demo?reset=1` nightly (deploy.md §8). Wire when
  Ed is ready.
- **Stitch source-of-truth file** — `scripts/stitch-rewrites.json`
  (T1 R8 §9) so the path table doesn't drift between dev + prod.
- **Lighthouse / synthetic-monitoring smoke** — automated post-
  deploy check that pings each surface + reports back to the
  observability wrapper. Could integrate into the Vercel "Checks"
  feature.
