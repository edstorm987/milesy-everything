# Portal-export plugin (T2 R11)

`@aqua/plugin-portal-export` — generator that materializes a Live
client's content into `clients/<slug>/` as a self-contained Next.js
app. Per architecture extension §19b. `scopePolicy: "either"`,
`core: false`, no hard deps. Soft-reads via optional
`WebsiteEditorReaderPort` for active variants + custom content.
Mirrors T5's `clients/luv-and-ker/` shape exactly.

> Built by T2 on 2026-05-05 as Round 11. tsc-clean standalone; 5/5
> smoke pass. Idempotent re-export via fingerprint ledger baked into
> portal-config.json — operator hand-edits are preserved on subsequent
> runs.

## 1. Package shape

```
04-the-final-portal/plugins/portal-export/
├── index.ts                          default-exports the AquaPlugin manifest
├── package.json                      @aqua/plugin-portal-export@0.1.0
├── tsconfig.json
├── src/
│   ├── lib/
│   │   ├── aquaPluginTypes.ts        vendored AquaPlugin contract
│   │   ├── domain.ts                 PortalPreset · CollectedClientState · ExportPlan/Diff/Record · PortalConfigDoc · GeneratedFingerprintMap
│   │   ├── tenancy.ts                Mirror types (+ "export" added to ActivityCategory)
│   │   ├── ids.ts                    makeId + fnv1a (file fingerprint)
│   │   └── time.ts                   stubable clock
│   ├── server/
│   │   ├── ports.ts                  Storage · Tenant (getClient) · ActivityLog · EventBus · PluginInstallStore (listInstalls) · FilesystemPort + optional WebsiteEditorReaderPort
│   │   ├── presets.ts                PresetService — read-only registry of bundled JSON presets + validate static helper
│   │   ├── materializer.ts           pure(state, preset) → MaterializedFile[] — package.json / next.config.ts / tsconfig.json / postcss.config.mjs / tailwind.config.ts / globals.css / layout.tsx / page.tsx / brandKit.ts / portalConfig.ts / portal-config.json (with _generatedFingerprints ledger baked in)
│   │   ├── exports.ts                ExportService — collect → plan → diff → export(write); listHistory + getHistory
│   │   ├── foundationAdapter.ts      registerPortalExportFoundation + containerFor + containerWithDeps + _containerFromCtx
│   │   └── index.ts                  buildPortalExportContainer + barrel
│   ├── presets/
│   │   ├── skincare-brand.json       Felicia's pattern — full storefront + member account + affiliate dashboard
│   │   ├── service-portal.json       Agency-team-driven service brief + deliverable feedback
│   │   ├── membership-only.json      Gated content + recurring billing
│   │   └── affiliate-only.json       Referral dashboard + payout management
│   ├── api/
│   │   ├── handlers.ts               8 handlers (presets · state · plan · export · history · pr-stub)
│   │   └── routes.ts                 ROUTES (per-route visibleToRoles)
│   ├── pages/
│   │   ├── ExportPage.tsx            mounted at "" + "export"
│   │   ├── PresetsPage.tsx
│   │   └── HistoryPage.tsx
│   └── __smoke__/
│       └── export.test.ts            5 node:test cases via tsx --test
└── package-lock.json
```

19 source files, ~1700 LOC, zero runtime deps.

## 2. Manifest (key fields)

```ts
{
  id: "portal-export",
  category: "core",
  status: "alpha",
  core: false,
  scopePolicy: "either",                // installs at agency OR client scope
  requires: [],                         // soft-reads from website-editor via optional port
  navItems: [Export · Presets · History],   // 3 admin items, panel "core"
  pages: 4 entries (ExportPage ×2 + PresetsPage + HistoryPage),
  api: ROUTES,                          // 8 routes
  storefront.blocks: none,              // infrastructure-only
  features: [export, presets, idempotent-reexport, history, pr-stub],
  settings.groups: [
    destination (destinationOverride),
    auth (authOrigin defaulting to milesymedia.com, cookieName lk_session_v1),
  ],
  onInstall: no-op (presets are bundled JSON, nothing to seed),
  healthcheck: 4-presets-loaded + last-run timestamp,
}
```

## 3. Domain model (v1)

```ts
type PortalPreset = {
  id, label, description, icon?,
  installedPlugins: PluginId[],
  portalVariants: Partial<Record<PortalRole, string>>,
  starterContent: { pages: BlockTree[] },
  defaultBrand: BrandKit,
  recommendedPhase: ClientStage,
};

type CollectedClientState = {
  client: { id, agencyId, slug, name, brand, websiteUrl?, tagline?, customDomain? },
  installedPlugins: PluginId[],
  portalVariants: Partial<Record<PortalRole, string>>,
  blockTrees: BlockTree[],
  themeTokens: Record<string, string>,
  customContent: Record<string, string>,
};

type MaterializedFile = {
  path,                                 // relative to clients/<slug>/
  content,                              // utf-8 file body
  fingerprint,                          // fnv1a(content) — for diff
  generated,                            // true = produced by export, false = preserved operator file
};

type ExportDiff = {
  added: string[],                      // file doesn't exist on disk (we'll write)
  changed: string[],                    // we owned it (matches prior ledger) and content differs (overwrite)
  preserved: string[],                  // exists, doesn't match prior ledger (operator hand-edited; KEEP)
  unchanged: string[],                  // already matches generator output
};

type ExportRecord = {
  id, agencyId, clientId, clientSlug,
  presetId?, status: "ok"|"failed",
  filesWritten, filesPreserved,
  prUrl?, commitHash?,
  startedAt, completedAt,
  actorUserId?, errorMessage?,
};
```

