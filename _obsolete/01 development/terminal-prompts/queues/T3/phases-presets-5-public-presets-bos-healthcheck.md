/loop

# T3 — phases-presets ITEM 5: BOS + Health Check rewritten as public-preset phases

Phases-as-presets foundation shipped 2026-05-08 (chapter
`04-phases-presets-architecture.md`). Items 1-4 done. Item 5 is
the biggest scope of the remaining queue — rewrite the public
marketing surfaces (`/business-os`, `/health-check`, demo embeds)
to render from phase presets flagged `isPublicPreset: true`.

## Pre-read

- `~/.claude/projects/-Users-eds/memory/project_phases_as_presets.md`
  — full architecture plan + this item's detailed plan + tradeoff
  flags.
- `src/server/types.ts` `PhaseDefinition.isPublicPreset` — already
  added 2026-05-08.
- `src/app/business-os/page.tsx` and `src/app/health-check/page.tsx`
  — current static-ish renders. Health-check uses iframe-wrap
  (chapter #123 fix-2) — must stay as fallback.
- `src/lib/server/previewPhase.ts` — `escapeStyleContent` /
  `escapeScriptContent` helpers used to inject `customCss` /
  `customJs` per-client. Same pattern reused here, public scope.
- `src/app/portal/clients/[clientId]/layout.tsx` lines around the
  preview-phase `<style>` / `<script>` injection — reference impl.

## Scope

**A — Public-phase lookup helper**: add to `src/server/phases.ts`:
```ts
export function getPublicPhaseBySlug(slug: string): PhaseDefinition | null
```
Filters `Object.values(state.phases)` for `p.isPublicPreset === true && p.stage === slug`. Returns first match (or extend with a dedicated `slug` field on PhaseDefinition if multiple agencies could each ship a `business-os` phase — open question, see tradeoff below).

**B — `/business-os` rewrite**: replace the static-ish render with:
1. `getPublicPhaseBySlug("business-os")` lookup.
2. If null → render the existing static fallback (don't break the page if no phase authored).
3. If found → render heading from `phase.welcomeHeading || phase.label`, body from `phase.welcomeBody || phase.description`, inject `customCss`/`customJs` via the escape helpers.
4. Mark `export const dynamic = "force-dynamic"` so phase edits show immediately.

**C — `/health-check` rewrite**: same pattern. Keep the iframe-wrap
as a hard fallback when no `health-check` phase exists. Once Ed
authors one, the dynamic render takes over.

**D — Cache invalidation hook**: in `src/app/api/portal/phases/upsert/route.ts`,
after a successful save where `phase.isPublicPreset === true`, call
`revalidatePath('/business-os')` and `revalidatePath('/health-check')`
(or specifically the slug that was edited). Import `revalidatePath`
from `next/cache`.

**E — Seeder script**: `scripts/seedPublicPresetPhases.mjs`. Creates
two phases on the founder agency:
  - `id: phase_<agencyId>_business-os`, stage: `business-os`, slug: `business-os`, `isPublicPreset: true`, welcomeHeading + welcomeBody seeded with current static copy from `/business-os/page.tsx`.
  - Same for `health-check`.
Idempotent — skip if already exists. Run via `node scripts/seedPublicPresetPhases.mjs`.

**F — Demo embed surfaces**: any `/demo?embed=1` style routes that
currently mount a hardcoded preset should also accept `?phase=<slug>`
to render any public-preset phase. Optional within this round; flag
as follow-up if scope creeps.

## TRADEOFF FOR ED — flag before building

The detailed plan documents this: dynamic public pages mean a DB
read per request (cheap on file-backed JSON, trivial under
Postgres). For SEO / Lighthouse, switch to ISR `revalidate = 60`.
Default to `force-dynamic` for now per Ed's "simplicity wins"
preference at this stage. If T3 disagrees while building, add a
note to the chapter and proceed with force-dynamic.

The `slug` question: today the implementation can use `phase.stage`
as the public lookup key (works because public phases have unique
stages like `business-os` / `health-check`). If two agencies could
both publish a `business-os` phase, that breaks. For v1, single-tenant
public surfaces (Milesy is the only agency publishing) — use stage as
slug. If multi-tenant publishing comes, add a dedicated `slug` field.
Document this in the chapter.

## HARD BOUNDARY

T3 owns this. Do NOT touch:
- onboarding-checklist plugin (item 6, separate prompt).
- Pipeline / kanban (item 7, separate prompt).
- The applier — read-only API for this round.
- The phase editor itself — only consumes the new field, no UI changes
  needed beyond what item 1 already shipped (the `isPublicPreset`
  checkbox is wired).

## Acceptance

- Author a `business-os` phase via /portal/agency/phases editor with
  `isPublicPreset` checked.
- Visit `/business-os` (logged out, fresh browser) — rendered content
  matches the phase's authored copy + customCss/Js.
- Edit the phase, save → `/business-os` shows new content on next
  request (no manual cache bust).
- Delete the phase → `/business-os` falls back to static render.
- Run the seeder against a fresh DB → two phases appear, idempotent on
  re-run.

## Q-ASSUMED at queue time

- `revalidatePath` is supported in this Next.js version (16.2.4 — yes).
- Health-check iframe-wrap is still load-bearing (chapter #123 fix-2);
  fallback is critical, not nice-to-have.
- File-backed `.data/portal-state.json` is the dev DB; the seeder
  writes there.

Push commit when green: tsc + local-build. Commit message format:
`T3: phases-presets item 5 — /business-os + /health-check rendered from public-preset phases (force-dynamic) + revalidate hook + seeder`
