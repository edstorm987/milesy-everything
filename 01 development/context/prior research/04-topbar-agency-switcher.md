# Chapter 132 — Topbar agency switcher (T1 R026, WS-C R2)

R025 landed `agencyIds[]` + `activeAgencyId` in the schema. R026
ships the UI: Ed-as-master flips between agencies via a Topbar
dropdown that re-issues the session cookie scoped to the chosen
agency.

## Goal A — `<AgencySwitcher>`

NEW `src/components/chrome/AgencySwitcher.tsx` — client component,
native `<details>/<summary>` dropdown (no JS lib). Mounted in Topbar
to the left of the "Back to website" pill.

**Visibility**: returns `null` when `agencies.length <= 1` so
single-agency operators see no UI noise.

**Behaviour**: each row shows `[brand-swatch] [agency-name]`; clicking
POSTs `/api/auth/agency-switch` with `{agencyId}`, then hard-navigates
to the response's `redirect` (server-rendered chrome — Topbar +
Sidebar + ThemeInjector — re-fetches the new agency's data).

The currently-active row carries a `✓` marker + `data-active="true"`
testid. Disabled state during the in-flight POST. Inline error
display when the response is a 4xx.

## Goal B — `POST /api/auth/agency-switch`

NEW `src/app/api/auth/agency-switch/route.ts`:

1. `getSessionFromRequest(req)` — 401 on missing.
2. JSON body parse → `agencyId` string.
3. `assertTenantScope(session, agencyId)` (R025 helper) — 403
   `tenant_scope_mismatch` outside membership.
4. `getAgency(agencyId)` defense-in-depth: 403 `agency_inactive`
   when the record was deleted / suspended between sign-in and switch.
5. `issueSession({...session, agencyId, agencyIds, activeAgencyId,
   sessionRev})` — preserves clientId / isDemo, refreshes from the
   user record's current sessionRev.
6. `logActivity({category: "auth", action: "agency.switch", ...})`.
7. Response: `{ ok: true, redirect, agencyId }`. `redirect` comes
   from `resolvePostLoginPath` so role-aware routing carries over.

## Goal C — AquaOasis Demo seed

NEW `src/lib/server/aquaOasisSeed.ts`. Runs on first boot via
founderSeed so Ed-as-master sees ≥2 agencies in the switcher
out-of-the-box.

- `seedAquaOasisDemo(installedBy?)` — idempotent. `getAgencyBySlug`
  short-circuits subsequent runs (`alreadyExisted: true`).
- `bootstrapAgency` provisions the agency + auto-installs every core
  plugin. The brand kit ships in the bootstrap input (cool teal +
  heritage-lite serif heading).
- After bootstrap, three named non-core plugins are wired via
  `upsertInstall`: `client-crm`, `bookings`, `agency-marketing`.
- `addUserAgencyMembership(userId, agencyId)` — appends to
  `agencyIds[]` (deduped) and bumps `sessionRev` so existing cookies
  revalidate.

**Brand kit**: `primaryColor #0E7490` (teal-700), `secondaryColor
#E0F2FE` (sky-100), `accentColor #0891B2` (cyan-600), heading
`Cormorant Garamond` (heritage-lite), body `Inter`, radius `10px`.

**Founder seed wire-up** (`founderSeed.ts`):

```ts
const founder = createUser({...});
try {
  const { seedAquaOasisDemo, addUserAgencyMembership } = await import("./aquaOasisSeed");
  const { agency } = await seedAquaOasisDemo(founder.id);
  addUserAgencyMembership(founder.id, agency.id);
} catch (e) {
  console.warn("[founderSeed] AquaOasis Demo seed failed — switcher will only show Milesy Media:", ...);
}
```

Wrapped in try/catch so a seed failure (plugin runtime gone, etc.)
doesn't tank the founder seed itself. The demo agency is
nice-to-have, not load-bearing.

## Goal D — Smoke

NEW `scripts/smoke-topbar-agency-switcher.test.ts` (run via
`npm run smoke:topbar-agency-switcher`, 12/12 pass, ~1.4s).

Four suites, source-marker style (the seed + auth modules carry
`server-only`):

- **Component** (3) — file exists + `"use client"`; hides on ≤1
  agency; renders swatch + active-marker.
- **Topbar wire-up** (2) — Topbar accepts `agencies` +
  `activeAgencyId` props + renders switcher; agency layout passes
  `getSessionAgencyIds(session)` mapped to `AgencyOption[]` with
  brand-primary swatch + `getActiveAgencyId(session)`.
- **Route** (3) — POST exists + `assertTenantScope` + re-issues with
  `activeAgencyId` + activity log + `resolvePostLoginPath`; rejects
  deleted/suspended agencies (`agency_inactive` 403).
- **AquaOasis seed** (4) — constants match chapter contract; module
  exports `seedAquaOasisDemo` + `addUserAgencyMembership` + idempotent
  short-circuit; brand kit teal+heritage; `upsertInstall` wired;
  founderSeed imports + appends membership.

## Goal E — Layout wire-up

`src/app/portal/agency/layout.tsx` is the only consumer touched in
this round (per HARD BOUNDARIES T1 owns foundation/portal source).
Client + customer layouts read `getActiveAgencyId(session)` already
via the legacy `agencyId` mirror — they don't yet show the switcher,
which is consistent with the prompt (switcher is for the agency
workspace; client/customer surfaces would need richer multi-tenancy
UX out of scope here).

## NOT in scope

- Domain-aware marketing (Phase 12 R3, post-ship).
- Per-agency lead-magnet packs (Phase 12 R4, post-ship).
- Switcher for client / customer surfaces (R+1 — they need richer
  multi-tenancy UX first).
- Real AquaOasis content (assets, pages) — this is a seed-only demo.

## Q-ASSUMED

- **Native `<details>` dropdown over a JS combobox**: short
  membership lists; no need for typeahead. Keyboard accessibility
  comes for free via the browser implementation.
- **Hard navigate over router.replace**: Topbar / Sidebar /
  ThemeInjector are server-rendered against `session.agencyId`. A
  soft navigate would keep the cached chrome; a full reload re-paints
  the new agency's brand.
- **Brand swatch = `agency.brand.primaryColor`**: uses the existing
  per-agency BrandKit. Falls back to a neutral chip when missing.
- **AquaOasis seed errors warn + skip**: the demo agency is
  nice-to-have. Production deploys with `FOUNDER_PASSWORD` set still
  succeed even if AquaOasis can't seed.
- **`upsertInstall` for the named plugin set**: idempotent — second
  run is a config no-op. Installs aren't deeply configured (default
  `config: {}`, `features: {}`); R+1 wires real defaults per plugin.
- **`assertTenantScope` is the auth gate**: R025's helper. Master
  users with multiple agencies pass for any of theirs; legacy
  single-agency users only pass for their one.
- **Smoke source-marker over runtime**: every load-bearing module
  carries `server-only`. The seed's pure constants could be runtime-
  tested if we relaxed the shim, but source-marker keeps the same
  shape as R022/R023/R024/R025 smokes.