### Idempotent re-export — fingerprint ledger

The materializer bakes a `_generatedFingerprints: Record<path, fnv1a>`
ledger into `portal-config.json` on every export. On re-export,
`computeDiff` does a 3-way comparison per planned file:

```
file doesn't exist            → added (write)
exists, content matches plan  → unchanged (skip)
exists, content differs from plan, but matches prior ledger
                              → changed (we own it, overwrite)
exists, content differs from plan, doesn't match prior ledger
                              → preserved (operator hand-edited; KEEP)
```

First-time export: no ledger yet → every existing on-disk file is
treated as preserved (no portal-config means we have no claim of
authorship). Q-ASSUMED: portal-config itself is part of the ledger so
re-export detects when it's been hand-edited. Foundation can replace
this strategy with a richer diff (line-level, AST-aware) later — the
ExportPlan shape carries enough information.

## 4. Storage layout

```
export/by-id/<id>             → ExportRecord
export/by-client/<clientId>   → string[] of record ids
export/index                  → string[] of all record ids
```

Per-install — one storage slice per `(agency, client?)` install.

## 5. Materialized output (mirrors T5's luv-and-ker/)

```
04-the-final-portal/clients/<slug>/
├── package.json                file:../../plugins/<id> deps for installed + preset plugins (sorted)
├── next.config.ts              security headers + CSP, turbopack root
├── tsconfig.json               Next bundler resolution + paths
├── postcss.config.mjs
├── tailwind.config.ts          brand colors + fonts injected
├── portal-config.json          round-trippable state + _generatedFingerprints ledger
└── src/
    ├── app/
    │   ├── layout.tsx          metadata + root chrome with brand kit
    │   ├── page.tsx            renders the "home" BlockTree literal
    │   └── globals.css         CSS vars from brand kit
    └── lib/
        ├── brandKit.ts         inlined brand kit `as const`
        └── portalConfig.ts     reader for portal-config.json
```

**Same shape as `clients/luv-and-ker/`** — re-running the generator
against Felicia's client should produce that folder verbatim (modulo
operator hand-edits T5 has applied). The shape is the contract.

## 6. API surface (8 routes)

Mounted at `/api/portal/portal-export/...`. All admin — no public routes
(infrastructure tool).

| Method · Path | Handler | Roles |
|--------------|---------|-------|
| GET `presets` | listPresetsHandler | admin viewers |
| GET `presets/get?id=…` | getPresetHandler | admin viewers |
| GET `state?clientId=…` | getStateHandler | admin viewers |
| POST `clients/plan` | planExportHandler | admin admins |
| POST `clients/export` | runExportHandler | admin admins |
| GET `history` | listHistoryHandler | admin viewers |
| GET `history/get?id=…` | getHistoryHandler | admin viewers |
| POST `pr/open` | openPrStubHandler | admin admins |

`admin viewers` = agency-owner / agency-manager / agency-staff;
`admin admins` = agency-owner / agency-manager. The `pr/open` route is
a stub — real GitHub PR-open is foundation-pending.

## 7. Preset library (4 starters)

Each preset is bundled JSON in `src/presets/`. Validation runs at
`PresetService` boot — malformed presets surface immediately rather
than at first export.

| id | Plugins | Variants | Recommended phase |
|----|---------|----------|-------------------|
| `skincare-brand` | website-editor + ecommerce + memberships + affiliates + client-crm + forms | login + account + orders + affiliates | `live` |
| `service-portal` | website-editor + fulfillment + forms + client-crm | login + account | `development` |
| `membership-only` | website-editor + memberships + client-crm | login + account | `live` |
| `affiliate-only` | website-editor + affiliates + client-crm | login + affiliates | `live` |

Each preset's `starterContent.pages` is a small BlockTree array using
T3-shipped block ids (paywall, signup, leaderboard, hero-block,
featured-products, …). The materializer renders the home page tree
into `src/app/page.tsx`; per-route pages (account, login, etc.) are
foundation-pending — v1 home page only.

## 8. Cross-plugin event payloads

```ts
"export.started"       → { clientId, presetId? }
"export.completed"     → { clientId, filesWritten, filesPreserved }
"export.failed"        → { clientId, errorMessage }
"export.preset.applied" → { presetId }
```

