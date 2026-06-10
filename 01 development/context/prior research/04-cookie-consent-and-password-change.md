# 04 — Cookie consent + force password change (R007)

T3 Round 007. Two small lift-inventory wins from chapter #58 Tier 3:
a storefront `cookie-consent` block (Goal A) + an editor-side
force-password-change registry + admin toggle endpoints (Goal B).
The login-time redirect itself is foundation/T1 territory; this
round ships the editor surface so foundation has a single hook to
read.

## 1. Cookie consent block (Goal A)

NEW `src/components/blocks/CookieConsentBlock.tsx`:

- Props: `message` / `acceptLabel` / `declineLabel` / `policyUrl?` /
  `position: "bottom-bar" | "corner" | "modal"`.
- Renders only when no decision is on file. Reads/writes localStorage
  key `aqua_cookie_consent_v1` (exported as `COOKIE_CONSENT_KEY`).
- Accept/decline dispatches `CustomEvent("aqua-cookie-consent", {
  detail: { value } })` on `window` so plugins can listen — analytics
  fire on `accepted`, suppress on `declined`.
- Three layouts:
  - **bottom-bar** — full-width strip pinned to bottom, no border-
    radius for a chrome-tight look.
  - **corner** — 360px card pinned bottom-right.
  - **modal** — centred over a 55% scrim.
- Single binary v1; granular categories (analytics / marketing /
  strict) deferred — operator can swap blocks when categories land.

Registered in `blockRegistry.ts` under id `cookie-consent` with the
🍪 icon, `content` category, and 5 editable fields. `BlockType` is
already `(string & {})`-extensible so no union edit needed.

## 2. Force-password-change registry (Goal B)

NEW `src/server/forcePasswordChange.ts` exposes:

- `getRequirePasswordChange(storage, agencyId, userId)` — true if the
  user has a per-user flag *or* the agency has a `_all` flag.
- `setRequirePasswordChange(storage, agencyId, userId, setBy)` —
  writes per-user record `{ setBy, setAt }`.
- `clearRequirePasswordChange(storage, agencyId, userId)` — removes
  per-user record (foundation calls this after a successful change).
- `setRequirePasswordChangeForAgency` /
  `clearRequirePasswordChangeForAgency` — agency-wide
  ("force on next login for all users") variants.
- `listRequirePasswordChangeUsers` — excludes the `_all` sentinel.

Storage keys:
- `t/<agencyId>/_agency/website-editor/force-password/<userId>`
- `t/<agencyId>/_agency/website-editor/force-password/_all`

NEW `src/api/handlers/forcePassword.ts`:

- `GET /api/portal/website-editor/users/force-password` — without
  `?userId` returns the per-user roster; with `?userId=…` returns
  `{ required }`.
- `POST /api/portal/website-editor/users/force-password` — body
  `{ userId, value: boolean }` (per-user toggle) or
  `{ all: true, value: boolean }` (agency-wide).
  Missing `value` → 400. Missing both `userId` and `all` → 400.

## 3. Foundation hook (out-of-scope, T1)

The login-time redirect itself is foundation work. The contract:

```ts
// foundation post-auth hook — pseudocode
import { getRequirePasswordChange, clearRequirePasswordChange }
  from "@aqua/plugin-website-editor/server/forcePasswordChange";

if (await getRequirePasswordChange(storage, agencyId, user.id)) {
  return redirect("/account/change-password");
}
// in /account/change-password POST handler:
await clearRequirePasswordChange(storage, agencyId, user.id);
```

The agency-wide `_all` flag is honoured but not auto-cleared — the
foundation should clear the per-user flag on successful change *and*
record a per-user `lastChanged` so the next-login agency-wide check
falls through. R+1 candidate to tighten that bookkeeping; today the
flag stays set after one successful change so subsequent logins
trigger the redirect again, which is the safer failure mode.

## 4. Smoke

NEW `src/__smoke__/r007-cookie-force-password.test.ts` 29/29 pass:

- block registration shape (label / defaults / fields including
  `position` select + `policyUrl`).
- registry per-user round-trip (set / get / clear / hit + miss).
- agency-wide `_all` flag implies required for any user, scoped to
  its agency, excluded from `listRequirePasswordChangeUsers`.
- HTTP shape: GET roster / GET ?userId=… / POST per-user true+false
  / POST agency-wide / 400 paths.

`@aqua/plugin-website-editor` package.json test chain extended.
tsc-clean.

## 5. Files

- `plugins/website-editor/src/components/blocks/CookieConsentBlock.tsx`
  (NEW).
- `plugins/website-editor/src/components/blockRegistry.ts` patch
  (import + `cookie-consent` entry).
- `plugins/website-editor/src/server/forcePasswordChange.ts` (NEW).
- `plugins/website-editor/src/api/handlers/forcePassword.ts` (NEW).
- `plugins/website-editor/src/api/routes.ts` patch (2 new routes).
- `plugins/website-editor/src/__smoke__/r007-cookie-force-password.test.ts`
  (NEW).
- `plugins/website-editor/package.json` (test script chain).

## 6. Q-ASSUMED / deviations

- Cookie consent stays a single binary v1; no analytics / marketing
  / strict categories yet. Storage key is versioned
  (`aqua_cookie_consent_v1`) so a future v2 with categories can
  migrate cleanly.
- Force-password redirect itself was Q-ASSUMED to live in foundation
  (T1). This round ships the editor-side toggle + storage; T1 reads
  `getRequirePasswordChange` in its post-auth hook.
- Cookie block is registered but NOT auto-injected into
  `pageTemplates` — operator-picks-it-up-from-the-block-library
  beats every-new-site-suddenly-grows-a-banner. Auto-injection is a
  trivial future flip if Ed wants it.
- "Force on all" agency-wide flag is honoured but not auto-cleared
  per-user after a successful change — the failure mode (redirect
  triggers again) is the safer one. Tightening this is R+1.

## 7. R+1 candidates

- Granular cookie consent categories (analytics / marketing / strict
  / preferences) with a "manage preferences" UX.
- Auto-inject cookie-consent block into new-site `pageTemplates`
  with a editor-settings toggle.
- `lastChanged` timestamp per user so agency-wide `_all` flag
  naturally falls off once each user complies.
- Editor admin UI surfacing the per-user toggle + the agency-wide
  button next to the user-detail page (not in this round — pure
  registry + handlers ready for T1 to mount in its existing user
  admin view).
- Foundation post-auth hook + `/account/change-password` page (T1).
