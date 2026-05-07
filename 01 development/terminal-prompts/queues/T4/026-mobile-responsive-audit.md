/loop

# T4 — Round 026: Mobile-responsive audit across all surfaces

Audit every Milesy ecosystem surface (marketing site / HC / BOS /
Incubator / admin / niche landing) on mobile (390px wide) and tablet
(768px). Fix the worst offenders.

## Mandatory pre-read

1. T4 chapter #66 — full surface map.
2. T4 R008 marketing overhaul + R014 niche landings.

## Scope

**A** — Audit pass: open each surface (~25 pages) at 390px in
browser. Log overflow / readability / touch-target issues.

**B** — Fix top 15 worst issues. Common candidates: hero text
breaking, sticky bar overlap, sidebar wrap, 2-col grids becoming
1-col, dialog too wide.

**C** — Add `[data-mobile-checked]` attribute to each fixed page (an
audit trail for the chapter).

**D** — All breakpoints CSS-var-driven where reasonable.

**E** — Chapter R026 + MASTER delta documenting remaining minor
issues for follow-up.

## NOT in scope

- Native app shells.
- Tablet portrait / landscape distinct experiences.

## When done
DONE referencing `026-mobile-responsive-audit.md`.
