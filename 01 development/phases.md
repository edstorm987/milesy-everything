# Phases

## Phase 0 — Prior research ✅
Mapped every file in `02 felicias aqua portal work/` and `03 old portal/`.
Output: 18 chapters in `01 development/context/prior research/` indexed in
`MASTER.md`. The next session can load both codebases off-by-heart from the
chapters alone.

## Phase 1 — Architecture for `04-the-final-portal/` (in progress)
Lock in the architecture: audience tiers, URL surface, role hierarchy,
folder layout. Decide what gets ported from `02` (directly), what's
recreated from `03` (as plugins), and what's net-new.

**Locked decisions** (from Ed's directive 2026-05-04):
- Build `04-the-final-portal/portal/` as the new app — Next.js + plugin model from `02`.
- **Pre-vetted plugins to drop in from `02`**: website editor + ecommerce.
- Build by plugins (so future features = new plugin folders in `04-the-final-portal/plugins/`).
- Three audiences: agency staff (Ed's team), clients (Felicia-style), end customers (per-client storefronts + iframe-embedded login).
- Total customisation per client: brand kit, plugin set, portal variants — all per-client.
- Recursive: each client's portal can itself host customer-facing portals (iframe-embedded, branded). Same machinery at every level.
- First feature slice: **fulfillment** — team creates client → selects phase preset (Discovery / Design / Onboarding / Live etc.) → installs plugins per client.
- Final UX: Milesy Media website hosts a login + Demo button → drops operator into the portal.

## Phase 2 — Foundation
Auth + role hierarchy + multi-tenancy schema in `04/portal/`. Plugin scaffold.
First runnable shell.

## Phase 3 — Fulfillment slice
Team-side: create client + pick phase preset + install plugins per client.
Recreate `03`'s `FulfilmentBrief` + `FulfilmentDeliverable` + `BriefAssignment`
as a `fulfillment` plugin in `04`.

## Phase 4 — Pre-vetted plugins
Port the **website editor** + **ecommerce** plugins from `02` into `04/plugins/`.

## Phase 5 — Client portal customisation
Per-client brand kit + portal variants (login / dashboard / orders / etc.) drive
the client-facing experience. Stage + role + installed plugins decide what's
shown.

## Phase 6 — Recursive portals (clients' customers)
Iframe-embed-style login + portal for each client's end customers, branded
to the client. Same portal-variant + brand-kit machinery as the client portal,
nested one level.

## Phase 7 — Feature plugins ✅ (largely shipped)
agency-hr / agency-finance / agency-marketing / agency-ops / agency-domains /
agency-resources / agency-payroll / aqua-resources / client-crm / client-tasks /
client-files / pre-sales-hq / activity-inbox / credentials-vault / notifications /
bookings / integrations / support-desk / website-editor (28 rounds of maturity) /
ecommerce / memberships / affiliates / forms / sops / kanban / email-sender /
portal-export — all shipped as plugins per Ed's "every feature is a plugin" rule.

## Phase 8 — Unification ✅ (2026-05-07)
**Single Next.js host at `04-the-final-portal/milesymedia-website/`.**
All 5 staged steps shipped + 8 follow-up polish commits (chapters #122
+ #123). SiteShell canonical chrome, persona-chooser pattern across
/signup /demo /dev/pov, Resources mega-menu + Resource Finder.
Founder seed wired, single :3030 origin, all surfaces live.

## ▶ SHIP — Sprint 1, 2, 3 (chapter #124 is canonical)

After Phase 8 unification, planning shifted from open-ended phases to
**three week-long sprints with a hard ship gate**. Read chapter #124
`04-ship-plan-v1.md` for the full breakdown — six workstreams
(WS-A auth completion · WS-B public funnel · WS-C multi-agency core ·
WS-D real-data wiring · WS-E production hardening · WS-F first real
client) sequenced across the sprints.

The phases below survive as **post-ship roadmap** — work that lights
up after v1 is live and serving Felicia.

## Phase 9+ — Post-ship roadmap

These were originally planned as Phases 9-11 but are now post-ship
work — listed here for continuity, not active sprint planning.

### Resources nav + tools (was Phase 10)
Public tools (rank-my-xyz, future bespoke ones) under `public/tools/`
or via `@aqua/plugin-resource-tools-base`. Same lead-capture pattern
as HC. WS-B R023 in chapter #124 lands the first one
(rank-my-website); the rest are post-ship.

### Production hardening — full T6 (was Phase 11)
Real money flow (Stripe charges + tax + payouts), custom-domain
provisioning per client (`@aqua/plugin-domains` activated), full
observability (logs / metrics / alerts), CI/CD pipeline. WS-E in
chapter #124 lands the v1 hardening; the rest unlocks at scale.

## Phase 12 — Multi-agency master/satellite (chapter #123)
Milesy Media as **master**; niche agencies (AquaOasis-web for
therapists, etc.) as **tenants** on the same backend. Each agency owns
its marketing front, brand kit, lead-magnet pack, plugin set, and
employee pool. Ed-as-master flips between agencies via a Topbar
switcher.

Architectural fit is already there (agencies are first-class tenants;
plugins toggleable per agency; brand kits per-agency). Gaps to close
in 5 small rounds:
1. Multi-agency users (`agencyIds[]` instead of single `agencyId`).
2. Agency switcher in Topbar (re-issues session cookie).
3. Per-agency marketing front (host-header routing —
   `aquaoasis-web.com` resolves to agency by domain, same Next.js host
   renders branded shell).
4. Per-agency lead-magnet pack (`public/agencies/<slug>/health-check/`).
5. Prompt-driven agency spawner (CLI / admin button generates brand
   pack + lead magnet + starting copy).

Suggested staging: Round 1 = items #1+#2 (multi-agency core proven
end-to-end inside portal). Round 2 = #3 (domain-aware marketing).
Round 3 = #4+#5. None of this requires undoing the unification work.

## Operating mode (chief commander pattern)
Ed runs 4 active Claude terminals on Opus 4.7 (T1 foundation, T2
plugins, T3 website-editor, T4 ecosystem/manual) plus a chief commander
session. Commander coordinates via append-only logs at
`01 development/messages/`. T4 currently in manual pair-programming
mode with Ed for the unification phase; T1/T2/T3 paused via HOLD
notice during the move.
