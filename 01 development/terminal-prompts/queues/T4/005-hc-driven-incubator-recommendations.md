/loop

# T4 — Round 005: HC-driven Incubator next-actions

Per chapter #68 honesty contract: HC results map to specific Incubator
modules / lessons. Surface a "Your next move based on HC" strip on the
Incubator root page when HC is complete.

## Mandatory pre-read

1. T4 chapter #68 (HC honesty contract — leak cards + topic mapping).
2. T4 chapter #74 (copy ref — HC topic → recommendations table).
3. R001 + R002 Incubator structure.

## Scope

**A** — `incubator app/lib/recommend.js` — `recommendFromHC(hc)`
returns top-3 next actions sorted by leak severity (lowest score
first, only topics actually answered per chapter #68 no-fab-numbers
rule).

**B** — Each recommendation = `{ topic, leakHeadline, suggestedAction,
deepLinkTo }`. `deepLinkTo` is either a BOS lesson, an Incubator
phase card, or a "Talk to a human" CTA.

**C** — Root page renders the strip only when HC has at least one
answered topic. Empty / partial states explicit per honesty contract.

**D** — Updates auto when HC re-completed (read on every page boot).

**E** — Chapter update + MASTER row delta.

## NOT in scope

- New HC questions (admin editor owns).
- Real-data connectors (still no APIs).

## When done
DONE referencing `005-hc-driven-incubator-recommendations.md`.
