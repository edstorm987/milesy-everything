/loop

# T1 — Round 003: Live phase — custom portal builder gateway

Architecture extension chapter 19b says: at the **Live phase** each
client gets a **fully custom portal** built by Ed pulling shipped
plugins together. The previous Aqua phases (Epic Intro → Mastery) all
ran on shared / templated portals; Live is where the operator handcrafts.

This round wires the gateway: when a client transitions to Live, the
operator gets a "Build custom portal" CTA + a per-client
`clients/<slug>/` repo materialisation flow that pulls in T2's
portal-export plugin.

## HARD BOUNDARIES

- `04-the-final-portal/milesymedia website/` (T4).
- `04-the-final-portal/business-os/` (T4).
- `04-the-final-portal/clients/compass-coaching/` (shipped — reference).
- `02` + `03` read-only.

## Mandatory pre-read

1. `01 development/context/prior research/04-architecture-extension-per-client-portals.md`
2. Chapter `04-plugin-portal-export.md` (T2 R11).
3. Chapter `04-client-portal-luv-and-ker.md` (T5 R1) — the canonical
   reference target shape.
4. `04-the-final-portal/clients/compass-coaching/` — second reference shape.
5. Your own `04-agency-shell.md` (R1 + R2) for current per-client tabs.

## Scope

**Goal A — Live-phase detection + UI**
- Per-client overview's Phase chip recognises `aqua-mastery` or any
  phase tagged `tier: "live"` and adds a "Live" badge.
- Client header gains "Build custom portal" CTA (primary button) when
  the client is at Live and `clients/<slug>/` does NOT yet exist on disk.
- When `clients/<slug>/` already exists (post-build), CTA becomes
  "Open custom portal" linking to its dev URL or static deploy.

**Goal B — "Build custom portal" wizard**
- Modal walks the operator through: pick which shipped plugins to
  include (checkbox list — pre-checked = currently installed; uncheck
  to omit; can add others), pick a base template (luv-and-ker / compass
  / blank starter), confirm slug.
- On submit, calls `POST /api/portal/portal-export/materialize` (T2 R11)
  with the selected plugin list + template + slug.
- Live progress / streaming or polled status until materialisation
  completes; on done redirects to the per-client overview with the
  "Open custom portal" CTA active.

**Goal C — Per-client Tools picker pre-checks Live recommendation**
- When phase = Live, "+ Add capability" picker shows a "Recommended for
  Live" callout listing the typical Live-stage plugin set (per chapter
  §5a: ecommerce + memberships + affiliates + agency-marketing on top of
  the always-on website-editor + client-crm + forms).
- One-click "Install Live recommended" applies all in one POST.

**Goal D — Smoke + chapter**
- Smoke: Live badge renders, CTA flow happy path against mocked
  portal-export, post-build URL renders correctly, recommended-set
  install applies.
- Chapter `04-agency-shell-live-phase.md`. MASTER row.

## NOT in scope

- Real-time per-client deploy (T6's job).
- Custom domain attach (T6's `@aqua/plugin-domains`).
- Building new plugins.
- Touching milesymedia / business-os.

## When done

DONE referencing `003-live-phase-builder.md`.
