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

---

## Round 2 — Aqua reskin

The R1 generic shell got reskinned to Ed's actual operating shape per
chapter #59 (Aqua internals reference). Five fold-ins, one schema
extension, no architectural change.

### Goal A — Real phase progression

Replaced fulfillment's `DEFAULT_PHASE_PRESETS` (Discovery / Design /
Development / Onboarding / Live / Churned) with Aqua's six-phase
Incubator 3.0 + Churned tail:

1. **Epic Intro** — onboarding scroll only, no plugins.
2. **Blueprint Setup** — `website-editor + client-crm + forms`.
3. **Diagnostics / Foundations** — adds `ai-builder`.
4. **Brand Builder + Verification** — same set; brand kit baked into
   `website-editor`.
5. **Traffic (Expansion Plan)** — adds `ecommerce + agency-marketing
   + email-sender`.
6. **Mastery & Ascension** — adds `memberships + affiliates`.

`ClientStage` (foundation `types.ts` + fulfillment `tenancy.ts`) gained
six new string members `aqua-epic-intro` … `aqua-mastery` while
**keeping the legacy stages** (`lead`/`discovery`/`design`/`development`
/`onboarding`/`live`/`churned`) so existing seeds + the Live custom-
portal flag (architecture 19b) keep working without migration.
`phaseLabel()` learned the six new labels.

### Goal B — Aqua-real "+ New client" modal

`_NewClientButton.tsx` rewritten:

- **Therapist name** + **Practice name** — composed display name
  `"<Therapist> · <Practice>"` (graceful when only one is supplied).
  Slug auto-derives from the composed name until the operator edits
  the slug field.
