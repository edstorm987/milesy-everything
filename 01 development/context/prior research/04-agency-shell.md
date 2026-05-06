# 04 — Agency Shell (T1)

Ed's directive: simplify. The product is "Ed logs in → sees his clients
→ adds new ones → presses 'New website' → builds it." All nine plugins
are already shipped — what was missing was the agency-side UX shell that
makes them feel like one product.

## Goal A — Ed's home (`/portal/agency`)

Rewrote `src/app/portal/agency/page.tsx`:

- Welcome banner: "Welcome back, {firstName}." + agency name + client
  count.
- Single primary CTA: "New client" (top-right; also centered in empty
  state).
- Card grid — one card per client, each with:
  - Brand mark (logo if set; else 2-letter initials chip in
    `client.brand.primaryColor`).
  - Name + phase chip + enabled-plugin count.
  - Last-activity timestamp derived from `listActivity({ agencyId })`
    grouped by `clientId` (most-recent wins).
  - Hover/focus footer with three quick actions:
    `Open` / `Edit website` / `View portal`. Hidden by default
    (`opacity-0`) and revealed via `group-hover:opacity-100` +
    `group-focus-within:opacity-100`.
- Empty state: friendly placeholder ("🌱 No clients yet") + centred
  "New client" CTA. The grid is suppressed entirely so the page is a
  hero, not a half-painted dashboard.

## Goal B — Add-client flow

NEW client component `src/app/portal/agency/_NewClientButton.tsx`:

- Inline modal opened by the home CTA. Fields: name, slug
  (auto-derived from name until edited), owner email, brand colour
  (`<input type="color">`), logo URL, phase preset.
- Phase presets fetched from `GET /api/portal/fulfillment/presets` on
  modal open (fulfillment plugin owns the preset table per
  `04-architecture.md §7`); falls back to a static default list when
  the endpoint isn't reachable so the modal still works on a fresh
  store. Preview line ("Will install: …") shows what auto-installs.
  When the operator picks Live, the line flips to "Live skips presets
  — you'll land in the custom-portal builder for this client" per the
  per-client-portals architecture extension (chapter 19b).
- Submit POSTs to `/api/portal/fulfillment/clients` (the existing
  `createClientHandler` — applies the phase preset and seeds installs).
  On success: closes modal, `router.push('/portal/clients/<newId>')`,
  `router.refresh()`.

## Goal C — Per-client overview (`/portal/clients/[clientId]`)

Rewrote `src/app/portal/clients/[clientId]/page.tsx` as a single
tabbed screen. Tab persists via `?tab=` query, NOT nested routes — keeps
deep-links cheap and the layout tree shallow:

