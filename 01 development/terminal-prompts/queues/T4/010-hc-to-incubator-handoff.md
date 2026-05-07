/loop

# T4 — Round 010: HC → Incubator handoff flow

Once a visitor completes the HC, surface a "Continue your journey in
the Incubator" CTA on the HC results page. New customer onboarding:
sets `incubator.phase = epic-intro`, seeds `bos.brand` from HC inputs
(business name, niche, goals), drops user into Incubator root.

## Mandatory pre-read

1. T4 chapter #68 HC honesty contract — results page anatomy.
2. T4 R001-R002 Incubator structure.
3. T4 chapter #66 — full localStorage schema.

## Scope

**A** — HC results page: new primary CTA after the leak strip:
"Continue your journey →" launches Incubator.

**B** — Pre-fill bridge: `bridgeHcToIncubator()` reads HC answers
relevant to brand kit (business name, niche if asked, primary goal),
writes `bos.brand.companyName` + `bos.brand.niche` + initial
`incubator.goals[]`.

**C** — First-visit Incubator banner: "Welcome, {name}. Based on your
HC, you're starting at Epic Intro. Watch the welcome video to begin."
Dismissable; logs to activity.

**D** — Returning visitor (HC already done): Incubator root shows
"Pick up where you left off" with last-visited phase chip.

**E** — Chapter update + MASTER row delta.

## NOT in scope

- Real account creation (still localStorage-scoped).
- Email confirmation flow (T6).

## When done
DONE referencing `010-hc-to-incubator-handoff.md`.
