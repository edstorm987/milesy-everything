/loop

# T2 — phases-presets ITEM 7: pipeline → client → applyPhaseToClient

Phases-as-presets foundation shipped 2026-05-08 (chapter
`04-phases-presets-architecture.md`). Items 1-4 done: schema,
editor, applier, welcome gate, sidebar override. This is item 7
of the build queue — wire the pipeline kanban so column moves +
lead-to-client conversions go through `applyPhaseToClient`.

## Pre-read

- `~/.claude/projects/-Users-eds/memory/project_phases_as_presets.md`
  — full architecture plan + this item's detailed plan.
- `src/server/phaseApplier.ts` — `applyPhaseToClient(clientId, phaseId)`.
  Idempotent. Updates stage + installs `pluginPreset[]`.
- `src/server/phases.ts` — `getPhaseForClientStage(agencyId, stage)`.
- `04-the-final-portal/plugins/leads-pipeline/` — leads pipeline
  plugin with "convert to client" action.
- `04-the-final-portal/plugins/kanban/` — kanban plugin handling
  column-drag stage moves.
- `src/server/tenants.ts` `updateClient(...)` — current direct
  mutation path. After this round, all stage changes route through
  the applier instead.

## Scope

**A — Lead-to-client conversion**: in leads-pipeline plugin, after
`createClient(...)`, immediately `await applyPhaseToClient(newClientId, leadPhaseId)`.
Resolve `leadPhaseId` via `getPhaseForClientStage(agencyId, "lead")`. The
"lead" phase is seeded by default. Welcome gate auto-fires on the
client's first login because the cookie key is per-phase.

**B — Kanban column move = phase transition**: when a card on the
fulfilment pipeline moves between columns, instead of calling
`updateClient({stage: newStage})`, resolve the phase for the new
stage and call `applyPhaseToClient(clientId, phaseId)`. The applier
handles stage update + plugin install + activity log.

**C — Activity event**: in the applier, emit a `client.phase_changed`
event with `{clientId, fromStage, toStage, fromPhaseId, toPhaseId}`.
Threaded through the existing event bus so activity-inbox plugin picks
it up. Add the event type to `src/server/types.ts` `ActivityEventName`
union if it exists, otherwise to whatever loose-string surface today's
events use.

**D — Audit existing direct stage mutations**: grep for
`updateClient.*stage` calls and decide per-call: keep direct (e.g. test
fixtures) or migrate to applier. Don't blindly migrate — some callers
intentionally avoid plugin install.

## HARD BOUNDARY

T2 owns this. Do NOT touch:
- onboarding-checklist plugin (item 6, separate prompt).
- BOS / Health Check public surfaces (item 5, separate prompt).
- The applier itself — it's foundational, treat as read-only API.

## Acceptance

- Drag a card on the fulfilment kanban from "Discovery" → "Design":
  client.stage updates AND the design phase's `pluginPreset` plugins
  appear in the client's installed list.
- Convert a lead to client in leads-pipeline: new client lands at
  `lead` stage with the lead-phase plugins already installed.
- Activity inbox shows a "Phase: Discovery → Design" entry.
- Idempotent: drag the card back and forth — no duplicate installs.

## Q-ASSUMED at queue time

- Kanban plugin currently calls `updateClient({stage})` somewhere
  reachable; verify the call site before refactoring.
- ActivityEvent system exists and accepts string action names;
  if there's a strict union, extend it.

Push commit when green: tsc + smoke. Commit message format:
`T2: phases-presets item 7 — pipeline + kanban route stage changes through applyPhaseToClient + client.phase_changed activity event`
