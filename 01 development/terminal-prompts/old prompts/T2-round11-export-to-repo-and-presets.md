/loop

# T2 — Round 11: Export-to-repo flow + preset portal library

Per the architecture extension chapter `04-architecture-extension-per-client-portals.md`,
**each Live client gets a custom portal materialized as
`04-the-final-portal/clients/<slug>/`** — its own Next.js app,
generated from the client's brand + installed plugins + content.
Round 11 builds the **generator** (the "Export to repo" button) plus
a **preset portal library** (Ed's preset starter templates).

After R11, an agency operator can:
1. Click "Export to repo" in the Aqua portal editor for any Live
   client.
2. Pick a preset (skincare brand / membership-only / affiliate-only / ...)
   or start blank.
3. The Aqua portal generates `clients/<slug>/` from the preset +
   client's brand kit + installed plugins + content.
4. Commit + push (or open a PR).

`clients/felicias-perfect-portal/` already exists in the repo as the
**reference prototype** — lift its shape as the canonical template.

## Working environment

- **Repo**: https://github.com/edsworld27/ker-v3
- **Local**: `~/Desktop/ker-v3/`
- **Branch**: `main`. `git pull --rebase --autostash && git push` after each commit.
- Top-level folders contain spaces — quote them.

## Messaging

- **Outbox**: `01 development/messages/terminal-2/to-orchestrator.md`
- **Inbox**: `01 development/messages/terminal-2/from-orchestrator.md`
- Don't stop on questions; log `Q-ASSUMED`. Only stop on `Q-BLOCKED`.

## Mandatory pre-read

1. `01 development/CLAUDE.md` (Mode A — terminal mesh)
2. `01 development/context/prior research/04-architecture.md` — §7 (phase lifecycle), §9 (folder layout)
3. `01 development/context/prior research/04-architecture-extension-per-client-portals.md` — **the canonical doc for this round** (read carefully)
4. `01 development/context/prior research/04-plugin-fulfillment.md` — your R1 (phase preset shape)
5. `01 development/context/prior research/04-plugin-website-editor.md` — manifest + 6 starter trees (preset portals lift this pattern)
6. `04-the-final-portal/clients/felicias perfect portal/` — the reference prototype; lift its shape as the canonical template
7. `04-the-final-portal/portal/src/server/tenants.ts` — Client + EndCustomer + brand kit shape

## Scope — four goals

### Goal A: `@aqua/plugin-portal-export`

A new plugin (Aqua-manifest-shaped, like all your others) at
`04-the-final-portal/plugins/portal-export/`. Self-contained,
tsc-clean, mirror your most recent plugin shape (email-sender).

Manifest:
- `id: "portal-export"`
- `category: "core"` (infrastructure)
- `scopePolicy: "either"` — usable at agency or client scope
- `requires: []` — soft-reads from website-editor / fulfillment
- `core: false` — opt-in
- ~3 navItems: Export · Presets · History (panel `core`)
- ~3 admin pages
- ~8 API routes at `/api/portal/portal-export/*`
- 0 storefront blocks (infrastructure)

### Goal B: ExportService

The generator. Given `(clientId, presetId?, options?)`:
1. **Collect**: read the client's brand kit (`tenants.getClient`),
   installed plugins (`pluginInstalls`), active portal variants
   (website-editor's `getActivePortalVariant`), editor pages, custom
   content from website-editor's `lib/customPages`, theme tokens.
2. **Resolve preset**: if `presetId` is set, merge the preset's
   defaults under the client's overrides (brand always wins).
3. **Materialize** to `04-the-final-portal/clients/<slug>/`:
   - `package.json` mirroring the shared portal's deps + plugin
     workspace deps (only the plugins this client has installed).
   - `next.config.ts` with the right `transpilePackages` list.
   - `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`
     (lift from `portal/`).
   - `src/app/layout.tsx` injecting the client's brand kit.
   - `src/app/page.tsx` + per-portal-role pages
     (`src/app/login/page.tsx`, `src/app/account/...`, etc.) each
     rendering the active portal-variant's block tree.
   - `src/app/api/...` route handlers wired to the same plugin
     manifest dispatch your shared portal already uses.
   - `portal-config.json` capturing the materialized state for round-trip.
4. **Idempotent re-export**: subsequent runs diff + update — don't
   blast over operator hand-edits in `clients/<slug>/`. Log Q-ASSUMED
   on the diff strategy if unclear.

### Goal C: Preset portal library

`04-the-final-portal/plugins/portal-export/src/presets/` — JSON
manifests for the starter portals:

```ts
PortalPreset {
  id, label, description, icon?,
  installedPlugins: string[],            // plugin ids to seed
  portalVariants: { [role]: variantId }, // which variant per role
  starterContent: { pages: BlockTree[] },
  defaultBrand: BrandKit,                // overridden by client's
  recommendedPhase: PhaseId,             // when this preset typically activates
};
```

Ship 4 presets for v1:
1. **`skincare-brand`** — Felicia's pattern. Plugins:
   website-editor + ecommerce + memberships + affiliates +
   client-crm. Variants: full storefront + member account +
   affiliate dashboard.
2. **`service-portal`** — agency-team-driven service brief +
   deliverable feedback. Plugins: website-editor + fulfillment
   client-side surface + forms + client-crm.
3. **`membership-only`** — gated content + recurring billing +
   member directory. Plugins: website-editor + memberships +
   client-crm.
4. **`affiliate-only`** — referral dashboard + payout management.
   Plugins: website-editor + affiliates + client-crm.

Each preset's `starterContent.pages` is a BlockTree array (use the
T3-shipped block id catalogue — paywall, signup, leaderboard, etc.).

### Goal D: Admin UI — ExportPage + PresetsPage + HistoryPage

`ExportPage` (`/portal-export/<clientId?>`):
- Pick client (or pre-filled from URL).
- Pick preset (preset cards w/ description + plugin list preview).
- Toggle: "first export" vs "re-export". For re-export, show a diff
  preview of what will change.
- Big "Export to repo" button. POSTs to
  `/api/portal/portal-export/clients/:clientId`.
- Result: confirmation panel with the materialized `clients/<slug>/`
  path + a "Open PR" button (lifts T3's promote flow if available; OK
  to log a Q-ASSUMED and stub the PR-open if it's not directly
  reachable).

`PresetsPage`: list of preset cards + preview of what's in each
(plugin list, role variants, default brand). Read-only for v1.

`HistoryPage`: list of past exports per client (timestamp, preset,
operator, commit hash if PR was opened). Stored per-install.

## Foundation integration

Same pattern as forms / email-sender / client-crm — declare ports,
container builder, foundation adapter. The materialization step
needs filesystem write access — declare a `FilesystemPort` you
accept via the container builder; in dev T1's foundation gives it a
real `fs/promises` impl, in tests it's a mock.

Document Foundation pending list in chapter:
- Workspace dep + transpilePackages + side-effect-import +
  `_registry.ts` append + `ActivityCategory += "export"` +
  FilesystemPort wiring + (optional) GitHub PR-open integration.

## NOT in scope

- Don't actually deploy `clients/<slug>/` to Vercel — config + repo
  commit only. Deployment is a separate operator action.
- Don't build a domain-attach flow (that's a future T1 round) —
  preset's `defaultBrand` can carry a `customDomain?` field but
  attachment isn't wired.
