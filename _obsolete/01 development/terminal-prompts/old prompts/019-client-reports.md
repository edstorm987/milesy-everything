/loop

# T2 — Round 019: `@aqua/plugin-client-reports`

Auto-generated per-phase client reports. End of each phase → agency
generates a report (markdown + branded PDF stub) capturing "what we did,
what changed, what's next". Lightweight; placeholder data wiring (real
metrics arrive via T6 connectors).

## Mandatory pre-read

1. T1 phase transitions chapter.
2. T2 aqua-resources (similar content shape).
3. Honesty contract chapter #68.

## Scope

**A** — Manifest `scopePolicy: "client"`, ActivityCategory `"reports"`.

**B** — Domain `Report`: id, clientId, phaseId, status (draft /
published / sent), title, sections[], createdAt, publishedAt?,
sharedWithCustomer (bool).

**C** — `ReportSection`: id, kind (`summary | metrics | wins |
deliverables | next-steps`), title, body (markdown), data?
(structured for metrics/wins).

**D** — Service: createDraftFromPhase(clientId, phaseId) — pre-fills
sections from the phase's deliverables (pull from R006 milestones) +
empty metrics placeholder ("Connect <connector> to populate"); publish;
markSent.

**E** — Routes: list / create / get / patch / publish / mark-sent.

**F** — Admin pages: Reports list (per client) · Editor (markdown
sections + structured metrics editor) · Preview (branded shell).

**G** — Customer-side block `client-report-card` shown in
`/embed/[client]/customer` listing published reports + view links.

**H** — Cross-plugin: on phase advance (T1 event), auto-creates a
draft report for the just-completed phase.

**I** — Smoke + chapter `04-plugin-client-reports.md` + MASTER row.

## NOT in scope

- Real PDF rendering (R+1 — for now generate browser-print HTML view).
- Real connector data (T6).

## When done
DONE referencing `019-client-reports.md`.
