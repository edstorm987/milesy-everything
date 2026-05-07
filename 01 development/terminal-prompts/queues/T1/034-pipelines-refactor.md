/loop

# T1 — Round 034: "Clients" → "Pipelines" — multi-pipeline kanban model

Today the agency portal has one Kanban board and one "Clients" list.
Ed wants **named pipelines** (fulfilment / leads / sales / custom)
where each is its own kanban with its own columns + cards. "Clients"
becomes one of N pipelines (the fulfilment one).

This is a foundation refactor — domain model + nav + sidebar. The
kanban-rendering UI continues to live in the kanban plugin (T2);
foundation just exposes the multi-pipeline concept.

## Pre-read

- Existing `Client` domain + `Phase` model.
- Existing `client-tasks` kanban plugin (T2) — single board today.
- `AgencyToolsBallpark.tsx` — sidebar already updated to label
  "Pipelines" instead of "Clients" (commander-side polish).

## Scope

**A** — Domain `Pipeline`: `{id, agencyId, kind: "fulfilment" |
"leads" | "sales" | "custom", name, slug, columns: PipelineColumn[],
sortOrder}`. `PipelineColumn`: `{id, label, color?, order}`.

**B** — Default seed on agency bootstrap: one `fulfilment` pipeline
with columns matching today's stage enum (Discovery / Design /
Onboarding / Live / Churned), one `leads` pipeline (New · Contacted ·
Qualified · Won · Lost), one `sales` pipeline (Discovery · Proposal ·
Negotiation · Won · Lost). Idempotent.

**C** — `/portal/agency` — replace the single "Clients grid" with a
**Pipelines hub**. Each pipeline rendered as a clickable card →
`/portal/agency/pipelines/<slug>`. Default landing: fulfilment.

**D** — `/portal/agency/pipelines/<slug>` — kanban view powered by
the kanban plugin (R+1 plugin extension). Header: pipeline-switcher
dropdown + "+ New pipeline" button.

**E** — `Client` domain stays — clients are an entity that can sit
on the fulfilment pipeline. Other pipelines (leads, sales) carry
**non-client cards** (a "lead" is just an email + phone, not a full
client until promoted).

**F** — `PipelineCard` polymorphic union: `{kind: "client", clientId}`
or `{kind: "lead", lead: LeadSnapshot}` etc. Each pipeline declares
its allowed card kinds.

**G** — Migration runner: existing single Kanban board projects to
the new `fulfilment` pipeline + existing clients populate as cards.

**H** — Smoke ≥15 covering: pipeline CRUD · default seed · multi-
pipeline reads · client→fulfilment-card projection · migration
idempotence · slug uniqueness within agency.

**I** — Chapter `04-pipelines-refactor.md` + MASTER row.

## NOT in scope

- The kanban-card UI itself (T2 R027 next round will extend the
  kanban plugin to render polymorphic pipeline cards).
- CSV import for leads (T2 R028).
- Email-campaign automation hooked to leads pipeline (T2 R029).

## When done
DONE referencing `034-pipelines-refactor.md`.
