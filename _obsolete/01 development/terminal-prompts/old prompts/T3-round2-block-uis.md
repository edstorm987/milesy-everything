/loop

# T3 — Round 2: Lift the real block + admin UIs from `02`

Round 1 you scaffolded `@aqua/plugin-website-editor` with 58 block stubs +
11 admin page stubs + the full server runtime + `applyStarterVariant`.
T1 wired your plugin into the foundation in their R3 (`29bd49a`) — the
pages render and the portal-variant flow works end-to-end with real data.
What's left: the **actual editor experience**. The block components are
shells; the admin pages are placeholders. Lift them faithfully from `02`.

## Working environment

- **Repo**: https://github.com/edsworld27/ker-v3
- **Local**: `~/Desktop/ker-v3/`
- **Branch**: `main`. After each commit: `git pull --rebase --autostash && git push`.
- Top-level folders contain spaces — quote them.

## Autonomous mesh — messaging

- **Outbox**: `01 development/messages/terminal-3/to-orchestrator.md`
- **Inbox**: `01 development/messages/terminal-3/from-orchestrator.md`
- Don't stop on questions; log `Q-ASSUMED` with reasoning.
- Only stop on `Q-BLOCKED`.

## Mandatory pre-read

1. `01 development/CLAUDE.md` (Mode A — terminal mesh)
2. `01 development/messages/README.md`
3. `01 development/context/prior research/04-architecture.md`
4. `01 development/context/prior research/04-plugin-website-editor.md` — your Round 1 chapter
5. `01 development/context/prior research/04-foundation-round3.md` — T1's wire-up; your plugin runs here
6. `01 development/context/prior research/aqua-blocks.md` — 58-block catalogue
7. `01 development/context/prior research/aqua-visual-editor.md` — editor architecture you're about to faithfully port
8. `01 development/context/prior research/aqua-portal-variants.md` — variant subsystem (already implemented)
9. Source: `02 felicias aqua portal work/src/components/editor/blocks/*` and `02/src/app/admin/editor/*` and `02/src/app/admin/portals/*`

## Scope — what to build

### Phase A: Lift the 58 block components

Replace your Round-1 stub components in
`04-the-final-portal/plugins/website-editor/src/components/blocks/*.tsx`
with the real implementations from
`02 felicias aqua portal work/src/components/editor/blocks/*.tsx`.

For each block:
1. Copy the source file faithfully.
2. Adapt imports — anything that imported `@/lib/admin/...` or `@/portal/server/...` from `02` needs to either:
   - Resolve to your plugin's own equivalent (you already have most of these).
   - Resolve to T1's foundation via the existing port shape.
   - Use the local path alias map your tsconfig already declares.
3. Keep the same default export name + props shape (`{ block, editorMode, renderChildren }`).
4. Update `blockRegistry.ts` if any block descriptor metadata changes (icon, category, default props, fields schema).

Commerce blocks (`product-card`, `product-grid`, `cart-summary`,
`checkout-summary`, `payment-button`, `order-success`, `variant-picker`,
`product-search`, `donation-button`) stay marked `requiresPlugin: 'ecommerce'`.
Their data hooks should call ecommerce APIs at `/api/portal/ecommerce/*`
(see `04-plugin-ecommerce.md` for the route catalogue).

If a block's source pulled from a context T1 doesn't expose yet (e.g.
`useCart()`), wire it to ecommerce's API or stub it with a clear TODO
referencing the missing dep. Don't block on missing deps — log
`Q-ASSUMED` and continue.

### Phase B: Lift the visual editor admin page

Replace `src/pages/EditorPage.tsx` (and helpers) with a faithful port of
`02 felicias aqua portal work/src/app/admin/editor/page.tsx` + everything
it imports from `src/components/editor/*` + `src/lib/admin/editorMode.ts`
+ `src/lib/admin/editorPages.ts`.

Goals:
- Live mode (iframe to storefront with click-to-edit overlay) — works against the foundation's catch-all storefront route.
- Block mode (drag-drop builder) — fully functional for editor-managed pages.
- Code mode (raw JSON view) — fully functional.
- Complexity modes (Simple / Full / Pro) — toggleable.
- Outliner left rail with pages + funnels.
- Properties right panel.
- Topbar with mode switcher, device emulator, undo/redo, publish modal.

The publish modal's GitHub PR flow (`/api/portal/promote/[siteId]`) can
remain as-is — wire it through your existing `promote` handler stub.

### Phase C: Lift the portal-variants admin

Replace `src/pages/PortalsPage.tsx` with a faithful port of
`02/src/app/admin/portals/page.tsx`. Tabs across Login · Affiliates ·
Orders · Account; per-role variant CRUD (Make active / Edit in editor /
Duplicate / Delete / View live ↗ / Preview ↗); active-variant tab
indicator; starter trees per role (you already have the JSONs).

### Phase D: Lift the rest of the admin pages

In rough priority order:
- `PagesPage` (page list)
- `PageDetailPage` (individual page settings)
- `CustomisePage` (brand kit editor)
- `SitesPage` (site selector + settings)
- `ThemesPage` + `ThemeDetailPage`
- `SectionsPage` · `AssetsPage` · `PopupsPage`

Each is a faithful port from `02 felicias aqua portal work/src/app/admin/<route>/`.

## NOT in scope

- Don't touch foundation (T1 owns).
- Don't touch fulfillment / ecommerce plugins (T2 owns).
- Don't add new manifest features — your Round 1 manifest is correct, just back the existing IDs with real implementations.
- Don't modify `04-architecture.md`.

## Loop discipline

Each cycle: pull → read inbox + outbox → continue → commit → push →
append `COMMIT` → `ScheduleWakeup` with `<<autonomous-loop-dynamic>>`.
Mid-task 600–900s, Q-BLOCKED 600s, fully DONE 1500s, 3 empty wakes → omit
ScheduleWakeup to end.

## When done

1. `tsc --noEmit` clean inside `04-the-final-portal/plugins/website-editor/`.
2. Smoke: load `/portal/clients/<id>/editor`, see real editor UI; load `/portal/clients/<id>/portals`, see real variant UI; create + activate a variant; see it on the customer-facing route via the foundation.
3. Update chapter `04-plugin-website-editor.md` with Round-2 status (or write `04-plugin-website-editor-round2.md`).
4. Update MASTER.md row.
5. Update `tasks.md` — mark T3 R2 done.
6. Append `DONE` + final `COMMIT` to outbox.

If Phase A alone takes the whole loop, commit after every 10 blocks lifted
so progress is incremental. Phases B/C/D can ship in subsequent runs.