CRM activity timeline can subscribe to these to track when an operator
exported a client portal. Foundation R6 router fan-out wires the
subscriptions.

## 9. Smoke test (5 cases)

`src/__smoke__/export.test.ts` — `node:test` via `tsx --test`. Builds
an in-memory foundation with mock filesystem (Map keyed by absolute
path) + mock WebsiteEditorReaderPort that returns 2 variants + 4
custom-content keys, walks:

| Step | Asserts |
|------|---------|
| 1 | Materialize fixture with `skincare-brand` preset: ≥8 files written; package.json has 5 plugin workspace deps (union of installed + preset, sorted); portal-config.json carries brand + variants (editor wins where overlap, preset fills where editor absent) + populated `_generatedFingerprints`; `email.completed` event emitted |
| 2 | Idempotent re-export (clean): 0 files written, fs size unchanged |
| 3 | Idempotent re-export with operator edit on package.json: status ok, ≥1 file preserved, operator edit survives byte-for-byte |
| 4 | Every shipped preset (4) validates against `PortalPreset`; negative case (preset missing `defaultBrand.primaryColor`) is rejected |
| 5 | Brand-kit override (`brandOverride: { primaryColor: "#000000" }`) beats both client brand + preset default in portal-config.json AND in tailwind.config.ts |

```
▶ portal-export smoke
  ✔ step 1–5 (5/5 pass)
ℹ tests 5   ℹ pass 5   ℹ fail 0
```

`npx tsx --test src/__smoke__/export.test.ts` from
`04-the-final-portal/plugins/portal-export/`.

## 10. Foundation pending (orchestrator brokerage)

| # | Task | File / Surface |
|---|------|---------------|
| 1 | Workspace dep + transpilePackages | `portal/package.json` + `portal/next.config.ts` |
| 2 | Side-effect-import file at `portal/src/plugins/foundation-adapters/portalExportFoundation.ts` calling `registerPortalExportFoundation({ tenant, activity, events, pluginInstalls, filesystem, websiteEditor? })` | new file |
| 3 | `_registry.ts` append (`portalExportManifest as unknown as AquaPlugin`) | `portal/src/plugins/_registry.ts` |
| 4 | `ActivityCategory` union += `"export"` | `portal/src/server/types.ts` |
| 5 | **FilesystemPort wiring** — foundation supplies a real `fs/promises` impl with `resolveRoot` rooted at `04-the-final-portal/clients/`. Single concern: server-only, never expose to client bundles. | foundation port adapter |
| 6 | **WebsiteEditorReaderPort projection** — when website-editor is installed for the same agency/client, project its `getActivePortalVariant` + `lib/customPages` reader + theme-tokens reader into a WebsiteEditorReaderPort. Without this port, the materializer falls back to preset defaults only — exports still work but produce empty home-page block trees. | new adapter file |
| 7 | **GitHub PR-open integration** — replace `pr/open` stub with a real branch-create + PR-open flow. Out of scope for v1. | future round |

## 11. Cross-team integration TODOs

- **T1 foundation**: items 1–7 above. Items 5 + 6 are load-bearing.
  Without them the plugin is tsc-clean standalone but unusable in
  production. The smoke harness proves the contract.
- **T3 website-editor**: when foundation R6's WebsiteEditorReaderPort
  projection lands, T3's `getActivePortalVariant` + `lib/customPages` +
  theme-tokens exports are the canonical sources. No edits required —
  the foundation adapter wraps T3's existing exports.
- **T5 luv-and-ker**: when `clients/luv-and-ker/` is re-exported via
  this generator, the resulting tree should match the manually-built
  scaffold T5 shipped (commits `8f0bb01` + `2fc3ae1`). Q-ASSUMED any
  divergence is treated as operator hand-edits and preserved (per the
  ledger contract). T5 can then keep his manual edits while the
  generator owns the canonical baseline.
- **T2 future**: client-side preset picker dropdown + brand-override
  form + diff-preview UI. v1 ExportPage is server-rendered and
  parameter-driven (`?clientId=…&presetId=…`); polish round adds
  client interactivity.

## 12. NOT in scope (per the prompt)

- No real Vercel deploy — config + repo write only. Deployment is a
  separate operator action.
- No domain-attach flow — preset's `defaultBrand` carries no
  `customDomain` field in v1; T1's eventual domain-attach round wires
  this.
- No "delete client portal" flow — once exported, the folder stays in
  repo until manually removed.
- No restructuring of `clients/felicias perfect portal/` (read-only
  reference; future round migrates).
- No source edits to other plugins.
- No real GitHub PR-open — `pr/open` is a stub returning a manual-flow
  message. Foundation wires the real integration in a future round.

## 13. Verification commands

```bash
cd "04-the-final-portal/plugins/portal-export"

# tsc clean
npx tsc --noEmit

# 5/5 smoke pass
npx tsx --test src/__smoke__/export.test.ts
```
