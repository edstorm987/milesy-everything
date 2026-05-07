# `04` Phase transition mechanics — operator UI (T1 R12)

> Authored 2026-05-07. Surfaces fulfillment's existing
> `transitionService.advancePhase` (T2 R002) as a Founder-facing
> per-client header control, with a confirm modal that previews the
> pluginPreset diff before firing the transition.

## Files touched

- `portal/src/app/portal/clients/[clientId]/_PhaseTransitionButton.tsx` (NEW)
  - Client component pinned in the per-client header right of the
    phase chip (inserted after the Live badge in the meta-row).
  - Boots: `GET /api/portal/fulfillment/phases`, sorts by
    `AQUA_PHASE_ORDER` index (six aqua-* stages canonical order).
  - **Primary action**: `Advance to {next.label} →` button →
    `setTarget(next)` opens the confirm modal.
  - **Dropdown menu** (▾): `← Regress to {prev}` row when an earlier
    Aqua phase exists, plus a "Skip to" sub-list of every other
    phase. Each entry sets `target` and closes the menu.
  - **Confirm modal**: computes `diff = { toInstall, toDisable }`
    via set-difference of `pluginPreset` arrays. Renders two lists
    (emerald "Will install / enable" + amber "Will disable") with
    counts; copy explains "Disabled plugin installs keep their
    config (reversible). Activity log entry will be written" so the
    operator knows fulfillment's transitionService handles the
    heavy lifting.
  - **Confirm** POSTs `/api/portal/fulfillment/phase/advance` with
    `{clientId, fromPhaseId, toPhaseId}` and `router.refresh()` on
    success.
  - **Founder gate**: returns `null` for non-Founder
    (`isFounder={session.role === "agency-owner"}` in page.tsx).
- `portal/src/app/portal/clients/[clientId]/page.tsx`
  - Imports `PhaseTransitionButton`. Mounted in the meta-row
    immediately after the Live amber badge.
- `portal/scripts/smoke.mjs`
  - NEW `§ Phase transitions` block: per-client overview shows the
    `phase-transition-button` testid (Founder POV); fulfillment
    `phases` endpoint 200.

## Goal coverage map

| Goal | Where |
| ---- | ----- |
| **A** primary advance + dropdown | `_PhaseTransitionButton.tsx` |
| **B** confirm modal w/ diff preview | inside same component |
| **C** archived config + reversible disable | already-handled by fulfillment `transitionService` (chapter §`04-fulfillment-transition.md`) — line `// Auto-disable, config preserved. Reversible. Never auto-uninstall.` |
| **D** activity log entry | already-handled by transitionService — emits `transition.completed` activity per advancePhase call |
| **E** auto-create kanban / SOP defaults | partially handled lazily: founder-todos kanban auto-creates on first widget mount (R5); client-tasks kanban auto-creates on first kanban-tab mount (R8); SOPs surface lazily on the SOPs tab (R4). Eager seed-on-phase-event awaits a foundation event-bus hook surface T1 can attach to without modifying fulfillment internals. |

## Q-ASSUMED log

1. **Founder-only client-side gate** — `session.role === "agency-owner"`.
   Server's existing `phase/advance` route is also gated on
   `AGENCY_ADMINS` so non-Founder agency-managers can call it; the
   client-side gate just hides the operator surface from staff/
   manager roles. R+1 could replace this with a fine-grained
   `phases.advance` permission key.
2. **Skip-to allows any phase**, no anti-skip protection. Operators
   sometimes legitimately leapfrog (e.g., trial customer immediately
   moved to Mastery). The transitionService trusts caller intent.
3. **Diff via set-difference** of `pluginPreset` arrays. Plugins that
   stay installed across both phases simply aren't in either list.
   Per-phase variant configuration changes (e.g., portal variants)
   aren't surfaced in the preview — they live in the phases object's
   `portalVariantId` field which we ignore for this UI.
4. **Eager seeding deferred** — Goal E partially relies on existing
   lazy-create paths (kanban / SOPs). Tying into fulfillment's
   activity stream for proactive seed would need an event-bus hook
   surface this round doesn't add.
5. **Aqua-only ordering** — the `AQUA_PHASE_ORDER` constant enforces
   canonical Epic Intro → Mastery left-to-right. Legacy stages
   (`discovery` / `live` / etc.) fall back to `phase.order`.

## NOT in scope

- Auto-emailing client on phase change (deferred to T2 R009 channels).
- Live custom-portal materialisation (T1 R003 owns `Live` flow).
- Eager seed-on-phase-event for kanban / SOPs (R+1 — needs foundation
  event-bus hook surface).
- Server-side validation that the operator's session has the
  fine-grained `phases.advance` permission key (server enforces
  AGENCY_ADMINS today).
- Touching milesymedia / business-os / fulfillment internals.

## Smoke results

`§ Phase transitions` block adds 2 checks. tsc clean. HARD BOUNDARY
honoured.