| Tab       | Content |
|-----------|---------|
| Overview  | Phase card · Quick actions card · Recent activity (last 8). |
| Website   | Single primary CTA "Edit website" → `/portal/clients/<id>/website-editor/pages` (T3's editor). |
| Portal    | Single primary CTA "Edit portal" → `/portal/clients/<id>/website-editor/portal-variants` + secondary "Export to repo". |
| Kanban    | Graceful-degrade placeholder; links to fulfillment phase board until T2 ships the kanban plugin. |
| Finance   | Link to agency-finance with `?clientId=` deep-link. |
| Assets    | Link to website-editor's Assets surface. |
| Tools     | "+ Add capability" picker (see below). |

Tab nav lives in `_OverviewTabs.tsx` (`"use client"` for active-state
styling without serialised header reads). Server-rendered content for
every tab is computed in the page so deep-links hydrate fully.

## Goal C2 — "+ Add capability" picker

NEW `_ToolsPicker.tsx`. Lists every plugin from `listPlugins()` with
its current install state:

- Not installed → green "+ Install" button → `POST
  /api/portal/fulfillment/marketplace/install`.
- Installed → "Disable / Enable" toggle (`marketplace/enable`) +
  red "Uninstall" (`marketplace/uninstall`).
- Plugins whose id is in the current phase preset's `pluginPreset`
  show a `from preset` chip so the operator knows why they're already
  on. Computed by intersecting installs with
  `listPhasesForAgency(agencyId).find(p => p.stage === client.stage)
   ?.pluginPreset`.
- After every action, `router.refresh()` re-renders the server
  component so the chip set + sidebar nav reflect the new state.

## Goal D — Sidebar Tools ballpark

Extended `Sidebar.tsx` with an `extra?: ReactNode` slot rendered
under the panel list. Agency layout passes `<AgencyToolsBallpark />`
— a small client component with a collapsible (closed by default)
"Tools" section listing the eight discoverable capabilities Ed asked
for: HR · Finance · Marketing · Forms · Email · Ops · Domains ·
Affiliates. Each row is a `Link` to the agency-side page for that
plugin. Out of the way (border-top, muted typography) but
discoverable in one click — matches Ed's "ballpark / hidden but not
buried" requirement.

## Smoke

Extended `scripts/smoke.mjs` with a new "§ Agency shell" block:

- `/portal/agency` returns 200 in the populated state, contains
  "Welcome back" and "New client".
- Each of the seven tabs (`?tab=overview..tools`) returns 200 against
  the seeded demo client.
- Add-client happy path: `POST /api/portal/fulfillment/clients` →
  asserts 200/201 + returned id; follow-up GET on
  `/portal/clients/<newId>` returns 200.

Empty-state assertion not part of the harness: the demo seed always
populates a client, so testing the empty state would require a
separate teardown step. Manual verification via the empty workspace
(no agency seeded) is the fallback.

## What changed (file map)

```
04-the-final-portal/portal/src/
  app/portal/agency/page.tsx              [REWRITE]
  app/portal/agency/_NewClientButton.tsx  [NEW]
  app/portal/agency/layout.tsx            [PATCH — passes <AgencyToolsBallpark/>]
  app/portal/clients/[clientId]/page.tsx  [REWRITE]
  app/portal/clients/[clientId]/_OverviewTabs.tsx [NEW]
  app/portal/clients/[clientId]/_ToolsPicker.tsx  [NEW]
  components/chrome/Sidebar.tsx           [PATCH — extra prop]
  components/chrome/AgencyToolsBallpark.tsx [NEW]
  scripts/smoke.mjs                       [PATCH — § Agency shell]
```

## Hard boundary respected

Did NOT touch `04-the-final-portal/milesymedia website/` or
`04-the-final-portal/business-os/`. All edits are inside the portal
package + scripts.

## Deviations / Q-ASSUMED

- Per-client overview tabs use `?tab=` query params, not nested route
  segments. Faster to ship, cheaper to deep-link, no extra layout
  tree. If Ed wants a nav-able URL per tab later, a thin
  `[clientId]/[tab]/page.tsx` redirect-shim covers it.
- The fulfillment `createClientHandler` returns
  `{ ok, client, ... }`; the modal gracefully accepts either
  `data.client.id` or `data.clientId` so contract drift won't break
  the redirect.
- Tools picker uses fulfillment's existing marketplace endpoints
  rather than calling foundation's `installPlugin` directly — keeps
  policy / role checks / activity logging in one place.
- Sidebar `extra` slot is the cheapest contract change that lets each
  scope inject scope-specific chrome without forking the component.
  Client + customer scopes don't pass it.

## Cross-team

- T2 fulfillment: no API changes required. The `marketplace/*` and
  `clients` POST endpoints are the contract.
- T3 website-editor: the Website + Portal + Assets tabs deep-link to
  T3's existing surfaces. If T3's editor URL changes (R-deeplink work
  in flight), update the four hrefs in `[clientId]/page.tsx`.
- T4 (Ed's territory): unchanged — milesymedia + business-os
  untouched.

## Future / R+1 candidates

- Replace the static "Tools" sidebar list with a live derivation from
  registered plugins so new agency-scoped plugins surface
  automatically.
- Auto-focus the "name" input + close-on-Esc binding for the modal.
- Real activity grouping (last-by-client) is currently
  `listActivity({ limit: 1000 })` + a Map walk; if activity volume
  ever blows up, push a `lastActivityForClient(agencyId, clientId)`
  helper into `server/activity.ts`.
- Empty-state coverage in smoke once a `?reset=1` exists for the
  whole-agency wipe (currently only demo agency has it).
