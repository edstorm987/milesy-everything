# 04 — Portal-variant editor (T3 R012)

T3 Round 012. Per chapter 08, every client has multiple portal
variants (login / affiliates / orders / account) with at most one
active variant per role. R012 ships the editor surface so an
operator can pick which variant to edit, see the gallery of all
variants on the site, and flip the active one per role —
singleton-enforced server-side already.

## 1. State on entry

Server-side variant management is fully wired (R002+):

- `listVariantsForPortal(storage, a, c, siteId, role)` — variants
  for a single role, active-first.
- `getActivePortalVariant` / `setActivePortalVariant` — singleton-
  enforced (`pages.ts:212`).
- API: `GET /portal-variants?siteId=…&role=…` + `POST /portal-
  variants/active`.
- `applyStarterVariant` (R002) seeds + flips active in one shot.

R012 adds the **flat-across-all-roles** read needed by the editor
gallery, plus two pure UI components.

## 2. Server helper + endpoint

NEW `listAllPortalVariants(storage, a, c, siteId)` in
`server/portalVariants.ts`. Returns
`PortalVariantSummary[]`:

```ts
interface PortalVariantSummary {
  role: PortalRole;
  pageId: string;
  variantId?: string;
  title: string;
  slug: string;
  isActive: boolean;
  status: "draft" | "live";
  updatedAt: number;
}
```

Sort: by `PORTAL_ROLES` order (login → affiliates → orders →
account), then active-first within each role group, then
`updatedAt` desc. The role ordering is canonical so the gallery
+ switcher render the same sequence.

NEW handler `handleListAllPortalVariants` mounted at `GET
/api/portal/website-editor/portal-variants/all?siteId=…` (returns
400 missing siteId). Uses the existing `requireClientScope` gate.

## 3. UI components

NEW `components/editor/PortalVariantSwitcher.tsx` — editor topbar
dropdown. Lazy-fetches the all-variants feed on first open;
groups by role; per-role shows variants + an optional
"+ New variant" affordance (caller wires `onNewVariant(role)`);
clicking a variant fires `onPick(pageId)`. Active variant
highlighted with a green pip; current page highlighted with a
cyan tint. Empty role groups read "none yet". CSS-var driven
(reads `--brand-bg-elevated / --brand-border / --brand-radius-md
/ --brand-text` from R011's brand-kit surface).

NEW `components/editor/PortalVariantGallery.tsx` — full-screen
modal gallery. Each card:

- 16:9 preview tile (clickable when `onPreview` provided —
  thumbnail rendering is R+1 / host-page concern).
- Role chip (per-role tinted badge — login violet, affiliates
  pink, orders green, account cyan).
- Status chip ("live" emerald or "draft" slate).
- Title + slug (monospace) + last-edited date.
- Edit CTA (fires `onEdit(pageId)`) + "Make live" CTA on draft
  variants (POSTs `/portal-variants/active` directly, calls
  `load()` to refresh, surfaces busy state).

Both components accept a `fetchImpl` override for tests/SSR.
Both pure — host page mounts them where needed (topbar, modal
trigger button); R012 doesn't change the editor's existing
topbar wire-up.

## 4. PortalRole scope

The prompt mentions roles `account / customer / member /
affiliate / start-here / other`. Foundation `PortalRole` ships 4
canonical ids today: `login | affiliates | orders | account`
(`lib/portalRole.ts`). R012 honours the existing 4 — Q-FOLLOWUP
documented for foundation extension when the wider set lands
(architecture concern; T1).

## 5. Smoke

NEW `__smoke__/r012-portal-variant-editor.test.ts` 21/21:

- `listAllPortalVariants` returns variants across all 4 roles;
  role ordering follows `PORTAL_ROLES`; active-first within
  role; status mirrors `isActive`; `variantId` surfaces when set.
- HTTP `GET /portal-variants/all` 200 with siteId; preserves
  sort; 400 without siteId.
- `POST /portal-variants/active` flips active correctly across
  roles; singleton invariant holds (≤ 1 active per role); other
  roles unaffected by flip on a single role.

`@aqua/plugin-website-editor` package.json test chain extended.
tsc-clean.

## 6. Files

- `plugins/website-editor/src/server/portalVariants.ts` patch
  (NEW `listAllPortalVariants` + `PortalVariantSummary` type).
- `plugins/website-editor/src/api/handlers/pages.ts` patch
  (NEW `handleListAllPortalVariants`).
- `plugins/website-editor/src/api/routes.ts` patch (1 new route).
- `plugins/website-editor/src/components/editor/PortalVariantSwitcher.tsx`
  (NEW).
- `plugins/website-editor/src/components/editor/PortalVariantGallery.tsx`
  (NEW).
- `plugins/website-editor/src/__smoke__/r012-portal-variant-editor.test.ts`
  (NEW).
- `plugins/website-editor/package.json` (test chain).

## 7. Q-ASSUMED / deviations

- 4 PortalRoles (`login/affiliates/orders/account`) — the
  prompt's wider role set (`account/customer/member/affiliate/
  start-here/other`) is a foundation concern; today the editor
  honours what `lib/portalRole.ts` exports. T1 extends.
- "+ New variant" affordance — wired in the switcher as an
  `onNewVariant(role)` callback. The actual page-creation flow
  (which template to seed?) is a host-page concern; R012 leaves
  it to the host so it can route into the marketplace gallery
  (R006) or directly call `applyStarterVariant`.
- Preview thumbnails — gallery cards show a "preview" placeholder
  tile clickable via `onPreview(pageId)`. Real screenshot capture
  is an editor-engine concern (R+1 — same R+1 as the template
  marketplace's screenshot capture).
- Components don't render in the existing editor topbar yet —
  pure components ready to mount; host page wires them in (same
  pattern as `TemplateGallery` from R006).

## 8. R+1 candidates

- Foundation extension to the wider PortalRole set
  (account/customer/member/affiliate/start-here/other) when
  the architecture chapter lands the change.
- Real screenshot-based preview thumbnails in the gallery
  (canvas → image upload, mirrors the saved-template R+1).
- Drag-to-reorder draft variants within a role.
- Host-page wiring: editor topbar mounts
  `PortalVariantSwitcher` next to the page-picker; "Variants"
  button opens `PortalVariantGallery`; "+ New variant" lands
  on `TemplateGallery` filtered to starters of the matching
  role.
- Variant duplication (+ "Save as draft" from active).
- A/B testing variants (explicit out-of-scope per prompt).
