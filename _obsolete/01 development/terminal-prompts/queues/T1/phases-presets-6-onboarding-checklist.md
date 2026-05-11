/loop

# T1 — phases-presets ITEM 6: onboarding-checklist plugin reads phase.checklist

Phases-as-presets foundation shipped 2026-05-08 (chapter
`04-phases-presets-architecture.md`). Items 1-4 done: schema,
editor, applier, welcome gate, sidebar override. This is item 6
of the build queue — make the onboarding-checklist plugin
phase-driven instead of self-managed.

## Pre-read

- `~/.claude/projects/-Users-eds/memory/project_phases_as_presets.md`
  — full architecture plan + this item's detailed plan.
- `04-the-final-portal/plugins/onboarding-checklist/` — current
  plugin source (PluginStorage-driven checklist).
- `src/server/types.ts` `PhaseDefinition.checklist[]` —
  `{id, label, visibility: "internal"|"client", done?}`.
- `src/server/phases.ts` — `getPhaseForClientStage(agencyId, stage)`
  helper added 2026-05-08.
- `src/app/portal/agency/phases/[phaseId]/_PhaseEditorForm.tsx` —
  phase editor; needs a checklist editor surface (this item).

## Scope

**A — Plugin migration**: onboarding-checklist plugin reads
`phase.checklist[]` as the source of truth. Filter by visibility:
`client` items render in client portal, `internal` items render
ONLY in agency view. Drop the plugin's own checklist storage.

**B — Per-client checkmark state**: keep checked/unchecked state
in PluginStorage keyed `${clientId}-${phaseId}-${itemId}`. Resets
on phase change (different `phaseId` part of key). On phase
transition, do a best-effort label-match to carry checkmarks
forward — match items where `oldItem.label === newItem.label`
case-insensitive.

**C — Phase editor checklist surface**: extend
`_PhaseEditorForm.tsx` with a checklist editor:
  - List of rows: `{label: text input, visibility: select(internal|client), order}`
  - Add row / remove row / reorder (up/down arrows is fine, no DnD)
  - Persist via `/api/portal/phases/upsert` — extend the route to
    accept `checklist[]` and merge on existing-phase updates.

**D — Onboarding plugin UI**: when a client lands on a phase, show
the checklist. Each item is a checkbox; ticking calls
`/api/plugins/onboarding-checklist/toggle` with `{itemId, done}`.
Internal items render with a 🔒 prefix in agency view; never sent
to client view.

## HARD BOUNDARY

T1 owns this. Do NOT touch:
- The phaseApplier (it's already idempotent on plugin install).
- BOS / Health Check public surfaces (item 5, separate prompt).
- Pipeline kanban (item 7, separate prompt).

## Acceptance

- Edit a phase, add 3 client-visible items + 2 internal-only.
- Sign in as a client at that phase: see 3 items, tick 2, refresh, still ticked.
- Sign in as agency-owner viewing the same client: see all 5 items, the 2 internal ones have 🔒.
- Move client to a phase whose checklist has one same-label item:
  that one stays ticked; new items unticked.

## Q-ASSUMED at queue time

- The onboarding-checklist plugin has at least a stub UI today; if
  it's a brand-new feature, the prompt covers full UI build.
- PluginStorage write API is async-safe — verify before coding.

Push commit when green: tsc + smoke. Commit message format:
`T1: phases-presets item 6 — onboarding-checklist reads phase.checklist + checkmark state per client+phase`
