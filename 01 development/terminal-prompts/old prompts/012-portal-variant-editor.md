/loop

# T3 — Round 012: Portal-variant editor

Per chapter 08, every client has multiple portal variants
(login / dashboard / orders / members / affiliate / start-here).
Each is its own block tree. Editor needs a variant switcher so the
operator can edit each in turn.

## Mandatory pre-read

1. Chapter 08 (Aqua portal variants) — `PortalRole`, `isActivePortal`,
   starter trees.
2. T3 prior rounds — current single-page editor shape.
3. T4 R001 — Incubator surface as a variant target.

## Scope

**A** — Editor topbar gains "Variant" dropdown — lists active variants
+ "+ New variant" affordance. Switching variant loads its tree.

**B** — Per-variant `PortalRole` chip (account / customer / member /
affiliate / start-here / other) — drives default visibility rules.

**C** — `setActivePortal(variantId)` server action — flips the
client's current rendered variant for end-customers.

**D** — Variant gallery: each variant shows preview thumbnail, last-
edited timestamp, role chip, status (draft / live).

**E** — Smoke + chapter `04-portal-variant-editor.md` + MASTER row.

## NOT in scope

- A/B testing variants.
- Multi-locale variants.

## When done
DONE referencing `012-portal-variant-editor.md`.
