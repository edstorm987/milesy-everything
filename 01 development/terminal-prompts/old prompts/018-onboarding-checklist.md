/loop

# T2 — Round 018: `@aqua/plugin-onboarding-checklist`

Per-client onboarding checklist that the agency drives during the first
two phases (Epic Intro + Blueprint). Distinct from T1 R006 onboarding
dashboard (which surfaces phase-canonical milestones) — this plugin is
agency-customisable: add bespoke "do X for this client" items.

## Mandatory pre-read

1. T1 R006 onboarding dashboard (phase milestones — don't duplicate).
2. T2 client-tasks kanban shape (similar UI grammar).
3. T2 activity-inbox (emit shape).

## Scope

**A** — Manifest `scopePolicy: "client"`, soft-pairs `client-tasks`.
ActivityCategory `"onboarding"`.

**B** — Domain `ChecklistItem`: id, clientId, title, description,
ownerKind (agency / customer), status (todo / done / skipped),
dueAt?, completedAt?, completedBy?, ordering.

**C** — Default seed on install: 8 items typical of agency onboarding
(welcome call booked, gift sent, brand questionnaire, asset upload,
ad-account access granted, comms-channel confirmed, scope agreement
signed, kickoff scheduled). Idempotent.

**D** — Service: CRUD + reorder + bulk-tick + completionPct.

**E** — Routes: list / create / update / reorder / tick.

**F** — Admin tab on per-client overview: progress bar + grouped lists
(Agency owns vs Customer owns) + add-item form.

**G** — Customer-side block (renders in `/embed/[client]/customer`):
read-only with their own items tickable.

**H** — Cross-plugin: emits `onboarding.item.completed` activity events;
on 100% completion emits `onboarding.completed` + posts a kanban card
"Move to Diagnostics phase" to client-tasks if installed.

**I** — Smoke + chapter `04-plugin-onboarding-checklist.md` + MASTER row.

## NOT in scope

- AI-suggested items (R+1).
- Templates marketplace (R+1).

## When done
DONE referencing `018-onboarding-checklist.md`.
