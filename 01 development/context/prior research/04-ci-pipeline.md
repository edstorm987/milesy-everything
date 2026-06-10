# CI pipeline — T6 R002 (GitHub Actions)

T6 R002 ships the GitHub Actions workflows that gate PRs and main
pushes on a clean tsc + smoke run, and post a Vercel preview URL on
every PR. Pure CI/infra round — no `04-the-final-portal/**` edits.

## Files shipped

- `.github/workflows/ci.yml` — typecheck + smoke for the website
  host and a dynamic plugin matrix.
- `.github/workflows/deploy-preview.yml` — PR-only Vercel preview
  deploy (skips cleanly when `VERCEL_TOKEN` is unset).
- `scripts/check-ci-yaml.mjs` — local sanity-check that JSON-parses
  workflow YAML when the optional `yaml` lib is present, otherwise
  falls back to shape regex. NOT a CI prerequisite; it's a pre-push
  smoke for the operator.
- README badge + runbook §1 step #0 ("CI is green").

The pre-existing `.github/workflows/preview-deploy.yml` (older
sibling that pre-dated the unification) is left in place — it
gates on the same `VERCEL_TOKEN` secret and skips cleanly when
unset, so it co-exists harmlessly with `deploy-preview.yml`. A
follow-up round may consolidate.

## ci.yml — shape

- Triggers: `pull_request` + `push: branches: [main]`.
- `concurrency: ci-${{ github.ref }}` with `cancel-in-progress`
  so newer pushes supersede older runs on the same ref.
- Node 20 LTS via `actions/setup-node@v4`. NPM cache via
  `--cache /tmp/npm-cache`.
- Per-job `timeout-minutes: 15`.
- Jobs:
  - `tsc-and-smoke-portal` — `cd 04-the-final-portal/milesymedia-website`,
    `npm install --legacy-peer-deps`, `npx tsc --noEmit`, `npm run smoke`.
  - `discover-plugins` — `git ls-files '04-the-final-portal/plugins/*/package.json'`,
    filters to those with a `scripts.smoke` field, emits a JSON
    array consumed by the matrix below.
  - `tsc-and-smoke-plugins` — matrix from `discover-plugins.outputs.plugins`,
    `fail-fast: false` (one plugin failing doesn't mask others),
    `npm install`, `npx tsc --noEmit`, `npm run smoke`.
  - `ci-summary` — `if: always()`, prints job results, fails if
    portal failed or plugins concretely failed (skipped is OK
    when no plugin has a smoke yet).

## deploy-preview.yml — shape

- Trigger: `pull_request` types `[opened, synchronize, reopened]`.
  NOT main pushes — Vercel's git integration owns prod auto-deploys.
- Gate step inspects `VERCEL_TOKEN` and emits
  `skipped — set VERCEL_TOKEN` when unset (no failure — preview is
  optional).
- Otherwise: `vercel pull --environment=preview` → `vercel build`
  → `vercel deploy --prebuilt`, then `actions/github-script@v7`
  posts the URL as a PR comment.
- Optional secrets `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` are passed
  through `vercel pull` so the CLI links to the right project even
  when `.vercel/` isn't checked into the repo.

## How to extend when a new plugin lands

The matrix is **dynamic** — there is no hand-edited list of plugin
names in `ci.yml`. When T2 (or anyone) ships a new plugin under
`04-the-final-portal/plugins/<id>/`, the next CI run picks it up
automatically *iff*:

1. `04-the-final-portal/plugins/<id>/package.json` exists and is
   tracked by git (so `git ls-files` finds it).
2. That `package.json` declares a `"smoke"` script — typically
   `tsx --test src/__smoke__/<id>.test.ts`.

If both hold, the new plugin appears as a matrix leg
`tsc + smoke (04-the-final-portal/plugins/<id>)` on the next run.
No workflow edit needed.

If a plugin should be **excluded** from CI (e.g. UI-only with no
test surface — looking at you `website-editor`), simply omit the
`smoke` script from its `package.json`. The discover-plugins step
filters those out.

## What Ed needs to set in GitHub repo settings

After this round merges:

1. **Branch protection on `main`** — Settings → Branches → add rule
   for `main`. Require status checks: `tsc + smoke (milesymedia-website)`
   + `CI summary`. Require PR review (1 approver minimum) +
   "require branches up to date".
2. **`VERCEL_TOKEN` secret** — Settings → Secrets and variables →
   Actions → New repository secret. Value = a Vercel personal token
   (vercel.com/account/tokens) scoped to the team that owns the
   `milesymedia-website` project. Without this, `deploy-preview.yml`
   skips cleanly.
3. **Optional: `VERCEL_ORG_ID` + `VERCEL_PROJECT_ID`** — pull these
   from `vercel link`'s `.vercel/project.json` once the project is
   linked. Lets `vercel pull` resolve env without checking `.vercel/`
   into git.
4. **Optional: actions allowlist** — Settings → Actions → General →
   set "Allow actions and reusable workflows" to either "all actions"
   or explicitly `actions/checkout@*`, `actions/setup-node@*`,
   `actions/github-script@*`.

## Q-ASSUMED items in this round

- Repo lives at `github.com/edsworld27/ker-v3` (badge URL hard-codes
  it). Update the badge in root README if Ed renames or transfers.
- Pre-existing `.github/workflows/preview-deploy.yml` stays — same
  semantics, gates on the same secret. Consolidating is post-ship.
- The plugin matrix uses `npm install` (not `npm ci`) because most
  plugin folders don't ship a committed `package-lock.json`. When
  they do, swap to `npm ci` per-plugin (no cross-plugin churn —
  each leg is independent).
- E2E / Playwright deferred per queue scope NOT-in-scope — same
  decision as last round.

## Cross-links

- Chapter #122 — unification (why CI no longer references `portal/`).
- Chapter #163 — deploy runbook rewrite (the local smoke commands
  this CI mirrors).
- Chapter #124 — ship gate (CI green is item #-1, predates every
  other gate).
- T6 R001 (chapter #163) → R002 (this) → R003 (cron flips, deferred)
  → R004 (`@aqua/plugin-domains` activation, deferred).

## DONE

DONE referencing `002-ci-pipeline.md`.
