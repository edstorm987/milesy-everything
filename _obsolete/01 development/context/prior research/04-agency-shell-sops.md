# `04` Agency Shell — SOPs surfacing (T1 R4)

> Authored 2026-05-07. Wires T2's `@aqua/plugin-sops` (T2/002) into
> the agency-shell sidebar (chapter #59 §2 row "SOPs, Docs & Templates")
> + the per-client overview, with permission-key gates per Employee HQ
> (T1/002).

## Files touched

- `portal/src/components/chrome/AgencyToolsBallpark.tsx`
  - Imports `useEffect`. On mount, `fetch('/api/portal/sops/list')`,
    counts `sops` whose `updatedAt >= now - 7d`, renders an emerald
    `{N} new` chip next to the "SOPs, Docs & Templates" row when the
    count is >0. Plugin not installed → silent (chip omitted).
  - Sidebar row already pointed at `/portal/agency/sops` via the
    plugin's manifest navItem (T2/002); this round just adds the
    indicator.
- `portal/src/app/portal/clients/[clientId]/_OverviewTabs.tsx`
  - NEW `sops` tab inserted between `assets` and `tools`.
- `portal/src/app/portal/clients/[clientId]/page.tsx`
  - Imports `ClientSopsTab` + `assertSopsAccess`, `familiesForStage`,
    `SopsAccessError` from `@/lib/server/sopsAccess`.
  - `tab === "sops"` block: gate via `assertSopsAccess(session)` →
    SopsAccessError surfaces as a 403 panel; else map
    `familiesForStage(client.stage)` → render `<ClientSopsTab>`.
- `portal/src/app/portal/clients/[clientId]/_ClientSopsTab.tsx` (NEW)
  - Client component. `useEffect` fans out one
    `/api/portal/sops/list?tag=<family>&status=published` per family,
    de-dupes by id, sorts by `updatedAt` desc. Read-only list — each
    row links to `/portal/agency/sops/read/<slug>`. Header carries an
    "Open SOPs shelf →" anchor for full editing access. Empty +
    plugin-not-installed states render explicit copy.
- `portal/src/lib/server/sopsAccess.ts` (NEW)
  - `assertSopsAccess(session, family?)` — Founder fallback gate.
    Throws `SopsAccessError` (status 403) for null/non-agency roles.
    Agency roles all pass v1; per-CustomRole permission lookup deferred
    to R+1 (foundation has no current "employee role" resolver yet —
    `agency-hr.RoleService` lives behind a per-plugin storage scope).
  - `familiesForStage(stage)` — phase → tag-family suggestion map:
    - `lead` / `discovery` / `aqua-epic-intro` / `aqua-blueprint`
      → `[sales, leads]`
    - `design` / `development` / `onboarding` / `aqua-diagnostics`
      / `aqua-brand-builder` → `[service, standards]`
    - `aqua-traffic` → `[service, mastery]`
    - `live` / `aqua-mastery` → `[mastery, service]`
    - default → `[standards]`
- `portal/scripts/smoke.mjs`
  - NEW `§ SOPs surfacing` block: list endpoint 200, per-client
    `?tab=sops` 200, family heading + agency-shelf link visible.

## Permission gate shape (Q-ASSUMED)

The prompt names two keys: `sops.view` + `sops.tag.<family>`. T1/002
shipped both as part of the 18-key `PermissionKey` union under
`agency-hr/src/server/roles.ts`. Foundation can't directly invoke
`RoleService.get(customRoleId)` — RoleService is scoped to its plugin's
PluginStorage.

v1 short-circuits this with the prompt's "Founder default" fallback:
any agency-* session role passes both gates. Client + end-customer
roles always 403. Documented as deferred R+1: a foundation-level
`getCurrentEmployeeRole(session)` resolver would let this gate consult
the real CustomRole grid + the `sops.tag.<family>` permission key.

## Q-ASSUMED log

1. **No foundation→plugin RoleService call.** v1 keys off
   `session.role` directly with Founder default. Deeper grid lookup
   waits for a foundation employee-role resolver.
2. **Phase→family map inline.** Six entries kept inside
   `sopsAccess.ts` next to the gate rather than a new server module —
   too small to justify its own service.
3. **Per-client tab is client-component fetch, not server-rendered.**
   Plugin storage isn't reachable from the foundation server tree
   without a registered service. A client `useEffect` keeps the
   boundary clean and reuses the same HTTP gate `visibleToRoles` the
   plugin already enforces.
4. **`status=published` filter on the per-client tab.** Drafts +
   archived SOPs only surface on the agency shelf, never on the
   per-client read-only view.
5. **Recent-edits chip = 7-day window.** Matches the prompt's "this
   week" wording. Threshold lives as `ONE_WEEK_MS` in
   `AgencyToolsBallpark.tsx`.

## NOT in scope

- Editing SOPs from the per-client tab (read-only by design).
- New permission keys (T1/002 already added them).
- Foundation-level employee-role resolver (R+1).
- Touching the sops plugin itself (T2 owns).

## Smoke results

`§ SOPs surfacing` block adds 4 checks. tsc clean. HARD BOUNDARY
honoured.
