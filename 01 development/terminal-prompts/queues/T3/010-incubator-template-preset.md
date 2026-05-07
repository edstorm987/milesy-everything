/loop

# T3 — Round 010: Incubator template preset (§15e)

Ship the §15e Incubator Template as a website-editor preset, picked
at "+ New client" when phase = Epic Intro. Uses the 4 blocks from
R009.

## Mandatory pre-read

1. `04-aqua-internals-reference.md` §15e (the recipe) + §15f (bridge
   pattern).
2. R009 chapter (must ship first — block dependency).
3. Existing preset/starter machinery (`pageTemplates.ts`,
   `applyStarterVariant`).

## Scope

**A** — New preset id `incubator-template` in starter library.
Template tree per §15e recipe (cover · icon · pageTitle ·
propertyStrip · videoEmbed · toggle · helpRow · feedbackRow · divider ·
cardGrid · divider). `propertyStrip` reads `{ phase }`, `{ planTier }`,
`{ onboardingStartedAt }` from client metadata.

**B** — `cardGrid` destinations resolve as relative links inside the
client's portal-variant tree (so they work regardless of domain).

**C** — `+ New client` modal (T1 territory — Q-BLOCKED if T1 hasn't
exposed the toggle yet) gains "Use Aqua Incubator template" toggle —
defaults ON when phase = Epic Intro. If T1 toggle missing, render
preset in marketplace gallery and document the wire-up as Q-FOLLOWUP.

**D** — 4 sub-page presets per §15c: aqua-onboarding-start-here ·
my-client-portal-access · aqua-resources-lite · discover-aquaoasis-web.

**E** — Smoke + chapter `04-incubator-template-preset.md` + MASTER row.

## NOT in scope

- Editing T1's "+ New client" modal (cross-team).
- T4 Incubator app.

## When done
DONE referencing `010-incubator-template-preset.md`.
