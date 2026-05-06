/loop

# T6 — Round 2: Real deploy runbook + working custom-domain attach

R1 you shipped Vercel monorepo config + env-var taxonomy +
observability scaffold + chapter `04-deployment-domains-observability.md`
(commits `05dea79` / `359b476` / `ef2e82f` / `6045568` / `b3d7944`).
Round 2: **make it actually work**. R1 was config + scaffolding;
R2 is the runbook the operator (Ed) follows to ship + a
real-domain-attach API client tested against Vercel.

## Working environment

- Repo / local / branch — same as R1.

## Messaging

- **Outbox**: `01 development/messages/terminal-6/to-orchestrator.md`
- **Inbox**: `01 development/messages/terminal-6/from-orchestrator.md`

## Mandatory pre-read

1. Your R1 chapter `04-deployment-domains-observability.md`
2. `01 development/context/prior research/aqua-server-modules.md` — `02`'s domain code (lift target)
3. `04-architecture-extension-per-client-portals.md` (chapter 19b)
4. T1 R8's `04-milesymedia-portal-stitch.md` (when it lands) — your
   prod stitch must match their dev stitch
5. T5 R1+R2 chapters (per-client portals are deploy targets too)

## Scope — four goals

### Goal A: Deploy runbook (operator-facing)

Write `01 development/runbooks/deploy.md` (new folder if needed) —
a step-by-step **operator runbook** Ed follows to ship:
1. Pre-deploy checklist (tsc clean, smoke green, chapter committed).
2. Environment variables (point at your R1 taxonomy doc).
3. Vercel CLI commands (`vercel link`, `vercel env pull`, `vercel deploy`).
4. Per-target steps (shared portal vs per-client portal).
5. Post-deploy verification (curl checks, smoke against deploy URL).
6. Rollback procedure.

### Goal B: Real Vercel domain-attach against test creds

Lift `02`'s domain-attach code per architecture §13. Produce:
- `04-the-final-portal/portal/src/lib/server/vercelDomain.ts` —
  Vercel API client (attach + verify + remove).
- `scripts/attach-domain.mjs` — CLI helper invoked manually with
  `VERCEL_TOKEN` env.
- Smoke against a sandbox Vercel project (or, if no sandbox creds
  available, mock-test the call shape and clearly flag in the
  chapter that real-creds smoke is deferred).

### Goal C: Domain-attach UI plugin (`@aqua/plugin-domains`)

Lightweight plugin at `04-the-final-portal/plugins/domains/`.
`scopePolicy: "either"`. Contains:
- `DomainsListPage` (per-client domain config UI)
- API routes wrapping Goal B's vercelDomain client
- DNS-verify polling helper (UI shows "Pending" → "Active" → "Failed")

Plugin owners (T2's pattern) typically build standalone first; you
build it inline here because deployment infra is your slice.

### Goal D: Smoke + observability check

1. End-to-end smoke: deploy a sandbox app to Vercel + attach a
   sandbox domain + curl it + verify Sentry/Analytics events arrive.
   If creds unavailable, document the manual smoke steps + log
   Q-ASSUMED on the deferred verification.
2. Update chapter `04-deployment-domains-round2.md`:
   - Operator runbook reference.
   - Vercel domain client + sandbox smoke.
   - `@aqua/plugin-domains` shape.
   - Cross-team:
     - T1 R8 chrome shouldn't conflict with your prod rewrites.
     - T5's per-client portals each need a domain attach pre-deploy.
     - T2 R11's export-to-repo should optionally trigger domain
       attach when a Live client has a `customDomain` configured.

## NOT in scope

- Don't actually deploy production — Ed deploys when ready.
- Don't bake real Vercel team / project IDs into the repo — env-only.
- Don't add CI/CD YAML — that's R3+ territory unless trivial.

## Loop discipline

Standard. `<<autonomous-loop-dynamic>>`.

## When done

1. Operator runbook at `01 development/runbooks/deploy.md`.
2. `vercelDomain.ts` + `scripts/attach-domain.mjs` + Goal C plugin.
3. tsc clean.
4. Smoke (real or mocked) documented in chapter.
5. Chapter `04-deployment-domains-round2.md` + MASTER row.
6. tasks.md row done.
7. DONE + COMMIT.
