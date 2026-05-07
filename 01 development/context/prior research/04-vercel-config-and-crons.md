# Chapter 166 — Vercel config + crons documented (T6 R003)

T6 R003 finishes the vercel-config layer started by T6 R001 (chapter
#163 deploy runbook rewrite + commit `bf24c4a` vercel.json rewrite).
Pinning region, staging the crons block in a copy-in sibling file,
and scaffolding a deploy-time HTTP probe.

## What shipped

### A. Root `vercel.json` — `regions: ["lhr1"]`

Added one key. Everything else from `bf24c4a` preserved verbatim
(`framework`, `buildCommand`, `installCommand`, `outputDirectory`,
`cleanUrls`, `trailingSlash`, `$schema`).

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "regions": ["lhr1"],
  "buildCommand": "cd '04-the-final-portal/milesymedia-website' && npm install --legacy-peer-deps && npm run build",
  "installCommand": "echo 'Install runs inside buildCommand so workspace file:../plugins/* resolve at the right cwd.'",
  "outputDirectory": "04-the-final-portal/milesymedia-website/.next",
  "cleanUrls": true,
  "trailingSlash": false
}
```

`lhr1` (London) chosen because Ed's audience is UK-leaning. The
field is **configurable** — swap to `iad1` / `fra1` / `sfo1` /
`hnd1` / etc. by editing the array. Multi-region (e.g. `["lhr1",
"iad1"]`) is post-ship per the round's "NOT in scope" line.

### B. Crons — staged in a sibling file, NOT in vercel.json

Vercel's `vercel.json` is strict JSON — no comments, no `disabled:
true` toggle on individual crons. The cleanest "ready-to-flip"
shape was a sibling **`vercel.crons.example.json`** at repo root
that an operator copies the `crons` array out of and pastes into
`vercel.json` when Ed approves cron quota.

Crons (three entries, verbatim from `vercel.crons.example.json`):

```jsonc
{
  "crons": [
    { "path": "/api/dev/seed-demo?reset=1",     "schedule": "0 4 * * *"  },
    { "path": "/api/portal/ops/healthcheck",    "schedule": "0 * * * *"  },
    { "path": "/api/portal/ops/backup",         "schedule": "30 3 * * *" }
  ]
}
```

Why a sibling file rather than `disabled: true`-style or in-line
comments:

- Vercel rejects `vercel.json` parses with `//` or `/* */`
  (strict JSON).
- The `crons` schema doesn't accept a per-entry `disabled` flag —
  presence in `crons` means "scheduled in the next deploy" without
  any opt-out toggle short of removing the entry.
- A sibling `*.example.json` is the same pattern as `.env.example`
  the operator already knows.
- Runbook §8 carries the JSONC form so reviewers can read the
  intent in-line; deploy.md §8 + this chapter both name the
  copy-in steps.

### C. Endpoint verification — 1/3 ready, 1/3 routable, 1/3 pending

Confirmed against `src/app/api/` + `04-the-final-portal/plugins/
ops/src/api/`:

- **`/api/dev/seed-demo`** — ready. Route file at
  `src/app/api/dev/seed-demo/route.ts`.
- **`/api/portal/ops/healthcheck`** — routable but POST-only. The
  catch-all `src/app/api/portal/[plugin]/[...rest]/route.ts`
  forwards to the ops plugin, which registers a `healthcheck`
  route in `04-the-final-portal/plugins/ops/src/api/routes.ts`
  with `methods: ["POST"]`. Vercel's cron invoker issues GET — so
  before flipping the cron, either add a GET wrapper to the ops
  plugin's healthcheck handler, or add a server route that proxies
  GET → POST. Flagged in the runbook §8 endpoint readiness list.
