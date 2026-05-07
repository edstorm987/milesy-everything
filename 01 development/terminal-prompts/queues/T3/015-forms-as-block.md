/loop

# T3 — Round 015: Forms-as-block — wire `forms` plugin into editor

Per `forms` plugin (existing T2 deliverable): forms collect lead /
contact / brief data. Make every form droppable as a block in any
website-editor page.

## Mandatory pre-read

1. T2 forms plugin chapter.
2. T3 block-renderer + plugin block contributions pattern.

## Scope

**A** — New block `formEmbed` with property `formId` (picker that
lists available forms from the forms plugin).

**B** — Live render fetches form schema, renders fields, posts to
`POST /api/portal/forms/:formId/submit`. Honeypot + rate-limit per
form ip.

**C** — Editor: form picker modal — lists forms with name + field
count + submission count + "+ Create new form" CTA linking to forms
admin.

**D** — Submission confirmation: configurable success message OR
redirect URL OR show inline thank-you block.

**E** — Smoke + chapter `04-forms-as-block.md` + MASTER row.

## NOT in scope

- Building forms plugin from scratch (already exists).
- Form analytics (forms plugin owns).

## When done
DONE referencing `015-forms-as-block.md`.
