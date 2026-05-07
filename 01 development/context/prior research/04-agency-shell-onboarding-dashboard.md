# `04` Agency Shell — Onboarding Dashboard (T1 R6)

> Authored 2026-05-07. Ports the old portal's `OnboardingDashboardView`
> (chapter §12 deferred list) to the per-client overview, painted in
> Aqua's six-phase shape (Epic Intro → Mastery) with per-phase
> milestone deliverables and an "advance" gate.

## Files touched

- `portal/src/lib/server/onboardingMilestones.ts` (NEW)
  - `AQUA_PHASE_ORDER` — six aqua-* stage ids in canonical order.
  - `AQUA_MILESTONES` — per-phase milestone seed (Epic Intro:
    welcome / discovery / gift; Blueprint: brand-audit / system-form
    / playbook; Diagnostics: foundations / website-draft; Brand:
    logo-colours / verification / photography; Traffic: first-ad /
    first-lead / first-sale; Mastery: 100-reviews / 200-reviews /
    retainer). Non-Aqua stages map to empty arrays so the panel
    auto-hides when the dashboard isn't applicable.
  - `getMilestoneState(client, phaseStage)` — merges seed × stored,
    returning a fresh array even when nothing has been ticked yet.
  - `isPhaseComplete(client, phaseStage)` — true iff seed list is
    non-empty AND every milestone is done.
  - `tickMilestone(current, phaseStage, mid, done)` — pure merge,
    callers persist via `updateClient`.
- `portal/src/app/api/tenants/onboarding-tick/route.ts` (NEW)
  - `POST {clientId, phaseStage, milestoneId, done}` — gated by
    `requireRoleForClient(AGENCY_ROLES)`; validates `phaseStage` is
    Aqua + `milestoneId` exists in the seed; persists via
    `updateClient(metadata: { onboardingProgress })`. 400 on
    invalid input, 404 on unknown client, 500 on update failure.
- `portal/src/app/portal/clients/[clientId]/_OnboardingDashboardPanel.tsx` (NEW)
  - Client component. Six chips horizontal (sm 2-col → 6-col on md);
    palette = complete:emerald · active:brand-primary highlighted +
    bold · future:muted. Each chip carries a "{done}/{total}"
    progress glyph. Click chip → toggles the expanded deliverables
    pane (default: current stage open).
  - Deliverables pane: checkbox per milestone fires
    `POST /api/tenants/onboarding-tick` with optimistic
    `router.refresh()`. Active phase chip carries a
    "Mark phase complete → advance" button gated on `allComplete`,
    POSTs `/api/portal/fulfillment/phase/advance` with the resolved
    `fromPhaseId/toPhaseId` (phase definition ids per agency, not
    the stage enum).
- `portal/src/app/portal/clients/[clientId]/page.tsx`
  - Imports the panel + helpers. New IIFE block above the existing
    `tab === "overview"` grid; renders only when
    `isAquaStage(client.stage)`. Sorts the agency's PhaseDefinitions
    by `AQUA_PHASE_ORDER` to guarantee Epic Intro → Mastery left-to-
    right regardless of the agency's stored `order` field.
- `portal/scripts/smoke.mjs`
  - NEW `§ Onboarding dashboard` block: Aqua-stage client overview
    shows panel testid + heading; tick endpoint 200; unknown-milestone
    400; legacy-stage client overview omits panel.

## Storage shape

```ts
client.metadata.onboardingProgress: Partial<Record<ClientStage, [
  { id: string; done: boolean; doneAt?: number }
]>>
```

Keyed by `ClientStage` enum (the stable Aqua stage label) rather
than the per-agency `PhaseDefinition.id` UUID — milestone state
survives if an agency re-seeds its phase rows.

## Q-ASSUMED log

1. **`phaseStage` (enum) over `phaseId` (UUID).** Prompt names
   `Record<PhaseId, MilestoneState[]>`; foundation's
   `PhaseDefinition.id` is per-agency and would invalidate stored
   progress on re-seed. Keying off the stable `ClientStage` enum
   gives operators a durable record across phase-row churn.
2. **Foundation `updateClient` direct, not a fulfillment route.**
   Milestone tick is pure metadata bookkeeping with no domain side-
   effects — fulfillment doesn't need to learn about it. Avoids a
   schema-change round on the fulfillment plugin.
3. **Visited / current / future = `AQUA_PHASE_ORDER` index compare.**
   Foundation `phases.order` is per-agency editable; ordering by the
   canonical Aqua stage list keeps the strip stable even if an agency
   reorders its phase rows.
4. **`AQUA_MILESTONES` is a hardcoded seed.** Operators can't add
   custom deliverables yet — chapter §5a "per-phase plugin install
   list" is intentionally NOT mirrored here; the prompt's milestone
   set is a separate operator-facing list. Customisation lands when
   the milestones become editable via the SOPs / settings surface.
5. **Panel rendered above the existing 2-col Overview grid**, not
   replacing recent-activity. Operators want both at once.

## NOT in scope

- Per-deliverable file uploads / attachments.
- Real automation of milestone completion (operators tick manually).
- Non-Aqua phase names (panel auto-hides).
- Editing the milestone seed list from the UI.
- Touching milesymedia / business-os / fulfillment internals.

## Smoke results

`§ Onboarding dashboard` block adds 5 checks. tsc clean. HARD
BOUNDARY honoured.
