# `04` "Clients" → "Pipelines" multi-pipeline kanban refactor (T1 R034)

> Authored 2026-05-07. Foundation refactor: the single "Clients" grid
> retires; agencies now own N named **Pipelines** (fulfilment / leads /
> sales / custom) — each its own kanban board with its own columns and
> polymorphic cards. T2's kanban plugin (R+1) renders the actual board;
> foundation owns the domain shape, default seed, hub page, per-pipeline
> view, sidebar nav, and the migration runner.

## Files shipped

- `04-the-final-portal/milesymedia-website/src/server/types.ts` —
  NEW `PipelineKind` (`"fulfilment" | "leads" | "sales" | "custom"`),
  `PipelineCardKind` (`"client" | "lead" | "deal" | "custom"`),
  `PipelineColumn`, `LeadSnapshot`, `DealSnapshot`, polymorphic
  `PipelineCard` discriminated union, `Pipeline`. `PortalState` extended
  with `pipelines: Record<string, Pipeline>` + `pipelineCards: Record<string, PipelineCard>`.
- `src/server/storage.ts` — `empty()` seeds the two new bags;
  `parseBlob` injects defaults so legacy state files hydrate cleanly.
- `src/server/pipelines.ts` (NEW, ~400 lines) — pure domain layer:
  `createPipeline / getPipeline / getPipelineBySlug / listPipelines /
  updatePipeline / deletePipeline (cascade)`, default column packs
  (`fulfilmentColumns / leadsColumns / salesColumns`),
  `seedDefaultPipelines` (idempotent), `addCard` (kind enforcement via
  `allowedCardKinds`), `listCards / listCardsByAgency`,
  `projectClientsToFulfilmentCards` (read-only client→fulfilment
  projection used by the hub before any migration runs),
  `migrateClientsToFulfilment` (idempotent — second run reports
  `alreadyPresent: N`), `pipelineCardCounts`, `pipelineAllowsKind`,
  `promoteLeadCardToClient`, `FULFILMENT_STAGE_TO_COLUMN`
  (collapses every legacy + Aqua `ClientStage` onto one of 5 fulfilment
  columns).
- `src/server/agencyBootstrap.ts` — wires `seedDefaultPipelines` +
  `migrateClientsToFulfilment` into `bootstrapAgency` so a freshly-
  bootstrapped agency lands with three default pipelines and any
  pre-existing clients projected onto fulfilment.
- `src/app/portal/agency/page.tsx` (REWRITE) — was a single Clients
  grid; now the **Pipelines hub**. Renders welcome banner + KPI tiles
  + activity feed + a 3-column grid of pipeline cards (each → `/portal/
  agency/pipelines/<slug>`). `data-testid="agency-pipelines-hub"` +
  `data-testid="pipelines-grid"` + per-card
  `data-testid="pipeline-card-<slug>"` + `data-pipeline-kind="<kind>"`.
  Pipeline-card chip strip surfaces the column palette so the hub
  doubles as a pipeline-shape preview.
- `src/app/portal/agency/pipelines/[slug]/page.tsx` (NEW) — per-
  pipeline kanban view. Resolves `getPipelineBySlug`, 404s on miss.
  Renders header (kind label + name + pipeline-switcher dropdown +
  `+ New pipeline` link) + a horizontal column grid. Cards source
  by pipeline kind: fulfilment uses `projectClientsToFulfilmentCards`
  (so existing client rows show up immediately, before any migration);
  every other pipeline reads `listCards(pipeline.id)`.
  `data-testid="pipeline-view"` + `data-testid="pipeline-switcher"` +
  `data-testid="pipeline-columns"` + per-column `data-testid="column-<id>"`.
- `src/components/chrome/AgencyToolsBallpark.tsx` — sidebar
  "Pipelines" entry retargeted from `/portal/agency#clients` (anchor
  on a section that no longer exists) to `/portal/agency/pipelines/
  fulfilment` so the sidebar lands directly on the canonical fulfilment
  board.
