/loop

# T1 — Agency Shell: Ed's home screen

Ed's directive (2026-05-07): simplify. The product is "Ed logs in → sees
his clients → adds new ones → presses 'New website' → builds it." All the
plugins are already shipped — what's missing is the **agency-side UX shell**
that makes nine plugins feel like one product.

This round redoes `/portal/agency` as Ed's home screen and the per-client
overview that sits behind it.

## Working environment

- **Repo**: https://github.com/edsworld27/ker-v3 (branch `main`).
- **Local**: `~/Desktop/ker-v3/`. Folder `04-the-final-portal/`.
- After every commit: `git pull --rebase --autostash && git push`.
- Local dev server already running on http://localhost:3030.

## HARD BOUNDARIES — do NOT touch

- `04-the-final-portal/milesymedia website/` — Ed owns this.
- `04-the-final-portal/business-os/` — Ed owns this (running on :3034).
- Any file Ed edited in those folders. Use `git log --name-only -10`
  to see Ed's recent T4 commits and steer clear.

If a change you'd like to make crosses into Ed's territory, log Q-BLOCKED
in your outbox and wait.

## Mandatory pre-read

1. `01 development/CLAUDE.md`
2. `01 development/messages/README.md`
3. `01 development/context/MASTER.md`
4. `01 development/context/prior research/04-architecture.md` §3 + §11
5. `01 development/context/prior research/04-architecture-extension-per-client-portals.md`
6. `01 development/eds requirments.md` (Ed's spec — re-read with fresh eyes)
7. `01 development/messages/terminal-1/from-orchestrator.md`
8. Current `04-the-final-portal/portal/src/app/portal/agency/` + `clients/`

## Scope

**Goal A — Ed's home (`/portal/agency`)**
- Top of page: "Welcome back, Ed" + a **single primary CTA: "New client"**.
- Below: a **clients grid** — card per client showing brand mark, name,
  current phase chip, last-activity timestamp, and a hover footer with
  3 quick actions: Open · Edit website · View portal.
- Empty state when no clients yet: friendly placeholder + the "New client"
  CTA centered, no grid.
- Sidebar gets the "ballpark" capabilities Ed asked for (HR, Finance,
  Marketing, Forms, Email, Ops, Domains, Affiliates) under a collapsible
  "Tools" section — discoverable but out of the way. The active row is
  always Clients (the home).

**Goal B — Add-client flow**
- Inline modal from the home CTA. Fields: name, slug (auto from name),
  brand colour, optional logo upload, **phase preset** (Discovery /
  Development / Onboarding / Live — pulled from fulfillment's preset
  table; Live skips presets and lands the operator directly in the
  custom-portal builder per architecture extension).
- Submit calls existing `/api/tenants/seed` or the equivalent, then
  redirects to the new client's overview page.

**Goal C — Per-client overview (`/portal/clients/[clientId]`)**
- One screen, tabbed: **Overview · Website · Portal · Kanban · Finance ·
  Assets · Tools**. Overview shows phase, plugin install summary,
  recent activity. Website + Portal tabs each have a single primary
  CTA ("Edit website" / "Edit portal") that lands in T3's editor with
  the right context loaded. Kanban surfaces T2's kanban plugin (when
  shipped — degrade gracefully). Finance pulls agency-finance per-client
  rollup. Assets surfaces website-editor's Assets page in tab form.
  Tools = the per-client install list with "+ Add capability" picker.
- "+ Add capability" picker: list every installable plugin, current
  install state, one-click install/uninstall via `pluginInstalls.create`/
  `delete`. Pre-installed phase-preset plugins show a chip "from preset".

**Goal D — Smoke + chapter**
- Extend `scripts/smoke.mjs` with: home renders 200 with empty + populated
  states, add-client happy path, per-client overview tab routing.
- Chapter `04-agency-shell.md`. MASTER row.

## NOT in scope

- Touching milesymedia / business-os (HARD BOUNDARY above).
- New plugins.
- Visual redesign of plugin admin pages — leave them alone.
- Auth changes — R9's OAuth + magic-link is enough.

## Loop discipline

Standard. Q-ASSUMED + continue when reasonable. 3 empty wakes → end.

## When done

DONE + COMMIT in outbox; chapter; MASTER row; tasks row.
