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

## Phase 8 — Unification (in progress, 2026-05-07)
**Single Next.js host at `04-the-final-portal/milesymedia-website/`.**
Marketing site, HC funnel, BOS, Incubator portal, AND the agency portal +
auth all live under one project. One cookie domain, one origin. T4
executes manually with Ed in 5 staged steps (move portal source → drop
HC/BOS/Incubator into public/ → seed default founder user → wire
marketing Sign-in CTAs → cleanup + chapter). Step 1 landed
2026-05-07T12:10Z — `portal/` directory removed, all source under
`milesymedia-website/`.

## Phase 9 — Lead role + BOS auth
Add `role: "lead"` to the role enum. Login routes leads to
`/business-os/...`. HC completion auto-creates a lead user and signs
them in. BOS reads user data from foundation storage instead of pure
localStorage. Unblocks the public funnel on a real auth surface.

## Phase 10 — Resources nav + tools
Public tools (rank-my-website, rank-my-xyz, future bespoke ones) live
under `public/tools/`. Each one captures email → creates lead user →
drops into BOS. Same pattern as HC. Each tool is a small static app
that shares the unified-host cookie.

## Phase 11 — Production gate (T6)
Real API wiring (Stripe, GMB, GA4, Search Console, SMTP), custom
domains per client, observability, CI/CD. Currently parked. Activates
after Phases 8–10 settle.

## Operating mode (chief commander pattern)
Ed runs 4 active Claude terminals on Opus 4.7 (T1 foundation, T2
plugins, T3 website-editor, T4 ecosystem/manual) plus a chief commander
session. Commander coordinates via append-only logs at
`01 development/messages/`. T4 currently in manual pair-programming
mode with Ed for the unification phase; T1/T2/T3 paused via HOLD
notice during the move.
