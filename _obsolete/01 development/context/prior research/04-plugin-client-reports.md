# `@aqua/plugin-client-reports` — T2 R019

Auto-generated per-phase client reports. End of each phase the agency
drafts a report (markdown sections + structured metrics + branded
print-friendly preview) capturing "what we did, what changed, what's
next". Lightweight: real PDF rendering and connector data are R+1 / T6.

## Manifest

- `id: "client-reports"`, `version: "0.1.0"`, `status: "alpha"`,
  `category: "ops"`.
- `scopePolicy: "client"`, `core: false`, no required deps.
- ActivityCategory `"reports"` (vendored ActivityCategory union
  appends; foundation `_registry.ts` will need the same append at
  wire-up).
- Storefront block descriptor `client-report-card` (T3 owns
  rendering — block id reserved here).
- Two settings: `autoDraftOnPhaseAdvance` + `defaultMetricsConnectors`.
- Three feature flags: `auto-draft`, `customer-block`, `metrics-honesty`.

## Domain

```ts
Report {
  id, agencyId, clientId, phaseId,
  status: "draft" | "published" | "sent",
  title, sections: ReportSection[],
  sharedWithCustomer: boolean,
  createdBy?, createdAt, updatedAt,
  publishedAt?, sentAt?
}

ReportSection {
  id, kind: "summary" | "metrics" | "wins" | "deliverables" | "next-steps",
  title, body /* markdown */, data?, ordering
}

MetricsSectionData {
  rows: MetricRow[],         // label, value, unit?, delta?, provisional?
  connector?: string,
  placeholder?: string,
}
```

`REPORT_TRANSITIONS`:
- `draft → published`
- `published → sent | draft` (unpublish back to draft is allowed)
- `sent → ()` terminal

## Service surface

`ReportService`:

- `list({ status?, phaseId?, sharedOnly? })` — sorted by `createdAt`
  desc. `sharedOnly` hides drafts AND non-shared published reports.
- `get(id)` — tenant-scoped null when out of scope.
- `create(actor, { phaseId, title, sections? })` — stamps draft.
  Sections are id-stamped + ordering normalised on the way in.
- `update(actor, id, patch)` — full-replaces sections shape; caller
  sends entire array, ordering renormalised to `[0, 1, …]`.
- `publish(actor, id)` / `markSent(actor, id)` / generic
  `transition(actor, id, to)`.
- `delete(actor, id)` — removes from global + per-phase indexes.
- `createDraftFromPhase(actor, opts)` — **idempotent per phase**:
  if a draft already exists for `phaseId`, returns it without
  duplicating. Pre-fills the 5 standard sections from `deliverables`
  + per-connector metrics placeholder blocks.
- `onPhaseAdvanced({ fromPhaseId, … })` — subscriber-style helper for
  the foundation phase-advance event router. Drafts for the
  just-COMPLETED phase (`fromPhaseId`).

## Default sections (auto-draft)

`buildDefaultSections` returns in this order:

1. **Summary** — markdown.
2. **Metrics** — one section per `metricsConnectors[]` entry; if the
   array is empty, a single generic placeholder block. Each carries
   `data: { rows: [], connector?, placeholder }` and a body of the
   `METRICS_PLACEHOLDER_BODY` honesty-contract string.
3. **Wins** — placeholder bullet.
4. **Deliverables** — bullet list of `deliverables[]` strings (or a
   "(no tracked deliverables)" placeholder when empty).
5. **What's next** — placeholder bullet.