- Don't build a "delete client portal" flow — once exported, the
  folder stays in repo until manually removed.
- Don't restructure the existing `clients/felicias perfect portal/` —
  treat as read-only reference. Future round migrates it into the new
  format.
- Don't touch other plugin source.

## Loop discipline

Each cycle: pull → read inbox + outbox → progress → commit → push →
append `COMMIT` → `ScheduleWakeup` with `<<autonomous-loop-dynamic>>`.
Mid-task 600–900s, fully DONE 1500s, 3 empty wakes → omit ScheduleWakeup
to end. Goals B + C are the bulk; A + D lighter.

## When done

1. `tsc --noEmit` clean inside `04-the-final-portal/plugins/portal-export/`.
2. Smoke (`src/__smoke__/export.test.ts`) — node:test cases:
   - Materialize a small fixture client with `skincare-brand` preset →
     written `clients/<slug>/` matches expected structure.
   - Idempotent re-export (no operator edits) is no-op.
   - Idempotent re-export (with mocked operator edit) preserves the edit.
   - Each preset's manifest validates against `PortalPreset` shape.
   - Brand-kit override beats preset default.
3. Chapter `04-plugin-portal-export.md` documenting the generator
   flow + preset library + Foundation pending list + cross-team TODOs
   (T1 FilesystemPort wiring + GitHub PR-open integration; T3 R6's
   Save-to-per-client-repo mode).
4. MASTER row.
5. `tasks.md` row done.
6. Final `DONE` + `COMMIT`.
