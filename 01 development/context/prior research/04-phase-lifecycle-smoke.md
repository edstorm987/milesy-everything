# Phase lifecycle smoke (T2 R3)

End-to-end validation of the phase-preset architecture. Two smokes — one
in-process against the plugin's services with mocked ports, one HTTP
against the live foundation — both walk a fresh client through every
phase advance and surface any plumbing that doesn't match the locked
design.

> Built by T2 on 2026-05-04 as part of Round 3, on top of T1's Round-3
> wire-up ([04-foundation-round3.md](04-foundation-round3.md)).

## 1. Two smoke harnesses, one walkthrough

| Smoke | File | Runs against | Run with |
|-------|------|--------------|----------|
| In-process (`node:test`) | `04-the-final-portal/plugins/fulfillment/src/__smoke__/lifecycle.test.ts` | The plugin's services + in-memory port mocks. No DB, no HTTP. | `npm run smoke` (= `tsx --test`) inside `plugins/fulfillment/` |
| HTTP | `04-the-final-portal/plugins/fulfillment/src/__smoke__/lifecycle.http.mjs` | A live `npm run dev` of `portal/`. Hits every dispatcher + handler. | `node src/__smoke__/lifecycle.http.mjs` after `cd portal && AQUA_DATA_DIR=/tmp/aqua-smoke-data NEXT_PUBLIC_DEV_BYPASS=1 npm run dev` |

Both smokes encode the same lifecycle contract. The in-process one is
fast and asserts the plugin contract independently of T1+T3's wiring;
the HTTP one is slow and confirms T1's catch-all dispatcher, auth
cookie, plugin runtime adapter, and activity log all line up with the
plugin's own services.

## 2. The lifecycle (what the smoke validates)

```
seedDefaultPhases   →  6 PhaseDefinition rows (discovery → churned)
createWithPhase     →  Client at discovery   + preset installed     + variant applied + checklist initialised + client.created activity
                                                                          ↓
                                                          tick every internal + client checklist item
                                                                          ↓
advancePhase × 4    →  discovery → design → development → onboarding → live
                       (each step: disable old-only plugins, enable new ones,
                        apply starter variant, update client.stage,
                        re-init checklist, log + emit phase.advanced)
                                                                          ↓
final state         →  client.stage = "live"
                       live preset enabled, earlier-only plugins disabled (config preserved)
                       4 × phase.advanced in activity log + event bus
                       5 × applyStarterVariant calls (one per phase entry)
                       marketplace surface reflects install + enabled state
```

## 3. In-process smoke

