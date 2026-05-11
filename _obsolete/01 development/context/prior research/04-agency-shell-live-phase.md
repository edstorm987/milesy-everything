# `04` Agency Shell — Live phase gateway (T1 R3)

> Authored 2026-05-07 — extends `04-agency-shell.md` (R1 + R2). The
> previous Aqua phases (Epic Intro → Brand Builder → Traffic) all run
> on the shared portal. **Mastery & Ascension** (Aqua's Live) is where
> Ed handcrafts a per-client custom portal under
> `04-the-final-portal/clients/<slug>/`. This round wires the gateway
> from the per-client overview into T2's `portal-export` plugin.

## Files touched

- `portal/src/app/portal/clients/[clientId]/page.tsx`
  - `LIVE_STAGES`: `aqua-mastery` ∪ legacy `live`. `isLivePhase()`
    helper. (Foundation `PhaseDefinition` carries no `tier` field, so
    the prompt's "tier: live" tag falls back to the stage enum directly
    — Q-ASSUMED, no schema change for v1.)
  - `LIVE_RECOMMENDED_PLUGINS`: the architecture-extension §5a set —
    `website-editor`, `client-crm`, `forms`, `ecommerce`, `memberships`,
    `affiliates`, `agency-marketing`.
  - `customPortalExists(slug)` — `node:fs.existsSync` on
    `<cwd>/../clients/<slug>/`. CWD is the portal app root in dev and
    on Vercel; the repo root is one folder above.
  - Header gains a Live amber badge next to the phase chip when Live.
    Right-side header slot renders `<BuildPortalWizard>` when Live AND
    the folder is missing; flips to a plain `Open custom portal ↗`
    anchor pointing at `/clients/<slug>/` once the folder exists.
- `portal/src/app/portal/clients/[clientId]/_BuildPortalWizard.tsx` (NEW)
  - Client-side modal. Three sections: plugin checklist (pre-checked =
    currently installed; recommended chips highlight Live set), base
    template (blank starter / luv-and-ker / compass + any
    `portal-export` presets pulled lazily from
    `GET /api/portal/portal-export/presets`), slug confirm.
  - Submit → `POST /api/portal/portal-export/clients/export` with
    `{clientId, options:{presetId, destinationOverride,
    installedPluginsHint}}`. Q-ASSUMED: prompt's `/materialize`
    endpoint maps to `clients/export` since that's the actual route
    (see `plugins/portal-export/src/api/routes.ts`); the plugin's own
    `ExportPage.tsx` form-action target confirms.
  - v1: synchronous run + `router.refresh()` on success — flips the
    header CTA to "Open custom portal ↗". No streaming progress yet.
- `portal/src/app/portal/clients/[clientId]/_ToolsPicker.tsx`
  - Two new optional props: `isLive`, `liveRecommended: readonly
    string[]`. When `isLive`, an amber `<aside>` callout names the
    recommended set + the missing subset, and exposes a one-click
    "Install Live recommended" button that loops the existing
    `marketplace/install` POST per plugin id, then refreshes the route.
- `portal/scripts/smoke.mjs`
  - NEW `§ Live phase gateway` block: creates an `aqua-mastery` client,
    asserts the Live badge + Build CTA + Recommended-for-Live callout,
    then creates a non-Live client (`aqua-blueprint`) and asserts the
    CTA does NOT render.

## Detection rules

- **Live phase** → `client.stage === "aqua-mastery"` OR `client.stage
  === "live"`. The Aqua six-phase preset uses `aqua-mastery`; legacy
  demo seeds and any agency that hasn't migrated still use `live`.
- **Portal materialised** → `clients/<slug>/` exists on disk. We never
  read its contents — presence is the signal. Re-running the wizard
  while the folder exists is intentionally not exposed in the header
  (operators rebuild via the portal-export plugin's own admin page).

## Recommended-for-Live set

Per architecture extension chapter §5a:

```
website-editor  ← always-on shared portal foundation
client-crm
forms
ecommerce
memberships
affiliates
agency-marketing
```

The Tools picker callout shows the full list, names the missing
subset, and disables the bulk-install button when nothing is missing.

## Q-ASSUMED log

1. **`materialize` → `clients/export`.** Prompt names the endpoint
   `POST /api/portal/portal-export/materialize`; the plugin actually
   exposes `clients/export` (run) + `clients/plan` (dry-run). Used
   `clients/export` to match what's shipped.
2. **No `tier: "live"` field.** Foundation `PhaseDefinition` has no
   tier metadata. Keyed off the `ClientStage` enum directly.
3. **Synchronous export, no streaming.** `runExportHandler` returns
   the full `ExportRecord` in one shot; v1 does a single fetch +
   `router.refresh()` on success. Streaming progress is a polish
   round (would need a job-queue surface that doesn't exist today).
4. **CWD-relative `clients/` path.** Portal runs with CWD = the
   `portal/` folder in dev and on Vercel; `..` walks to the
   `04-the-final-portal/` repo root. If the build switches to a
   different layout, this resolver is the single point to update.

## NOT in scope (deferred)

- Real-time per-client deploy — T6's territory.
- Custom domain attach — T6's `@aqua/plugin-domains`.
- Building new plugins.
- Streaming materialisation progress / job queue.
- A shared "Live runbook" surface across all Live clients (would
  belong on the agency home, not the per-client overview).

## Smoke results

`§ Live phase gateway` block adds 7 new checks. tsc clean across
`portal/`. HARD BOUNDARY honoured — zero touches to
`milesymedia website/` or `business-os/`.
