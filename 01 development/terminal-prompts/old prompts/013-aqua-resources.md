/loop

# T2 — Round 013: `@aqua/plugin-aqua-resources`

Per-Aqua-phase resource shelf. Pulls SOPs by tag-family + Incubator
modules + tutorials. Surfaces in T4's Incubator "Aqua Resources Lite"
sub-page and in the agency portal's left nav.

## Mandatory pre-read

1. `04-aqua-internals-reference.md` §15c (Resources Lite cards), §13
   (SOP shelf taxonomy), §15g.
2. T2 sops chapter — tag-family taxonomy.

## Scope

**A** — Manifest (`scopePolicy: "agency"`, `requires: ["sops"]`).
ActivityCategory `"resources"`.

**B** — Domains: `ResourceCollection` (id / name / phaseScope[] /
items[]), `ResourceItem` (kind: `sop|module|tutorial|video|link` /
ref / title / coverImg).

**C** — Default seeded collections (idempotent on install):
- Incubator Modules (links to lessons + SOPs by tag `incubator/`).
- Personal AI Assistants (Aqua AI tutorial + prompt library).
- AquaSuite GHL Tutorial.
- My Business OS Tutorial.
- Where Time Is No Longer Tied To Income.

**D** — 1 admin page: Resources editor (collections + items + reorder).
Per-phase visibility filter.

**E** — Read-only `GET /resources?phase=blueprint` endpoint consumed by
T4 Incubator app.

**F** — Smoke + chapter `04-plugin-aqua-resources.md` + MASTER row.

## NOT in scope

- Hosting actual videos (links only).
- Per-resource analytics.

## When done
DONE referencing `013-aqua-resources.md`.
