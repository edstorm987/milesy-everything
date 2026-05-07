/loop

# T4 — Round 014: Niche-specific landing pages

Build dedicated landing pages per niche (skincare / coaching / agency /
fitness) that pre-set `bos.brand.niche` on click-through to HC, so the
HC + Incubator copy packs (R004) auto-apply from the start.

## Mandatory pre-read

1. T4 R004 chapter — niche copy packs.
2. T4 chapter #74 (copy ref).
3. T4 R008 marketing site overhaul.

## Scope

**A** — 4 new pages: `for-skincare.html` · `for-coaching.html` ·
`for-agencies.html` · `for-fitness.html`. Each shares the
`.mm-incubator-*` shell from R008 with niche-specific hero copy +
example screenshots + niche-tailored "What Aqua replaces" + niche-
tailored testimonial placeholder.

**B** — Click-through: niche landing CTA → `/health-check.html?niche=<key>`
which sets `bos.brand.niche=<key>` on HC mount. Same param works on
`/incubator app/?niche=<key>`.

**C** — Marketing site nav adds "Industries" dropdown linking to all 4.
Footer too.

**D** — Niche pack default expanded for that niche (skincare landing →
skincare-pack auto-loaded).

**E** — Chapter R014 + MASTER delta.

## NOT in scope

- Niche-specific pricing (yet).
- Niche-specific imagery beyond placeholders.

## When done
DONE referencing `014-niche-landing-pages.md`.