`lifecycle.test.ts` builds in-memory implementations of all eight
foundation ports (`ClientStorePort`, `PluginInstallStorePort`,
`PluginRuntimePort`, `PluginRegistryPort`, `PhaseStorePort`,
`ActivityLogPort`, `EventBusPort`, `PortalVariantPort` plus the
plugin's own `PluginStorage`), constructs the fulfillment container
via `buildFulfillmentContainer({...})`, and walks the lifecycle
with `node:test` `describe`/`test` blocks.

Why mocks instead of importing T1's modules: keeps the smoke tsc-clean
inside the plugin folder (the package's contract is "no foundation
import"). Same shape as the foundation's real adapters, so wiring up an
integration test in the foundation suite is a one-call swap of the port
constructors.

### Test structure (9 tests, run sequentially in one suite)

1. `step 0: agency seeds default phases` — `seedDefaultPhases` is idempotent and yields `discovery → churned`.
2. `step 1: create fresh client at discovery phase` — install records exist, variant applied to `"login"` surface, checklist initialised, `client.created` logged.
3. `step 2: tick all checklist items in the discovery phase` — every tick emits `phase.checklist_item_completed` and the gate flips to `allRequiredComplete: true`.
4. `step 3.{from→to}: advancePhase` × 4 — disabled set = `from.preset \ to.preset`, enabled set = `to.preset`, install rows for disabled plugins remain with `enabled=false` (config preserved), `client.stage` updated, exactly one variant apply, exactly one `phase.advanced` event + activity entry.
5. `step 4: final state is live with the live preset` — five variant applies in order (`starter-discovery → starter-design → starter-development → starter-onboarding → starter-live`), live preset enabled, all earlier-only plugins disabled.
6. `step 5: marketplace + activity surfaces reflect the journey` — `marketplaceService.listForClient` returns cards with `installed`/`enabled` matching the install store, and the activity log carries `client.created` + 4 × `phase.advanced`.

### Programmatic entry point

The same file exports `runLifecycleSmoke()` that returns a structured
`LifecycleSmokeReport` for any future integration suite that wants to
assert on the trail without going through `node:test`.

### Result

```
▶ phase lifecycle smoke
  ✔ step 0: agency seeds default phases
  ✔ step 1: create fresh client at discovery phase
  ✔ step 2: tick all checklist items in the discovery phase
  ✔ step 3.discovery→design: advancePhase
  ✔ step 3.design→development: advancePhase
  ✔ step 3.development→onboarding: advancePhase
  ✔ step 3.onboarding→live: advancePhase
  ✔ step 4: final state is live with the live preset
  ✔ step 5: marketplace + activity surfaces reflect the journey
ℹ tests 9   ℹ pass 9   ℹ fail 0
```

## 4. HTTP smoke

`lifecycle.http.mjs` — vanilla Node, no test runner, exit 1 on first
assertion failure. Assumes the dev server is running on port 3030 with
`NEXT_PUBLIC_DEV_BYPASS=1` (otherwise `seed-demo` returns 403).

Steps in order:

1. `POST /api/dev/seed-demo` — creates Demo · Aqua + Felicia mirror + demo owner / client credentials (idempotent on re-run).
2. `POST /api/auth/login` as `demo@aqua.dev` — captures the `lk_session_v1` cookie for every subsequent call.
3. `GET /api/portal/fulfillment/phases` — pulls the six seeded phase definitions, indexes by stage.
4. `POST /api/portal/fulfillment/clients` — creates **HTTP Smoke Co**, distinct from the seeded Felicia mirror, at the `discovery` stage.
5. For each `(from, to)` in `[(discovery, design), (design, development), (development, onboarding), (onboarding, live)]`:
   - Tick every checklist template item via `POST /api/portal/fulfillment/checklist/tick`.
   - `POST /api/portal/fulfillment/phase/advance` with `{ clientId, fromPhaseId, toPhaseId }` — assert 200 + `body.ok=true` + `body.client.stage === to`.
6. `GET /api/portal/fulfillment/clients` — confirm our client still listed, `stage = "live"`.
7. `GET /api/portal/fulfillment/activity?clientId=…` — confirm 4 × `phase.advanced` entries.
8. `GET /api/portal/fulfillment/marketplace?clientId=…` — confirm the live preset (`website-editor`, `ecommerce`) all show `enabled=true`.

### Result

```
→ Lifecycle HTTP smoke (target http://localhost:3030)
✓ seed-demo returns ok                       ✓ session cookie set
✓ phases.length === 6                        ✓ POST /clients returns 201
✓ client.stage = discovery on create
✓ advance discovery→design: 200, ok, stage=design
✓ advance design→development: 200, ok, stage=development
✓ advance development→onboarding: 200, ok, stage=onboarding
✓ advance onboarding→live: 200, ok, stage=live
✓ final stage = live
✓ 4 phase.advanced entries logged
✓ live preset (ecommerce, website-editor) all enabled in marketplace

Failures: 0
```

(Per phase, the 5 checklist ticks each return 200 and pass — full log
in the test file. ~50 assertions total, 0 failures.)

## 5. Bugs surfaced + fixes shipped

### Bug A — default phase presets referenced unregistered plugins

**Symptom (HTTP smoke first run).** Every `phase/advance` returned 422
with `step: "enable"` and an error like
`install brand: Plugin "brand" not found.`. The in-process smoke
masked this by stub-registering placeholder plugins, but against the
real foundation registry only `fulfillment`, `website-editor`, and
`ecommerce` exist.

**Root cause.** `presets.ts` (T2 R1) carried a wishlist of plugins
that hadn't been built yet — `brand`, `forms`, `email`, `analytics`,
`seo`, `support` — directly inside `pluginPreset` arrays. The
foundation's `installPlugin` is strict: unknown plugin id → `ok:false`,
which the transition service surfaces as `step: "enable"`.

**Fix (this round).** Trimmed `DEFAULT_PHASE_PRESETS` to reference only
plugins that actually ship in the foundation registry today:

| stage | new pluginPreset | was |
|-------|------------------|-----|
| discovery | `[]` | `["brand", "forms"]` |
| design | `["website-editor"]` | `["brand", "website-editor"]` |
| development | `["website-editor"]` | `["website-editor", "forms", "email"]` |
| onboarding | `["website-editor", "ecommerce"]` | `["website-editor", "email", "analytics"]` |
| live | `["website-editor", "ecommerce"]` | `["website-editor", "email", "analytics", "seo", "support"]` |
| churned | `[]` (unchanged) | `[]` |

The header comment on `presets.ts` was updated to call out the rule:
"Only plugins that the foundation actually ships in its registry can be
referenced here." Future plugins are surfaced as TODOs in the
chapter rather than pre-baked into the seed.

**Migration note for already-seeded agencies.** Phase definitions are
stored as data, so existing rows still carry the old presets. To pick
up the new defaults: delete `04-the-final-portal/portal/.data/portal-state.json`
(dev) and re-bootstrap, OR have the agency owner edit phases via the
phase settings UI. The orchestrator may want to script a one-shot
migration that overwrites preset arrays for the demo agency.

### Bug B — variant ids in seeded phases don't exist in T3's editor

**Symptom (HTTP smoke).** Each `phase/advance` activity log carries a
`phase.variant_apply_failed` entry alongside the `phase.advanced`
entry, with `error: "unknown variantId: starter-live"` (etc.).

**Root cause + design intent.** The default presets reference variant
ids `starter-discovery`, `starter-design`, …, `starter-live` — these
are placeholder names, not actual T3 starter variants. T3's R1 chapter
says "6 starter JSON trees" exist, but they're not registered under
those names.

**Status.** Not a bug per se — the architecture says transitions
soft-fail on variant errors (`04-architecture.md §7`,
`04-plugin-fulfillment.md "Transition algorithm" step 3`). The smoke
confirms the soft-fail path: `phase.advanced` still fires, the
disabled/enabled diff still applies, the client stage still moves.
The variant id mismatch is a downstream T3+T2 alignment task —
either T3 publishes a list of canonical starter variant ids that T2's
defaults reference, or the foundation rewrites the phase
`portalVariantId` on apply if it doesn't match. Logged for a future
round; not blocking the lifecycle.

### Observation A — install-link refresh is non-obvious

**Symptom.** After editing `presets.ts`, the dev server kept running
the old preset arrays even after `npm install` in `portal/`.
`grep "pluginPreset:" portal/node_modules/@aqua/plugin-fulfillment/src/server/presets.ts` still showed the old values.

**Root cause.** `install-links=true` only re-copies the workspace dep
when the install graph changes. A pure source edit doesn't bump the
graph. The fix that worked: `rm -rf portal/node_modules/@aqua/plugin-fulfillment && npm install` inside `portal/`.

**Action.** Add a note to `portal/.npmrc`'s comment block + foundation
chapter: "edit a plugin source → `rm -rf node_modules/@aqua/plugin-X
&& npm install` to refresh the copy." (Foundation-side; T2 logging it
here for the orchestrator to pick up.)

### Observation B — `seed-demo` requires `NEXT_PUBLIC_DEV_BYPASS=1` for unauthenticated callers

The endpoint is gated on either env-var bypass OR an authenticated
agency-owner / agency-manager session. Testing flows that haven't
authenticated yet (the smoke's first call) can't pass through without
the env var. Documented in the smoke script's preamble.

## 6. What this validates about the architecture

| Architecture clause | Verified by |
|----------------------|-------------|
| `04-architecture.md §7`: phases stored as data, six defaults, agency-customisable | `seedDefaultPhases` test + idempotency check |
| Decisions log #4: auto-disable on transition, config preserved | `step 3` per-hop assertion: install rows with `enabled=false` for old-only plugins |
| Decisions log #4: never auto-uninstall | install row count never decreases through any advance |
| `04-plugin-fulfillment.md` Transition algorithm: 7 steps in order | every `step 3` test asserts the 7th-step `phase.advanced` event after the diff |
| Soft-fail on variant errors | observed in the HTTP smoke's activity log; transition still succeeds |
| `04-foundation-round3.md` route resolver: `/api/portal/<plugin>/<sub>` dispatches to the manifest | every HTTP route in the smoke returns 200 from a plugin handler |
| Foundation port shapes match T2's `ports.ts` | smoke uses the port types directly; tsc-clean confirms structural match |

## 7. Cross-team handoffs surfaced

- **Foundation (T1)**: consider adding `/api/dev/seed-demo` migration option (`?reset=phases-only`) so trimming the presets doesn't require deleting `portal-state.json`.
- **Editor (T3)**: publish a canonical list of starter-variant ids the fulfillment plugin's defaults can reference. Until then, variant applies soft-fail with logged warnings.
- **Future plugins** (`brand`, `forms`, `email`, `analytics`, `seo`, `support`, `agency-hr`): when each lands, an agency owner can edit the relevant phase via the phase settings UI to reintroduce the plugin to the preset; no T2 code change needed.

## 8. How to run

```bash
# In-process (fast, no DB, no HTTP). 9 tests, < 200 ms.
cd "04-the-final-portal/plugins/fulfillment"
npm run smoke

# HTTP (slow, real foundation). ~50 assertions, ~5 s including server cold-start.
cd "04-the-final-portal/portal"
rm -rf .next .data                                                  # clean slate (optional)
AQUA_DATA_DIR=/tmp/aqua-smoke-data NEXT_PUBLIC_DEV_BYPASS=1 npm run dev   # in one terminal
# in a second terminal:
cd "04-the-final-portal/plugins/fulfillment"
node src/__smoke__/lifecycle.http.mjs
```

If you've edited `plugins/fulfillment/` source between runs:
`rm -rf portal/node_modules/@aqua/plugin-fulfillment && (cd portal && npm install)`
to refresh the install-link copy before restarting `npm run dev`.