- `scripts/smoke-pipelines-refactor.test.ts` (NEW, 19 cases) — full
  domain coverage via `tsx --test`. Stubs `server-only` via
  `createRequire` cache injection BEFORE dynamic imports so the
  storage / tenants / pipelines modules load under the test runner.
- `package.json` — registers `npm run smoke:pipelines-refactor`.

## Domain shape (locked-in this round)

- **Pipeline** — `{id, agencyId, kind, name, slug, columns,
  allowedCardKinds, sortOrder, createdAt, updatedAt}`. Slug unique
  within an agency (clash → numeric suffix `beta-2`, `beta-3`, …).
- **PipelineColumn** — `{id, label, color?, order}`.
- **PipelineCard** — discriminated union on `kind`. Foundation
  declares the four canonical kinds (`client / lead / deal / custom`);
  T2 R+1 may extend.
- Each pipeline declares its `allowedCardKinds`. `addCard` rejects
  silently (returns `null`) when the requested kind is not allowed —
  fulfilment is `["client"]` only; leads is `["lead"]`; sales accepts
  `["deal", "lead"]` so a hand-off from leads → sales doesn't lose
  history. Custom pipelines default to `["client"]` and can be edited
  via `updatePipeline`.

## Default seed (idempotent)

`seedDefaultPipelines(agencyId)` creates:

1. **Fulfilment** — Discovery / Design / Onboarding / Live / Churned
   (5 cols, allowedCardKinds: `["client"]`, sortOrder 0).
2. **Leads** — New / Contacted / Qualified / Won / Lost
   (5 cols, allowedCardKinds: `["lead"]`, sortOrder 1).
3. **Sales** — Discovery / Proposal / Negotiation / Won / Lost
   (5 cols, allowedCardKinds: `["deal", "lead"]`, sortOrder 2).

Re-running the seed on an agency that already owns a pipeline of the
same kind is a **no-op** — the existing row wins and is returned via
`SeedDefaultPipelinesResult.existing`. Bootstrap wires the seed first
so kanban-aware plugins find a fulfilment row to attach to.

## Migration runner

`migrateClientsToFulfilment(agencyId)` walks every client row in the
agency and creates a `kind: "client"` pipeline card on the fulfilment
pipeline at the column derived from `FULFILMENT_STAGE_TO_COLUMN[stage]`
(default discovery). Idempotent — a client already represented as a
card is skipped; second run reports `{created: 0, alreadyPresent: N}`.
Bootstrap calls the migration immediately after seed so existing
agencies upgraded to R034 inherit a populated fulfilment board.

## Hub vs per-pipeline view

- **Hub** (`/portal/agency`) — KPIs + activity feed first (chapter
  context for the agency owner before they dive into a board), then the
  pipeline grid. Each card shows `name`, `kind`, card-count chip, and a
  rendered preview of the column palette.
- **View** (`/portal/agency/pipelines/<slug>`) — header (pipeline
  metadata + switcher + new-pipeline link) + horizontal column grid.
  Foundation renders a static, accessible snapshot of the board today;
  T2 R+1 will swap the body for the real drag-drop kanban via the
  catch-all plugin route. Hub + view share `getPipelineBySlug` so the
  switcher dropdown is just a regular `<select>` (no client-side router
  hijacking required for a v1 surface).

## Polymorphic card rendering (foundation snapshot)

The per-pipeline view collapses each card kind into a `{label, sub?,
href?}` triplet for the column-list render:

- `client` cards → `{label: client.name, sub: phaseLabel(stage),
  href: /portal/clients/<id>}`.
- `lead` cards → `{label: lead.name ?? lead.email, sub: lead.source}`.
- `deal` cards → `{label: deal.title, sub: $amount}`.
- `custom` cards → `{label: "Custom card"}` placeholder.