Honesty contract (chapter #68): metrics without a connector show
"Connect <connector> to populate" + render with `provisional` styling
in the preview (asterisk + footer note).

## API surface

7 routes mounted at `/api/portal/client-reports/`:

| Path | Method | Roles |
|---|---|---|
| `list` | GET | viewers (incl. end-customer) |
| `get` | GET | viewers |
| `create` | POST | agency staff+ |
| `patch` | PATCH | agency staff+ |
| `publish` | POST | agency staff+ |
| `mark-sent` | POST | agency staff+ |
| `delete` | DELETE | agency staff+ |

`list` honours `?status=&phaseId=&sharedOnly=1`.

## Pages

- `ReportsListPage` (path `""`) — drafts + published/sent groups,
  data-* hooks per row.
- `ReportEditorPage` (path `"editor?id=…"`) — title + per-section
  textareas + Publish / Mark-as-sent buttons (gated by status).
- `ReportPreviewPage` (path `"preview?id=…"`) — branded print-friendly
  layout, metrics tables when `rows[]` populated, footer disclosure
  for provisional rows.
- `ReportsCustomerPage` (path `"customer"`) — `data-block="client-report-card"`
  storefront-grammar wrapper; only `sharedWithCustomer && status !== "draft"`.

## Cross-plugin contract — phase advance

Foundation event router calls `reports.onPhaseAdvanced(payload)` when
`feature["auto-draft"]` is on. Payload (`PhaseAdvancedEvent`):

```ts
{
  fromPhaseId, toPhaseId,
  fromPhaseLabel?, toPhaseLabel?,
  deliverables?,         // from R006 milestones; absent → empty
  metricsConnectors?,    // from manifest setting; absent → empty
}
```

Idempotent — re-fires never duplicate. The plugin doesn't subscribe
itself; foundation invokes the helper so the wiring stays out of the
plugin's runtime concerns.

## Smoke

`src/__smoke__/reports.test.ts` — 15/15 pass via `tsx --test`.

1. create stores draft + emits `reports.report.created`.
2. create rejects empty title / missing phaseId.
3. publish stamps `publishedAt` + emits `reports.report.published`.
4. invalid transition draft→sent throws `InvalidReportTransitionError`.
5. published→sent stamps `sentAt` + emits `reports.report.sent`.
6. published→draft unpublish path is allowed.
7. `createDraftFromPhase` with deliverables + connectors → 6 sections
   `[summary, metrics(ga4), metrics(stripe), wins, deliverables, next-steps]`,
   metrics rows empty + placeholder text mentions the connector.
8. `createDraftFromPhase` with no connector → single placeholder
   metrics block.
9. `createDraftFromPhase` idempotent — second call returns same id.
10. `onPhaseAdvanced` subscriber drafts for `fromPhaseId`.
11. update full-replaces sections + renormalises ordering to `[0, 1]`.
12. `list({sharedOnly})` hides drafts AND non-shared published reports.
13. delete removes + de-indexes both global + per-phase indexes;
    re-delete throws `ReportNotFoundError`.
14. Activity entries use category `"reports"` with `reports.*` prefix.
15. Tenant isolation — `client_other` sees nothing on shared storage.

`tsc --noEmit` clean.

## Foundation pending (standard 5-step + extras)

1. Workspace dep `@aqua/plugin-client-reports` in
   `milesymedia-website/package.json`.
2. `transpilePackages` += `@aqua/plugin-client-reports`.
3. Side-effect import calling `registerReportsFoundation` at boot.
4. `_registry.ts` append.
5. `ActivityCategory` += `"reports"` in foundation.
6. **Phase-advance event router**: when feature `auto-draft` is on,
   foundation invokes `reports.onPhaseAdvanced(payload)` after the
   transition; payload built from R006 milestones (`deliverables`)
   and the install's `defaultMetricsConnectors` setting.
7. T3: register renderer for storefront block id `client-report-card`.

## NOT in scope (R+1)

- Real PDF rendering — v1 ships browser-print HTML; chapter #68
  honesty contract enforces the provisional disclosure regardless.
- Real connector data (T6: ga4, stripe, posthog, …).
- Inline section reorder UX (operator can full-replace the sections
  array via PATCH; drag-drop UI deferred).

## R1 commit

T2 R019 single commit. After R019 T2 has shipped 15 plugins.
