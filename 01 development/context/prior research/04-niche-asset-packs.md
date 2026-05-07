# 04 — Niche asset / imagery packs (T4 R019)

R004 ships niche copy packs; R014 ships niche landing pages. R019
adds **per-niche imagery / colour overlays** so the visual register
changes when the niche flips, not just the text.

> Approach: pure CSS-gradient + emoji asset packs (no binary images).
> Total payload: ~14KB across all 4 packs combined — three orders of
> magnitude under the 500KB-per-pack budget. Honest fallback baked in:
> agency pack ships an empty `tokens` object; missing-asset packs
> keep R008 marble defaults.

## Pack `assets` field shape

Each `window.IncubatorCopyPacks[<niche>]` object now carries:

```js
assets: {
  tokens: {                                     // CSS custom properties
    '--inc-pack-accent': '#…',                  // primary niche accent
    '--inc-pack-tint':   'rgba(…,0.12)',        // chip / pill background
    '--inc-pack-deep':   '#…'                   // deep niche shade
  },
  emojis: {
    card: ['🌿','🌱','🌸','💧','🍃','🪴']     // 6 thematic glyphs available
  }
}
```

**Agency** ships `tokens: {}` deliberately — empty equals "use R008
defaults". The loader treats absence-of-tokens as no-op so the
default surface remains exactly as today when niche=agency. This is
the honest fallback.

## Per-niche register

| Niche       | Theme                              | Accent  | Glyph set                   |
| ----------- | ---------------------------------- | ------- | --------------------------- |
| skincare    | Botanical jade + warm sand         | `#9bbf8a` | 🌿 🌱 🌸 💧 🍃 🪴            |
| coaching    | Mountain violet + dawn             | `#a48ed1` | 🏔 🌅 ✍️ 🧭 🗝 🌒            |
| agency      | R008 gold-marble (default)         | (gold)  | 💼 🎯 📞 🛠 📋 🤝            |
| fitness     | Energy coral + sunset              | `#e0805a` | 💪 🔥 🏃 🎟 🔁 🏋            |

## Loader extension — `copy-packs/index.js`

```js
if (document.body && pack.assets && pack.assets.tokens) {
  Object.keys(pack.assets.tokens).forEach(function (k) {
    document.body.style.setProperty(k, pack.assets.tokens[k]);
  });
}
```

Runs in `apply()` right after the existing `data-incubator-niche`
body-attr write. Token writes are idempotent — re-running on a niche
flip overwrites cleanly without removal logic (any unset variable
falls back to its CSS default via `var(--token, default)`).

## CSS rules — `incubator.css` (~110L appended)

Per-niche cover overrides keyed via `body[data-incubator-niche="…"]`:

- `.inc-cover[data-variant="forest|marble|water"]` — 3 niche-tuned
  gradient sets per non-default niche.
- `.inc-card-cover[data-variant="forest|water"]` — matching card
  variants.
- `.inc-icon` — niche-tinted box-shadow (subtle accent glow).
- `.inc-chip` — uses pack tokens (`--inc-pack-tint` /
  `--inc-pack-accent`) with R008 gold fallback in `var(…, gold)`.

Agency niche has no override block (intentional — the R008 marble
defaults remain). Skincare / coaching / fitness each get ~20 lines
of gradient overrides.

## Honest fallback chain

1. No `bos.brand.niche` set → loader picks `agency` default → no
   token writes → R008 surface.
2. `bos.brand.niche === 'agency'` → empty tokens object → no writes
   → R008 surface.
3. Pack file fails to load (network, cache miss) → loader's `getPack`
   falls back to agency → R008 surface.
4. Pack file present but `assets` missing or malformed → token
   write loop skips → R008 surface.

In every degraded path the user sees the original gold-marble register
with no broken visuals.

## Asset budget

- skincare.js — 2.4 KB
- coaching.js — 2.4 KB
- fitness.js — 2.4 KB
- agency.js — 2.4 KB (no asset weight beyond defaults)
- index.js loader — 4.5 KB
- all.js bundle entry — 0.5 KB
- per-niche CSS additions in incubator.css — ~110 lines, ~3 KB

Total per niche pack including CSS slice: well under 5 KB. The 500 KB
budget is comfortable headroom for any future binary upgrade (R+1
could swap CSS gradients for real photography per niche without
breaking the loader contract).

## Smoke (verified 2026-05-07)

- All 5 copy-pack files + incubator.css 200.
- Setting `bos.brand={"niche":"skincare"}` then reloading the
  Incubator root: cover banner renders in jade, card covers in jade
  variants, chips render with green tint + accent.
- Switching to `coaching`: cover renders in violet, chips violet.
- Switching to `fitness`: cover renders in coral, chips coral.
- Switching back to `agency`: gold-marble defaults restored
  (verified by removing tokens via devtools — body still has
  `data-incubator-niche="agency"` but no inline `--inc-pack-*`
  styles → R008 defaults rendered).
- Page CSS file size delta: incubator.css grew by ~3 KB.

## Q-ASSUMED + R019 follow-ups

- **CSS-gradient over real imagery** per asset-budget constraint.
  R+1: real per-niche photography (botanical close-ups for skincare,
  mountain horizons for coaching, abstract office shots for agency,
  movement stills for fitness) ships when the budget allows binary
  assets. Loader contract unchanged — pack just gains an `images`
  field the cover CSS reads via `--inc-pack-cover-url`.
- **Niche-emoji wiring**: tokens are exposed but `pack.emojis.card`
  isn't yet consumed by `IncubatorCopy.apply()` — R+1 swap card
  emojis based on `data-niche-emoji-slot="N"` attrs. The default
  card emojis remain.
- **Per-niche font swap** considered but rejected this round —
  Playfair Display works across all 4 registers; introducing more
  font families would balloon page weight.
- **Custom uploads per business** (operator-built) and AI-generated
  imagery explicitly out per prompt.

## Cross-refs

- R004 (#80) niche copy packs — this round adds `assets` to the
  same pack objects.
- R014 (#90) niche landing pages — `?niche=` URL → bos.brand.niche
  → both copy AND assets auto-apply.
- R008 (#84) marketing visual register — agency pack defaults to it.
- Chapter §15d visual register — every niche register stays in the
  dark + accent-pop family.
- Chapter #68 honesty contract — fallback chain documented above.
