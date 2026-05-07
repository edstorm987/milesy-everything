/loop

# T4 — Round 003: BOS phase-aware deep-linking from Incubator

Make the BOS bridge phase-aware. From phase-2 Blueprint card → BOS
opens to "About my business". From phase-3 Diagnostics → opens to
Health Check. From phase-4 Brand Builder → opens to "My customers" +
Lessons. State sync via `bos.deepLink` localStorage flag.

## Mandatory pre-read

1. T4 R001 chapter — Incubator → BOS bridge.
2. T4 chapter #73 (architecture ref) — bos.js entry points.
3. T4 R002 — per-phase pages.

## Scope

**A** — Each phase Incubator page's "Open BOS" CTA writes
`bos.deepLink` ({ section, lesson?, ts }) before navigating.

**B** — `bos.js` boot reads `bos.deepLink`, scrolls/expands target
section, clears the flag once consumed.

**C** — BOS sidebar gains "Back to your phase" pill (replaces R001
generic "Back to Incubator") that returns to the originating phase
page.

**D** — Audit existing BOS sections (Home / About / Customers /
Numbers / To-dos / Files / Lessons / HC) — ensure each is deep-linkable
by anchor `#bos-{section}`.

**E** — Smoke + chapter update + MASTER row delta.

## NOT in scope

- New BOS sections.
- Cross-tab deep-link sync.

## When done
DONE referencing `003-bos-deep-link-from-incubator.md`.
