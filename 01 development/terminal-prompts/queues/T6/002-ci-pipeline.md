/loop

# T6 — Round 002: CI pipeline — `.github/workflows/`

GitHub Actions workflow that runs on PR + push to main: tsc clean +
all smokes green + plugin smokes. Must pass before Vercel auto-deploys
(set as required check on `main` branch protection — operator does the
GitHub side).

## Pre-read

- T6 R001 deploy runbook (where smoke commands live).
- Existing `package.json` smoke scripts across all plugins +
  milesymedia-website root.

## Scope

**A** — `.github/workflows/ci.yml`:
- Triggers: pull_request + push to main.
- Node 20 LTS.
- Steps: checkout · setup-node · npm ci (root) · npm ci per plugin
  changed · `npx tsc --noEmit` per project · `npm run smoke` per
  project · summary line.
- Concurrency: cancel-in-progress per ref.
- Timeout 15min.

**B** — Plugin matrix: dynamic-detect changed plugins via
`git diff --name-only` against base branch; only run smokes for
changed plugins (default-branch run does all). Reduces PR feedback
time.

**C** — Status badge added to root `README.md` (if exists) so
contributors see pass/fail at a glance.

**D** — `.github/workflows/deploy-preview.yml` — separate workflow
that runs on PR open and deploys a Vercel preview via `--token`
(reads `VERCEL_TOKEN` secret). Comments preview URL on the PR.

**E** — Chapter `04-ci-pipeline.md` with the workflow files'
intent + how to extend when new plugins land.

## NOT in scope

- Running E2E tests (post-ship — Playwright config + auth fixtures
  is heavier than v1 needs).
- Per-plugin workflow files (one ci.yml is enough).
- Required-status enforcement on main (operator GitHub action).

## When done
DONE referencing `002-ci-pipeline.md`.
