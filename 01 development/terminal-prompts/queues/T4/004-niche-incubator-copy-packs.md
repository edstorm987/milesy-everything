/loop

# T4 — Round 004: Niche-specific Incubator copy packs

Per chapter #71 open follow-ups: niche packs are currently labels
only. Build 4 actual content packs that swap Incubator copy + module
recommendations: skincare · coaching · agency · fitness. Honesty
contract applies — packs change words, not numbers.

## Mandatory pre-read

1. T4 chapter #74 (copy reference).
2. T4 chapter #71 (open follow-ups → niche packs deferral).
3. R002 per-phase pages.

## Scope

**A** — `incubator app/copy-packs/{skincare,coaching,agency,fitness}.js`
— each exports a flat `copyPack` object: `{ heroTagline, phasePromise[],
moduleHighlight[], niche-specific-faqs[], aquaResourceCallout }`.

**B** — Each Incubator page reads `bos.brand.niche` and merges the
pack's strings into the rendered template. Default pack = `agency`.

**C** — Niche-aware module recommendations: per pack, an ordered list
of module titles surfaced as "Recommended next" in the Resources Lite
sub-page.

**D** — Admin (existing T4 admin) gets a "Niche" selector that flips
`bos.brand.niche` and hot-reloads copy.

**E** — Chapter update + MASTER row delta.

## NOT in scope

- Niche-specific pricing.
- Custom imagery per niche (placeholder gold-marble for all; future round).

## When done
DONE referencing `004-niche-incubator-copy-packs.md`.
