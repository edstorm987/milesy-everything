/loop

# T3 — Round 028: Save block group as reusable component

Operator selects N blocks → "Save as component" creates a reusable
unit they can drop into any page. Updates to the source propagate to
all instances.

## Mandatory pre-read

1. Existing block tree mutation surface.
2. T3 R022 version history.

## Scope

**A** — `Component` domain: `{id, name, category, tree, createdAt}`.
Stored per-install.

**B** — Multi-select blocks → context-menu "Save as component" → name
prompt → saves snapshot.

**C** — "Components" sidebar tab lists saved components for insert.

**D** — Insert places a `componentRef` block; renderer expands inline
to current source tree.

**E** — Edit-source flow: editing component updates all references
on next render.

**F** — Smoke + chapter `04-block-group-reuse.md` + MASTER row.

## NOT in scope

- Per-instance overrides (Figma-style).
- Cross-tenant component library.

## When done
DONE referencing `028-block-group-reuse.md`.