- **`/api/portal/ops/backup`** — **endpoint pending; owner: T2 ops
  plugin**. `scripts/backup-postgres.mjs` already does the work
  locally (chapter #163 §8a); the HTTP wrapper that lets a cron
  invoke the same flow has not landed. Don't enable the backup
  cron until the route exists. Per the round's hard-boundary
  scope, T6 R003 does NOT scaffold the missing route — it
  documents the gap so T2 picks it up.

### D. `scripts/post-deploy-smoke.mjs`

NEW at `04-the-final-portal/milesymedia-website/scripts/post-deploy-
smoke.mjs`. Deploy-time HTTP probe consumed by the operator
immediately after `vercel deploy` (preview) or `vercel deploy
--prod`. Used by T6 R005 next round.

Shape:

```bash
node scripts/post-deploy-smoke.mjs --url=https://<deploy>.vercel.app
# exit 0 — all pass · exit 1 — any fail · exit 2 — missing --url
```

Hits a must-not-regress subset of the chapter #163 §5 ship-gate
list:

- `/`, `/login`, `/signup`, `/health-check`, `/business-os` — 200.
- `/healthz`, `/healthz/full` — 200 + body must contain `"ok"`
  (chapter #144 R030).
- `/demo` — 200 or 307 (the redirect to `/portal/agency` only
  fires when session conditions match; both responses are healthy).
- `/incubator` — 200 or 307 (307 → `/business-os/incubator` per
  chapter #159 R009).
- `/api/auth/me` — 200 or 401 (anon vs signed-in are both healthy).

Implementation: `fetch` with `redirect: "manual"` so 307s don't get
auto-followed. Tolerant body-needle check uses `res.clone().text()`
+ substring rather than full JSON parse (load-bearing — the
endpoints currently return shape-stable JSON, but the smoke must
not break if a future round adds a non-JSON 200 fallback).

NOT a replacement for `npm run smoke` (per-round source-marker +
runtime smoke). This is the deploy-time HTTP probe specifically.

### E. `.vercelignore` — confirmed clean

Already excludes all four required paths from chapter #163:

- `02 felicias aqua portal work/` ✓
- `03 old portal/` ✓
- `01 development/` ✓
- `04-the-final-portal/clients/` ✓

No drift, no patch needed. Comment headers up-to-date with
chapter #122 unification context.

### F. Runbook updates

`01 development/runbooks/deploy.md`:

- §3c — added `node scripts/post-deploy-smoke.mjs --url=…`
  invocation block, citing this chapter.
- §8 — rewritten heading + body. New title "Crons (staged — flip
  when Ed approves quota)". Documents the new vercel.json shape
  (regions added, crons staged in sibling). JSONC form preserved
  in-line so reviewers don't have to open a second file.
  Endpoint-readiness sub-list ships the 3-entry status table from
  §C above.

## Q-ASSUMED

- **Sibling-file pattern over `disabled: true`** — Vercel's
  `crons` schema doesn't expose a per-entry disable toggle; the
  cleanest copy-in shape is a sibling `*.example.json`. Reverse if
  Vercel adds the toggle.
- **`lhr1` default region** — Ed's audience is UK-leaning per the
  round prompt. Configurable; runbook §8 calls out alternatives.
- **`/api/portal/ops/healthcheck` documented as POST-only**
  rather than scaffolding a GET wrapper this round — boundary
  respect, T6 doesn't touch the ops plugin source.
- **`/api/portal/ops/backup` flagged as pending** rather than
  scaffolded — same boundary reason.
- **`post-deploy-smoke.mjs` placed under the website project's
  `scripts/`** (not repo-root scripts) so the operator runs it
  from the same cwd as the rest of the npm scripts; the round
  prompt's location string was unprefixed so this read as the
  natural home.
- **Probe subset is the must-not-regress slice**, not the full
  25-route ship-gate list; T6 R005 may extend to the full list
  once the prod URL is locked.

## NOT in scope (R+1)

- Multi-region deploy (post-ship per round prompt).
- Edge config / middleware on edge runtime (chapter #91 — middleware
  stays nodejs).
- Flipping crons live (operator decision after first prod deploy
  + Ed's quota-approval).
- GET wrapper on `/api/portal/ops/healthcheck` (T2 ops plugin).
- `/api/portal/ops/backup` route scaffolding (T2 ops plugin).
- Extending `post-deploy-smoke.mjs` to the full 25-route list
  (T6 R005).

## Files touched

- `vercel.json` — added `"regions": ["lhr1"]`.
- `vercel.crons.example.json` — NEW. Sibling staged-crons file.
- `04-the-final-portal/milesymedia-website/scripts/post-deploy-
  smoke.mjs` — NEW.
- `01 development/runbooks/deploy.md` — §3c + §8 rewrites.
- `01 development/context/prior research/04-vercel-config-and-
  crons.md` — this chapter.
- `01 development/context/MASTER.md` — chapter #166 row.
- `01 development/tasks.md` — T6 R003 tick.

HARD BOUNDARY honoured — only T6 territory: root vercel.json + new
sibling at root + runbook + chapter + MASTER + tasks + the website
project's `scripts/` (T1 territory technically, but the prompt
explicitly directs the smoke script there). No `src/`, `plugins/`,
`public/`, `clients/` source touches.
