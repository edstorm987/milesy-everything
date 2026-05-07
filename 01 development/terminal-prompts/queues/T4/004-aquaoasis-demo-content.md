/loop

# T4 — Round 004: AquaOasis Demo content pack

T1 R026 (chapter #133) seeded the AquaOasis Demo agency with
teal/heritage-lite brand kit + 3 plugin installs. When Ed flips the
Topbar agency switcher to AquaOasis, what does he see? Right now:
empty plugin pages. This round seeds content so the demo agency
actually feels alive — proves the multi-agency master/satellite
vision (chapter #123 §"Multi-agency vision").

## Pre-read

- Chapter #123 §"Multi-agency vision" (the why).
- Chapter #133 (T1 R026) §"Seed shape" — what brand kit + plugins
  AquaOasis carries today.
- The AquaOasis seed file at
  `src/lib/server/aquaOasisSeed.ts` (T1 territory — DO NOT EDIT;
  this round adds *content* via the existing plugin admin surfaces /
  storage adapter, not via touching the seed).

## Scope

**A** — A second seed module
`src/lib/server/aquaOasisDemoContent.ts` (or co-located in your
territory if T1's lib/server is restricted — check on first read; if
restricted, place under
`src/app/(seeds)/aquaOasisDemoContent.ts` or similar). Idempotent —
runs once per agency, marked via metadata flag.

**B** — Seed shape:
- 3 demo "clients" for AquaOasis (sample therapist names — clearly
  marked DEMO-* slugs).
- Each client gets:
  - A brand kit (heritage / coastal / studio pastels — 3 distinct
    flavours).
  - 5 client-crm contacts each.
  - 8-12 booking events spread over the next 30 days.
  - 3 marketing leads each.
- AquaOasis-level: 4 agency-marketing campaigns (DEMO seeded).

**C** — Wire into the founder seed flow so demo content lands when
AquaOasis seed runs (not on every boot — feature-flag via
`seedAquaOasisContent` exported boolean default `true` in dev,
`false` in `NODE_ENV=production`).

**D** — Smoke checklist (manual): flip to AquaOasis in the Topbar
agency switcher → /portal/agency shows clients grid populated → each
client tile clickable → CRM tab shows seeded contacts → bookings tab
shows seeded events → marketing tab shows seeded leads.

**E** — Chapter `04-aquaoasis-demo-content.md` + MASTER row.

## NOT in scope

- Real client data (this is demo only — must be clearly marked).
- AquaOasis marketing front (Phase 12 R3 — domain-aware marketing,
  post-ship).
- Per-agency lead-magnet pack (Phase 12 R4, post-ship).
- Editing T1's `aquaOasisSeed.ts` — that's the agency record + brand
  kit + plugin install seed; this round seeds *data into* the seeded
  installs, not the installs themselves.

## When done
DONE referencing `004-aquaoasis-demo-content.md`.
