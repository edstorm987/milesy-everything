# 04 — Incubator template preset (T3 R010)

T3 Round 010. Per chapter §15e, the Aqua Incubator template ships
as a website-editor preset, surfaceable from "+ New client" when
phase = Epic Intro and from the marketplace gallery. Uses the four
Notion-Incubator blocks finalised in R009.

## 1. State on entry

The §15e root template + 4 sub-pages already shipped in T3 R002 —
`AQUA_INCUBATOR_TEMPLATE_IDS` exports `["aqua-incubator",
"aqua-incubator-onboarding", "aqua-incubator-portal",
"aqua-incubator-resources", "aqua-incubator-discover"]`.
`templateMarketplace.listBuiltinTemplates()` already surfaces all 5
under the "Aqua Incubator" tag (R006 tag inference). cardGrid
items in the root use relative `./…` hrefs so the bridge works
inside any portal-variant tree without domain rewriting.

R010 closes the remaining gaps the prompt calls out:

- propertyStrip rows resolved from client metadata.
- Helper for foundation/T1's "+ New client" modal to call after
  `applyStarterVariant`.
- Smoke pinning the §15e root recipe + the new resolver.

## 2. Metadata-driven propertyStrip

NEW `src/server/incubatorTemplate.ts`:

- `IncubatorClientMetadata` — `{ phase?, planTier?,
  onboardingStartedAt?, practiceName?, therapistName?,
  whatsappLink?, stripeLink?, [key: string]: string | undefined }`.
  The index signature lets operators pass arbitrary custom keys and
  reference them as `{{custom_key}}` from anywhere in the template.
- `applyIncubatorClientMetadata(blocks, metadata)` — pure deep-
  cloning walk over the BlockTree that substitutes `{{key}}`
  placeholders inside any prop string (recurses into arrays /
  nested objects so propertyStrip rows + cardGrid items both
  resolve). Missing or `undefined` metadata keys collapse to empty
  string — graceful, never surfaces raw `{{phase}}`.
- `DEFAULT_INCUBATOR_METADATA` — `{ phase: "Epic Intro", planTier:
  "Foundational Flow", onboardingStartedAt: "" }`. Used by
  preview / smoke so a freshly-loaded template doesn't show
  placeholders to the operator.

The root template's propertyStrip rows now carry
`{{phase}}` / `{{planTier}}` / `{{onboardingStartedAt}}` rather
than literals — wire-up:

```ts
const tree = await loadStarterTree("aqua-incubator");
const blocks = applyIncubatorClientMetadata(tree.blocks, {
  phase: client.stage === "aqua-epic-intro" ? "Epic Intro" : "...",
  planTier: client.metadata?.planTier ?? "Foundational Flow",
  onboardingStartedAt: new Date().toISOString().slice(0, 10),
});
```

## 3. T1 wire-up (Q-FOLLOWUP)

Per the prompt, the "+ New client" modal toggle ("Use Aqua
Incubator template") is T1 territory. Q-FOLLOWUP:

1. T1's `_NewClientButton.tsx` checks `phase === "Epic Intro"` (or
   the new Aqua-stage equivalent `aqua-epic-intro`) and shows the
   toggle, defaulted ON.
2. On submit, T1 calls
   `applyStarterVariant("aqua-incubator")` against the new
   client's portal-variant tree — already supported via
   `pageTemplates`'s sibling-seeding pattern (mirrors the
   brand-page-pack composite flow).
3. T1 calls `applyIncubatorClientMetadata(blocks, {
   phase, planTier, onboardingStartedAt, ...client.metadata })`
   on the resulting tree before persisting.

The marketplace gallery ships the preset today — T1 can land the
modal toggle independently when ready.

## 4. Smoke

NEW `src/__smoke__/r010-incubator-template-preset.test.ts` 43/43:

- 5 incubator template ids registered + resolve via
  `loadStarterTree`.
- root tree contains the §15e block recipe (hero, icon, heading,
  property-strip, toggle, divider, card-grid).
- propertyStrip rows carry the three `{{…}}` placeholders.
- `applyIncubatorClientMetadata` resolves all three when full
  metadata supplied; missing keys collapse to empty; original
  tree untouched (deep clone); custom-key placeholder resolves
  via the index signature.
- `DEFAULT_INCUBATOR_METADATA` resolves Phase to "Epic Intro" +
  Started to empty.
- templateMarketplace surfaces all 5 ids under "Aqua Incubator"
  tag.
- cardGrid item hrefs are all relative (`./onboarding` etc) so the
  bridge works regardless of portal-variant root.

`@aqua/plugin-website-editor` package.json test chain extended.
tsc-clean.

## 5. Files

- `plugins/website-editor/src/server/incubatorTemplate.ts` (NEW).
- `plugins/website-editor/src/components/pageTemplates.ts` patch
  (root template propertyStrip → placeholders + comment).
- `plugins/website-editor/src/__smoke__/r010-incubator-template-preset.test.ts`
  (NEW).
- `plugins/website-editor/package.json` (test chain).

## 6. Q-ASSUMED / deviations

- Preset id stays `aqua-incubator` (the canonical name from R002),
  not `incubator-template` as the prompt suggests — keeping the
  Aqua-namespaced id consistent with `AQUA_INCUBATOR_TEMPLATE_IDS`
  + chapter §15e mythos.
- The 5 templates were already present + marketplace-surfaced;
  R010 is the metadata-resolver layer + smoke pinning the recipe.
- T1 modal toggle and `applyStarterVariant` invocation are
  intentionally out-of-scope (cross-team) — Q-FOLLOWUP documented
  in §3 above.
- videoEmbed is on the onboarding sub-page (R002), not the root —
  matches §15e per-page recipe (each page picks its block subset
  from the §15a anatomy; root has no video by design).
- helpRow / feedbackRow are rendered as toggles in the root per
  §15a; no separate block contributions needed.

## 7. R+1 candidates

- T1 modal toggle + post-create metadata wire-up.
- Per-phase placeholder packs (Diagnostics / Brand / Traffic /
  Mastery) — same resolver, different key set keyed off
  `client.stage`.
- A `previewIncubatorTemplate(client)` server helper that returns
  fully-resolved blocks for an admin preview pane — currently the
  operator has to call `applyIncubatorClientMetadata` themselves.
- Auto-link cardGrid item hrefs to the actual sibling pages once
  T1 persists the 5 pages as a sub-page set (today they're
  relative paths the operator must keep in sync).
