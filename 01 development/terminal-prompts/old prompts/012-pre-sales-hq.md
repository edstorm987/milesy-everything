/loop

# T2 — Round 012: `@aqua/plugin-pre-sales-hq`

Pre-sales tooling: Discovery-call prep, lead-pipeline kanban context,
Re-Nurturing tracker. Distinct from generic `kanban` because it owns
per-lead context (call notes, proposal status, follow-up cadence).

## Mandatory pre-read

1. `04-aqua-internals-reference.md` §5 pre-onboarding pipeline + §6
   lead-pipeline kanban template.
2. T2 client-crm + kanban chapters.

## Scope

**A** — Manifest (`scopePolicy: "agency"`,
`requires: ["client-crm", "kanban"]`). ActivityCategory `"pre-sales"`.

**B** — Domains: `Lead` (vendored from client-crm), `DiscoveryCall`
(leadId / scheduledAt / completedAt / notes / outcome), `Proposal`
(leadId / sentAt / amount / status), `NurtureTouch` (leadId / type /
sentAt / response).

**C** — Services: `DiscoveryCallService`, `ProposalService`,
`NurtureService` (tracks Re-Nurturing cadence per Aqua's SOP).

**D** — 4 admin pages: Pre-sales board (lead-pipeline kanban with
extra per-card pre-sales fields), Discovery calls (upcoming + past),
Proposals (sent / accepted / rejected), Nurture loop (overdue follow-
ups).

**E** — Cross-plugin: subscribes to `client-crm` lead changes; emits
`pre-sales.proposal-sent` event (consumed by `agency-marketing`).

**F** — Smoke + chapter `04-plugin-pre-sales-hq.md` + MASTER row.

## NOT in scope

- Real calendar integration (Calendly etc).
- Real proposal PDF generation.

## When done
DONE referencing `012-pre-sales-hq.md`.
