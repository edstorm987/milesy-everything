# Phases preview UI — sign-in-as-demo-client per phase + custom phases + code injection

**Round**: T1 — phases-preview UI · 2026-05-08
**Working dir**: `04-the-final-portal/milesymedia-website/`

## What ships

A founder/agency-manager surface at `/portal/agency/phases` to:

1. **Preview every phase as the demo client.** Each phase card carries a "Preview as demo client" button that POSTs `/api/auth/preview-as-client-at-phase`, re-issues the session as the seeded demo client (`DEMO_CLIENT_EMAIL`), stamps `lk_preview_phase=<phaseId>` cookie (4h sandbox), and redirects to `/portal/clients/<DEMO_CLIENT_SLUG>?previewPhase=<phaseId>`.

2. **Edit phases.** Each card has an "Edit" link to `/portal/agency/phases/[phaseId]` — name · description · ordering · `customCss` · `customJs`.

3. **Add custom phases.** Inline form on the list page. Founder/manager only. Custom phases land at `(N+1)*10` order; default phases (the six aqua-* stages seeded by the fulfillment plugin OR rows tagged `isDefault: true`) cannot be deleted — `409 default_phase_protected`.

4. **Optional code injection per phase.** `customCss` and `customJs` fields injected into the client portal `<head>` via `dangerouslySetInnerHTML` whenever `lk_preview_phase` resolves to a phase belonging to the same agency as the active client. Escapers neutralise `</style>` / `</script>` so an operator's fat-finger paste can't break the wrapping tag.

## Files shipped (T1 territory only)

- NEW `src/app/portal/agency/phases/page.tsx` — server list + cards.
- NEW `src/app/portal/agency/phases/_AddCustomPhaseForm.tsx` (client island).
- NEW `src/app/portal/agency/phases/_PhaseCardActions.tsx` (Preview + Delete buttons, client island).
- NEW `src/app/portal/agency/phases/[phaseId]/page.tsx` — editor.
- NEW `src/app/portal/agency/phases/[phaseId]/_PhaseEditorForm.tsx` (client island, ⚠️ banner over CSS/JS textareas).
- NEW `src/app/api/portal/phases/upsert/route.ts` — `POST` `{phaseId?, name, description?, ordering, customCss?, customJs?}`. Idempotent on phaseId. Founder / agency-owner / agency-manager only.
- NEW `src/app/api/portal/phases/delete/route.ts` — `POST` `{phaseId}`. Refuses `isDefault: true` AND any phase whose stage is in the seeded set (belt-and-braces because the seeder lives in T2 territory).
- NEW `src/app/api/auth/preview-as-client-at-phase/route.ts` — Founder-only. Re-issues demo-client session + stamps preview cookie + JSON `{ok, redirect}` (browser does the redirect after setting cookies).
- NEW `src/lib/server/previewPhase.ts` — `getPreviewPhase()`, `previewPhaseCookie(phaseId|null)`, `escapeStyleContent`, `escapeScriptContent`, `PREVIEW_PHASE_COOKIE`.
- EDIT `src/server/types.ts` — `PhaseDefinition` gained optional `isDefault?: boolean`, `customCss?: string`, `customJs?: string`.
- EDIT `src/lib/chrome/sidebarLayout.ts` — agency-scope settings panel gained "Phases" entry at `order: 95`.
- EDIT `src/app/portal/clients/[clientId]/layout.tsx` — reads `getPreviewPhase()`, injects `<style>` / `<script>` with escaped content when the cookie resolves to a phase owned by this client's agency.
- NEW `scripts/smoke-phases-preview.test.ts` — 21 cases / 8 suites (file existence · list page contract · upsert API gating + idempotence + customCss/Js · delete API default protection · preview-as-client API founder-only + DEMO_CLIENT wiring + agency-scope check · preview cookie helpers + escapers · `</style>`/`</script>` neutralisation logic · type / sidebar / client-layout markers · ordering preserved).
- `package.json` — `smoke:phases-preview` script.

## Code-injection trade-off (load-bearing)

**v1 ships zero sanitisation** of `customCss` / `customJs`. Rationale:

- Author scope is gated to **founder + agency-manager** (Admin permission grid). That's the same trust level as deploying a brand-kit override or pushing code in the repo. A bad actor at this scope already owns the agency.
- Sanitising CSS is the easy half (regex `</style`); sanitising arbitrary JS is impossible without a sandbox iframe. Adding a fake-safe filter would create a false sense of security.
- Operators expect raw CSS/JS to drop verbatim — that's the whole point of the field.

**Mitigations actually shipped**:
- `escapeStyleContent` / `escapeScriptContent` neutralise `</style>` / `</script>` so a stray close-tag can't break out of the wrapping element. This is a structural-integrity guard, not a sanitisation pass.
- The cookie `lk_preview_phase` is httpOnly + lax + 4h max-age, so injection only runs while a founder is actively previewing. Real customers never see the override.
- Agency-scope match — the cookie is ignored if `phase.agencyId !== client.agencyId`.
- Preview cookie is server-stamped only; client-side JS can't forge it.

**Future hardening (deferred — R+1)**:
- CSP nonce on the injected `<script>` so it survives a strict CSP rollout.
- Optional iframe-sandbox preview mode.
- Audit log entry on every customJs save (who-pasted-what).

## Q-ASSUMED

- Sidebar entry at `order: 95` (just above "Agency settings" at 100) gives Phases its own surface without inventing a new "Setup" panel.
- "Default phase" detection uses both an explicit `isDefault: true` flag (custom seeders can stamp) AND a hardcoded set of the six aqua-* stages. Cheap belt-and-braces because the seeder is in T2 territory and we can't edit it.
- Preview "Sign in as demo client" always uses `DEMO_CLIENT_EMAIL` — there is one demo client per agency so a `clientId` argument is unnecessary in v1.
- Preview cookie scope is `path: /` so it propagates into `/portal/clients/...`. Could narrow to `/portal/clients` later if it leaks into unrelated reads.
- `previewPhase=` query param on the redirect URL is informational — the cookie does the actual injection. Kept for visibility / debugging.
- Smoke test takes the file-marker / contract path (every API route + page transitively imports `server-only`, so tsx can't import them directly — same pattern as chapters #117/#138/#155/#160). Pure logic gets a runtime-exercise path (escape functions duplicated in-test to verify the contract under tsx).

## NOT in scope

- Per-phase plugin preset editing UI (today the form keeps `pluginPreset: []` for new phases and preserves the existing array on edits — T2's fulfillment plugin owns that semantics).
- Checklist editor (T2 owns).
- Drag-to-reorder (form takes a numeric ordering field; v2 can layer DnD on top).
- "Preview as a real client" — limited to the demo client by design (real clients are revenue-bearing surfaces, not POV sandboxes).
- CSP nonce for the injected scripts (R+1 hardening).

## Verification

- `npm run smoke:phases-preview` → 21/21 pass (~700ms).
- `npm run typecheck` → clean.
- HARD BOUNDARY honoured — only `src/server/types.ts`, `src/lib/server/`, `src/lib/chrome/`, `src/app/api/`, `src/app/portal/agency/phases/`, `src/app/portal/clients/[clientId]/layout.tsx`, `package.json`, `scripts/` touched. No `plugins/`, `public/`, `clients/`, `demo portals/` edits.
