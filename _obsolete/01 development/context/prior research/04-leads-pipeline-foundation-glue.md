# 04 — Leads-pipeline foundation glue (T1 R037)

T2 R027 (chapter #157) shipped `@aqua/plugin-leads-pipeline` end-to-end
with 5 foundation-side hooks pending. R037 closes all five so the leads
side of the R034 pipelines refactor (#156) is alive end-to-end.

## Goals shipped

- **A — ActivityCategory union extension.**
  `src/server/types.ts` adds `"leads"` to `ActivityCategory`; the chip
  styling map in `src/lib/chrome/activityCategoryStyle.ts` adds a
  `{color: "#10b981", icon: "🌱", label: "Leads"}` row + appends
  "leads" to `CATEGORY_FILTER_ORDER`.

- **B — Workspace dep + transpilePackages + registry registration.**
  `package.json` registers `@aqua/plugin-leads-pipeline` as a workspace
  dep (`file:../plugins/leads-pipeline`) and adds the
  `smoke:leads-pipeline-foundation-glue` script. `next.config.ts`
  transpilePackages array gains the same id (alphabetical between
  fulfillment + memberships). `src/plugins/_registry.ts` imports the
  manifest, appends it to `PLUGINS`, and side-effect imports
  `./foundation-adapters/leadsPipelineFoundation` so the registration
  fires at boot.

- **C — EmailEnqueuePort adapter onto email-sender.**
  `src/lib/server/leadsPipelinePorts.ts` exports `emailEnqueuePort`.
  Implements `enqueue` by lazily dynamic-importing
  `@aqua/plugin-email-sender/server` (foundation-pending — that plugin
  isn't yet registered in the foundation), looking up the agency's
  email-sender install, building a per-agency container, and calling
  `EmailService.enqueue` with `triggeredByPlugin` + `externalRef`
  forwarded verbatim. Default identity comes from email-sender's own
  `IdentityService` (no override). Throws a clear "foundation-pending"
  error when email-sender isn't installed/registered.

- **D — PipelinePort adapter onto R034 pipelines.ts.**
  Same `leadsPipelinePorts.ts` exports `pipelinePort`:
  - `addLeadCard({agencyId, leadId, email, name?, source, columnId?})`
    → resolves the leads pipeline via `getPipelineBySlug(agencyId,
    "leads")`, picks the "New" column (label match → id match → first
    column fallback), calls `addCard({kind: "lead", lead: {...,
    leadId}})`. The `leadId` is stamped onto the LeadSnapshot for
    reverse-lookup. Returns null when no leads pipeline is seeded.
  - `leadIdsInColumn({agencyId, columnLabel})` → walks
    `listCardsByAgency(agencyId)`, filters `kind === "lead"` cards on
    the leads pipeline + matching column, projects `.lead.leadId`.
  - `columnLabelForLead({agencyId, leadId})` → reverse lookup over
    the same set, returns the column's `label`.

- **E — Event-bus subscription wiring + `pipelines.card.moved` emit.**
  `src/plugins/foundation-adapters/leadsPipelineFoundation.ts`
  registers tenant + activity + event-bus + pluginInstall ports
  (shared via `_foundationPorts.ts`) plus the two new ports above,
  then for each entry in the plugin's exported `EVENT_SUBSCRIPTIONS`
  array (`["public-funnel.lead.captured", "pipelines.card.moved"]`)
  calls `subscribeForPlugin("@aqua/plugin-leads-pipeline", event,
  handler)` so the handler only fires when the plugin is installed
  for the (agencyId) scope. The handler builds the per-agency
  container via `containerFor` and dispatches to
  `handleFunnelLeadCaptured` or `handlePipelineCardMoved` from the
  plugin's server barrel.

  `src/server/pipelines.ts` gains a new `moveCard(agencyId, cardId,
  toColumnId) → MoveCardResult | null` helper. It updates `columnId`
  + `order` + `updatedAt` inside a `mutate()` block, then emits
  `pipelines.card.moved` on the foundation event bus with payload
  `{cardKind, cardId, fromColumn (LABEL), toColumn (LABEL), agencyId,
  leadId?}`. Same-column "moves" are no-op + don't re-emit
  (idempotent). The label projection ensures plugin handlers can do
  `toColumn === "Won"` semantics rather than column-id sniffing.

- **F — Smoke test (≥10 cases, 17 cases shipped).**
  `scripts/smoke-leads-pipeline-foundation-glue.test.ts` covers:
  source markers (10) — ActivityCategory union, chip resolves,
  `CATEGORY_FILTER_ORDER`, `_registry.ts` imports + manifest entry,
  side-effect import, `next.config.ts` transpile, `package.json` dep
  + smoke script, port source forwards `triggeredByPlugin` +
  `externalRef`, foundation adapter binds both subscriptions,
  `pipelines.ts` exports `moveCard` + emits `pipelines.card.moved`.
  Runtime (7) — `EVENT_SUBSCRIPTIONS` array shape, addLeadCard lands
  on "new" column, leadIdsInColumn returns stamped ids, columnLabel
  reverse-resolves, `moveCard` emits with `{cardKind: "lead",
  fromColumn: "New", toColumn: "Won", leadId}`, addLeadCard returns
  null when no leads pipeline exists, `isFoundationRegistered()`
  returns true after the adapter's side-effect import. **17/17 pass
  via `npm run smoke:leads-pipeline-foundation-glue`** (tsx --test).

- **G — Chapter (this file) + MASTER row + tasks.md tick + commit.**

## tsx ESM/CJS dual-loading gotcha

The smoke test originally read `isFoundationRegistered()` via a
top-level static `await import(...)` of the plugin module while the
foundation-side adapter (which contains the `import "server-only"`
directive at the top) loads under tsx via the **CJS** loader. Result:
two distinct module-instance copies of the plugin's `foundationAdapter`
state. The adapter registers in its own copy; the test's ESM-graph
copy of the module never sees it.

Fix: in the smoke test, import the foundation-adapter side-effect
file FIRST, then resolve the plugin module **through the same module
graph** via `createRequire(import.meta.url)("@aqua/plugin-leads-pipeline/server")`.
That uses CJS resolution (matching the adapter's path) and reads the
populated `registered` flag.

This is a tsx-only test-rig artifact — at Next.js runtime everything
loads through one bundler graph. Documented here so the next
foundation-side adapter doesn't bounce off the same trap.

## Foundation pending after R037

1. **Email-sender plugin needs its own foundation registration round.**
   `@aqua/plugin-email-sender` is NOT yet in `_registry.ts`. Until
   that lands, `emailEnqueuePort.enqueue()` throws a clear
   "foundation-pending" error, so leads-pipeline campaigns can't
   actually send. The plugin is otherwise ready (chapter #144).

2. **Plugin manifest id regex.** The registry validator rejects
   `id: "@aqua/plugin-leads-pipeline"` because it requires
   `/^[a-z][a-z0-9-]*$/`. T2's other plugins use bare ids
   (`affiliates`, `client-crm`, etc). The leads-pipeline manifest
   needs a T2-side rename to `leads-pipeline` (preserving the npm
   package name `@aqua/plugin-leads-pipeline`). Foundation-side our
   wiring uses `"@aqua/plugin-leads-pipeline"` as the
   `subscribeForPlugin` plugin-id — which won't match installs once
   the manifest gets the canonical id. Will need a one-line update
   here when T2 fixes the manifest.

3. **Manifest `panelId: "leads-pipeline"`** triggers a sidebar warning
   ("non-standard panelId"). Cosmetic, also a T2 plugin-side fix.

## Q-ASSUMED

- `pipelines.card.moved` payload uses **column LABEL** strings, not
  ids — matches plugin's `handlePipelineCardMoved` which checks
  `toColumn === "Won"`.
- `LeadSnapshot.leadId` is stamped via a permissive object spread
  (the foundation `LeadSnapshot` type doesn't currently model it).
  When R+1 promotes this to a typed field, drop the `as any` cast.
- `addLeadCard` defaults to the leads pipeline's "New" column via
  label match first, then `id === "new"`, then first column.
- `subscribeForPlugin` uses the npm package name as plugin-id (see
  Foundation pending #2).

## Files shipped

- `src/server/types.ts` — `ActivityCategory` `"leads"` added.
- `src/lib/chrome/activityCategoryStyle.ts` — chip + filter order.
- `src/server/pipelines.ts` — `moveCard` helper + emit.
- `src/lib/server/leadsPipelinePorts.ts` — NEW. Both ports.
- `src/plugins/foundation-adapters/leadsPipelineFoundation.ts` — NEW.
  Side-effect registration + per-event subscribers.
- `src/plugins/_registry.ts` — manifest import + side-effect import +
  PLUGINS array append.
- `next.config.ts` — transpilePackages.
- `package.json` — workspace dep + smoke script.
- `scripts/smoke-leads-pipeline-foundation-glue.test.ts` — NEW.
  17 cases.