T2's kanban plugin (R+1) replaces this projection with the real
drag-drop column body; foundation's job is to ship a contract the
plugin can target.

## Smoke (19 cases, all pass)

`npm run smoke:pipelines-refactor` — 19/19 via `tsx --test` (~1.7s).
4 suites:

- **Domain model (8)** — PortalState type carries `pipelines` +
  `pipelineCards`; storage parser injects defaults; create/get round-
  trip; `getPipelineBySlug` refuses cross-agency reads; `listPipelines`
  sorted by `sortOrder` + scoped; slug clash → numeric suffix;
  `updatePipeline` patches + refuses cross-agency; `deletePipeline`
  cascades pipelineCards rows.
- **Default seed (3)** — creates fulfilment + leads + sales w/ correct
  columns + allowedCardKinds; idempotent on re-run; stage-to-column
  table covers every `ClientStage`.
- **Cards + projection + migration (4)** — `addCard` enforces
  `allowedCardKinds`; client→fulfilment projection maps stage → column
  correctly; migration runner is idempotent (no duplicate cards);
  `pipelineCardCounts` surfaces fulfilment via client count when no
  migration has run yet.
- **Wiring (4)** — bootstrap wire-up; hub testid + seed call;
  `[slug]` view testids + `getPipelineBySlug` + `notFound`; sidebar
  nav points at `/portal/agency/pipelines/fulfilment`.

`npx tsc --noEmit` — clean.

## Q-ASSUMED

- **Hub keeps the dashboard tiles** instead of being a pure pipelines
  list. Reasoning: agency owner needs a glance at KPIs + activity
  before they drill into a single board; if Ed prefers a pipelines-only
  hub the section can be lifted into a `_HomeTiles` component and a
  variant prop swap.
- **`development` legacy stage collapses into `design`** in the
  fulfilment column map — pre-Aqua leftovers, not enough rows to
  warrant a 6th column.
- **Sales pipeline accepts both `deal` and `lead` card kinds** so the
  obvious lead-to-sales hand-off doesn't lose card history. Adjustable
  per-agency via `updatePipeline({allowedCardKinds})`.
- **Pipeline-switcher dropdown is a static `<select>`** for v1 — no
  client-side router hijack; clicking a different option doesn't
  navigate yet. T2's kanban plugin (R+1) replaces the header so this
  is a deliberate seam, not a bug.
- **`+ New pipeline` link points at `/portal/agency/pipelines/new`**
  which doesn't exist yet — placeholder that resolves through the
  agency catch-all plugin route until the create-pipeline form lands
  in a follow-up round (foundation domain `createPipeline` is ready;
  the form + handler is the only missing surface).
- **Card-count surfacing for fulfilment** uses client count when no
  cards exist yet (so the hub never reads zero for an agency that has
  clients but hasn't been migrated). Once `migrateClientsToFulfilment`
  runs, real card count wins.
- **Smoke test bootstrapping** stubs `server-only` via require-cache
  injection before dynamic imports — same idea as the founder-seed
  smoke; cleaner than mirroring 400 lines of domain logic into the
  test file.
- **Linter race on `types.ts`**: a background linter wiped my first
  Pipelines type insertion mid-edit; the second pass (re-add at end of
  file with fresh Read) survived. tsc + smoke green at ship time.

## NOT in scope (handed off)

- T2 R027 — kanban plugin extension to render polymorphic cards.
- T2 R028 — CSV import for leads.
- T2 R029 — email-campaign automation hooked to the leads pipeline.
- Foundation `+ New pipeline` form + handler (placeholder link this
  round; form deferred to follow-up).
- Pipeline-switcher router hijack (replaced by kanban plugin shell).

## Hand-off

After R034 the foundation surface for pipelines is **complete**:
T2 can boot kanban against `listPipelines / listCards /
projectClientsToFulfilmentCards` without needing any further foundation
changes. Sidebar Pipelines entry now lands on the canonical fulfilment
board; the hub doubles as the agency dashboard.
