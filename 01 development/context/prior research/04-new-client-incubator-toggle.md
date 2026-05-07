# `04` "+ New client" — Aqua Incubator template toggle (T1 R14)

> Authored 2026-05-07. Wires up T3 R010's `applyIncubatorClientMetadata`
> resolver + the `aqua-incubator` portal variant by exposing the toggle
> the chapter said T1 owed. On submit, the modal POSTs the client +
> (when toggled ON) fires a foundation-side route that runs
> `applyStarterVariant` + `applyIncubatorClientMetadata` on the new
> client's `account` portal variant.

## Files touched

- `portal/src/app/portal/agency/_NewClientButton.tsx`
  - `FormState.useIncubator: boolean` added; `DEFAULT_STATE.useIncubator
    = true` (the canonical Epic Intro entry).
  - `defaultUseIncubator(stage)` helper — true for `aqua-epic-intro` or
    any `*-intro` stage. The `update("stage", …)` path re-derives the
    toggle so flipping to a later phase auto-uncheck it; explicit
    operator toggles still take precedence after.
  - NEW UI block beneath the phase select — amber callout panel
    (`data-testid="incubator-toggle"`) with checkbox + explanation
    copy referring to placeholder substitution.
  - `submit()` path: after the existing `POST /api/portal/fulfillment/
    clients` succeeds, if `state.useIncubator === true`, fires
    `POST /api/tenants/apply-incubator-variant` with the new clientId
    + composed metadata (`phase` from selected preset's label,
    `planTier` from the Aqua plan-tier label, therapistName /
    practiceName / `onboardingStartedAt` ISO date). Failure of the
    apply step is non-blocking — the client was already created;
    operator can re-trigger from the per-client overview.
- `portal/src/app/api/tenants/apply-incubator-variant/route.ts` (NEW)
  - Foundation-side wire-up so the modal can complete the workflow
    without exposing the website-editor's plugin internals to the
    client. Steps:
    1. `requireRoleForClient(AGENCY_ROLES)` gate + `getClientForAgency`.
    2. `getInstall({ agencyId, clientId }, "website-editor")` → 412
       when website-editor isn't installed for this client.
    3. `makeCtx(install, session.email)` → fresh `PluginCtx` with the
       per-install storage scope.
    4. `applyStarterVariant({ ..., role: "account", variantId:
       "aqua-incubator" }, ctx.storage)` → creates the draft page +
       flips it active for the role.
    5. `getPage(...)` → reads the freshly-created page back; runs
       `applyIncubatorClientMetadata(blocks, metadata)` to substitute
       placeholders; `updatePage(...)` writes the resolved blocks.
    6. `updateClient(metadata: { useIncubator: true,
       incubatorAppliedAt: Date.now() })` so per-client renders can
       short-circuit if needed.
- `portal/scripts/smoke.mjs`
  - NEW `§ New client Incubator toggle` block (4 checks):
    `incubator-toggle` testid visible on agency home; create
    `aqua-epic-intro` client; install `website-editor`;
    `apply-incubator-variant` 200 returning `variantId:
    "aqua-incubator"`; empty body → 400.

## Q-ASSUMED log

1. **Toggle re-derives on stage change** — flipping the phase select
   updates `useIncubator` to its phase-default. Captures the prompt's
   "default ON when phase = Epic Intro, else default OFF" without
   trapping operators who later edit either field.
2. **`role: "account"`** for `applyStarterVariant`. The Incubator
   variant is the client's own portal account view (the per-client
   landing surface), not the embed-login or affiliate variants.
   Deeper portal-role choice is R+1.
3. **Re-PATCH after metadata substitute** — applyStarterVariant
   writes raw blocks; T3 R010's `applyIncubatorClientMetadata`
   substitutes placeholders. The route reads the page back and
   writes the resolved tree so subsequent renders never see raw
   `{{phase}}` tokens.
4. **Relative-path imports of website-editor internals** — same
   pattern as T1 R7's agency-hr import; node_modules snapshot may
   pre-date the exports we need, relative paths stay in sync with
   the on-disk source.
5. **Failure of apply is non-blocking** — the client still exists;
   the operator can re-trigger via a future `Re-apply Incubator`
   action on the per-client overview (R+1 polish).
6. **`onboardingStartedAt` is an ISO date** (not ms epoch) — the
   placeholder is text-rendered into the welcome variant's hero copy
   and a human-readable `2026-05-07` reads better than a unix
   timestamp.

## NOT in scope

- Per-niche template variants (T4 R004 + future).
- Toggle for non-Incubator presets.
- Re-apply / undo affordances on the per-client overview.
- Touching milesymedia / business-os.

## Smoke results

`§ New client Incubator toggle` block adds 4 checks. tsc clean.
HARD BOUNDARY honoured.