- **Plan tier** — Foundational Flow / Expansion Plan / Mastery Plan
  (chapter #59 §4); each option has a one-liner hint surfaced under
  the select.
- **Starting Aqua phase** — six-phase preset list fetched from
  `/api/portal/fulfillment/presets` with a static Aqua fallback so a
  fresh store still works.
- **WhatsApp group invite** + **Stripe / invoice link** — optional
  URL fields.
- **Lock-in deposit (£100) paid** — boolean checkbox.

Submit POSTs to `/api/portal/fulfillment/clients` with all the above
plus `metadata: { therapistName, practiceName, planTier, whatsappLink,
stripeLink, lockInPaid }`. The handler forwards `metadata` through
`createWithPhase` → `clientStoreAdapter.createClient` → foundation
`tenants.createClient`.

### Goal C — Schema extension (the only new typed field)

Added optional `metadata?: Record<string, unknown>` to `Client`
(foundation `types.ts`). Threaded through:

- `tenants.ts` `CreateClientInput` + `UpdateClientPatch` (merge-on-
  update so partial patches don't clobber siblings).
- `plugins/_types.ts` `CreateClientInput` (the canonical port surface).
- `clientStoreAdapter.ts` createClient passthrough.
- Fulfillment plugin's `ports.ts` `CreateClientInput` +
  `clients.ts` `CreateClientWithPhaseInput` +
  `handlers.ts` `CreateClientBody`.

Everything Aqua-specific (planTier, whatsappLink, etc.) lives inside
that bag — no per-feature schema growth.

### Goal D — Aqua HQ six-section sidebar

`AgencyToolsBallpark.tsx` rewritten. Replaces the generic Tools list
with the canonical Aqua HQ sections (chapter #59 §2):

| Row | Maps to |
|---|---|
| Leads & Clients HQ | `/portal/agency` |
| Client Billing & Finance | `agency-finance` |
| Tasks & To-Do's | `kanban` (T2 in flight) |
| SOPs, Docs & Templates | `/portal/agency/sops` (placeholder until notes plugin lands) |
| Social Media Planner | `agency-marketing` |
| Passwords & Access | `/portal/agency/passwords` (placeholder until credential vault plugin) |

Each row carries a one-line hint via `title=` for hover discoverability.
A secondary collapsed **More tools** group (closed by default) keeps
HR / Forms / Email / Ops / Domains / Affiliates one click away.

The two placeholder hrefs (`/sops`, `/passwords`) intentionally point
at routes that don't exist yet — clicking lands on Next's 404, which
is the right signal until those plugins ship. Q-ASSUMED in lieu of
hiding rows: discoverability matters even before the surface exists.

### Goal E — Welcome copy + per-client overview

- Agency home: subtitle `"Where Healing Meets Revolution."` rendered
  in italic brand-primary right under the welcome H1.
- Empty-state copy: `"Onboard your first therapist to begin the Aqua
  Incubator."` Direct, audience-framed.
- Active-state copy: `"{n} therapist{s} active in {agencyName}."`
- Per-client header gained:
  - Plan tier caption beside the phase chip
    (`Plan tier: Expansion Plan`).
  - Lock-in paid emerald chip when `metadata.lockInPaid === true`.
  - Quick-action buttons in the Overview tab: `Open WhatsApp group ↗`
    (emerald-tinted when `metadata.whatsappLink` set), `Stripe /
    invoice ↗` (neutral) — both new-tab.

### Goal F — Smoke

Extended `scripts/smoke.mjs` with a "§ Aqua reskin" block:

- `/api/portal/fulfillment/presets` 200 + every Aqua phase id present.
- `/portal/agency` body contains `"Where Healing Meets Revolution"`
  and `"Aqua HQ"`.
- Add-client POST with metadata fields persists; overview body
  contains the plan tier label, the WhatsApp action, and the Lock-in
  paid chip.

### File map

```
04-the-final-portal/portal/src/
  server/types.ts                                 [PATCH — ClientStage union + Client.metadata]
  server/phases.ts                                [PATCH — labels for the six aqua phases]
  server/tenants.ts                               [PATCH — metadata in/out]
  app/portal/agency/page.tsx                      [PATCH — welcome subtitle + empty-state copy]
  app/portal/agency/_NewClientButton.tsx          [REWRITE — therapist + practice + plan + WA + lock-in + Stripe]
  app/portal/clients/[clientId]/page.tsx          [PATCH — plan caption, lock-in chip, WA + Stripe quick actions]
  components/chrome/AgencyToolsBallpark.tsx       [REWRITE — Aqua HQ six + More tools collapsed]
  plugins/_types.ts                               [PATCH — CreateClientInput.metadata]
  plugins/foundation-adapters/clientStoreAdapter.ts [PATCH — passthrough]
  scripts/smoke.mjs                               [PATCH — §Aqua reskin block]
04-the-final-portal/plugins/fulfillment/src/
  lib/tenancy.ts                                  [PATCH — ClientStage union]
  server/presets.ts                               [REWRITE — Aqua six + Churned tail]
  server/clients.ts                               [PATCH — CreateClientWithPhaseInput.metadata]
  server/ports.ts                                 [PATCH — CreateClientInput.metadata]
  api/handlers.ts                                 [PATCH — CreateClientBody.metadata + forward]
  components/PhasesSettingsList.tsx               [PATCH — STAGES list]
```

### Hard boundary respected

Zero touches to `04-the-final-portal/milesymedia website/` or
`04-the-final-portal/business-os/`. All edits inside the portal +
fulfillment packages.

### Q-ASSUMED / deviations

- ClientStage union extended additively rather than replaced — keeps
  the Live custom-portal flag and the demo seed working without a
  migration shim.
- `metadata` typed as `Record<string, unknown>` rather than a typed
  Aqua-specific shape; per chapter #59 §8 ("Most live in metadata: {}
  so no schema changes"). If the bag grows past ~6 fields, lift them
  into a typed sub-interface.
- Sidebar SOPs + Passwords rows link to non-existent routes for now;
  hiding them was the alternative — discoverability won.
- Plan tier rendered in the overview but NOT in the home grid card —
  card density already tight; Q-ASSUMED a phase chip + plugin count
  is enough at the grid level.
- Lock-in chip shown but NOT validated against any payment system;
  it's just a manual operator flag for now (chapter #59 §8 — Stripe
  Connect onboarding tracking is a future round).

### Cross-team / R+1

- T2 kanban (in flight) — once it ships, the `Tasks & To-Do's`
  sidebar row already points at `/portal/agency/kanban`; no change
  needed when the route lights up.
- Future credential-vault plugin — replace the `Passwords & Access`
  href when it lands.
- Future notes/SOP plugin — replace the `SOPs, Docs & Templates` href
  when it lands; until then a website-editor "SOPs" page covers the
  surface.
- Plan-tier driven phase gating (e.g. Foundational Flow caps at
  Diagnostics) is NOT enforced yet — a future round can wire it via
  fulfillment's transition guards.
