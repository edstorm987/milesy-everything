/loop

# T1 — Round 014: "+ New client" modal — Incubator preset toggle

T3 R010 shipped `applyIncubatorClientMetadata()` resolver and the
`aqua-incubator` preset; T3's chapter notes the integration needs T1's
"+ New client" modal to wire the toggle. Ship that wire-up.

## Mandatory pre-read

1. T3 R010 chapter `04-incubator-template-preset.md`.
2. T1 R001 / R002 `_NewClientButton.tsx` shape.
3. Chapter §15e Incubator template recipe.

## Scope

**A** — `_NewClientButton.tsx` modal gains "Use Aqua Incubator
template" toggle. Defaults ON when phase = Epic Intro (or any
`aqua-*-intro` stage), else default OFF.

**B** — On submit, if toggle ON: after client create, calls
`applyStarterVariant("aqua-incubator")` → then
`applyIncubatorClientMetadata(blocks, {phase, planTier,
onboardingStartedAt: Date.now(), ...metadata})` to resolve placeholders
→ persists.

**C** — Smoke `§ New client Incubator toggle` (modal renders toggle;
phase=Epic Intro → toggle defaults checked; submit creates client +
variant attached + propertyStrip values populated).

**D** — Chapter `04-new-client-incubator-toggle.md` + MASTER row.

## NOT in scope

- Per-niche template variants (T4 R004 + future).
- Toggle for non-Incubator presets (separate concern).

## When done
DONE referencing `014-new-client-incubator-toggle.md`.
