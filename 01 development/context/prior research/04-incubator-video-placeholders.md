# 04 — Per-niche Incubator video placeholders (T4 R030)

Each Incubator phase page now carries a `[data-niche-video-slot]`
that the R004 IncubatorCopy loader fills from the active niche pack's
NEW `videos[<phase>]` field. Honesty-respecting URL strategy: every
entry ships with `url: null` + a curated `suggestion` string; the
operator (or Ed) drops in real public URLs from real curation rather
than relying on URLs that may not resolve.

> Per prompt: hosting videos + per-business uploads are out of scope.
> Real video curation is an operator task — flagged in the chapter
> and surfaced in the renderer as "Recommend a video →" mailto.

## Pack `videos` field shape

```js
videos: {
  'epic-intro':    { url: null, title, description, suggestion },
  'blueprint':     { url: null, title, description, suggestion },
  'diagnostics':   { url: null, title, description, suggestion },
  'brand-builder': { url: null, title, description, suggestion }
}
```

`url` can be:
- `null` → renders branded "🎬 Curate a video" placeholder card with
  title + description + tip (`suggestion`) + "Recommend a video →"
  mailto CTA.
- A real public URL (Vimeo / YouTube embed) → renders an iframe with
  16:9 aspect-ratio + meta block (title + description below).

This round ships every entry with `url: null` because invented URLs
would violate honesty contract. Operator fills as curation lands.

## Per-niche curation status

| Niche       | Curated suggestions | "Curate your own" placeholders |
| ----------- | ------------------- | ------------------------------ |
| agency      | 4 (all phases)      | 0                              |
| skincare    | 2 (epic-intro, diagnostics) | 2 (blueprint, brand-builder) |
| coaching    | 2 (epic-intro, diagnostics) | 2 (blueprint, brand-builder) |
| fitness     | 2 (epic-intro, diagnostics) | 2 (blueprint, brand-builder) |

Suggestion text formats: `"Search YouTube: 'Author Title' / 'Author2 Title2'"`
or `"Operator: try X / Y if they fit your voice"`. Honest about who
should curate.

## Loader extension — `copy-packs/index.js`

In `IncubatorCopy.apply()`, after the existing data-attr swaps:

```js
var videoHost = root.querySelector('[data-niche-video-slot]');
if (videoHost && pack.videos) {
  var phaseId = videoHost.getAttribute('data-phase') || 'epic-intro';
  var v = pack.videos[phaseId];
  if (v) {
    if (v.url) {
      // render iframe + meta
    } else {
      // render branded curate-placeholder card
    }
  }
}
```

Honest: when `pack.videos[phase]` is missing entirely (e.g. operator
adds a 5th phase later), the slot keeps its hosting page's default
placeholder (no swap = no broken behaviour).

## Phase-page wiring

| Phase                     | Slot                                                          |
| ------------------------- | ------------------------------------------------------------- |
| `phase-1-epic-intro.html` | `<div class="inc-video" data-niche-video-slot data-phase="epic-intro">` (existing inc-video gained the attr) |
| `phase-2-blueprint.html`  | NEW slot inserted after first `</details>`                    |
| `phase-3-diagnostics.html`| NEW slot inserted after first `</details>`                    |
| `phase-4-brand-builder.html` | NEW slot inserted after first `</details>`                |

Inserted via Python loop. All 4 pages now grep-match `data-niche-video-slot` once.

## CSS — `.inc-video-curate*` (~30L)

- Dashed gold border card (`var(--inc-gold-soft)`) — visually different
  from the live-video iframe to communicate "needs curation".
- 32px icon (🎬) + body (Playfair title + description + tip box +
  small mailto CTA).
- Tip box: gold-tinted background + gold left-border + monospace-ish
  feel for the "Search YouTube: …" prompt.
- `.inc-video-meta` — small Playfair title + muted description below
  iframes when a URL is present.

## Smoke (verified 2026-05-07)

- All 4 phase pages return 200.
- 4 pages match `data-niche-video-slot` (one per page).
- Manual: open phase-1 with default agency niche → renders curate
  placeholder card with "Why your agency exists" title + suggestion
  text + "Recommend a video →" CTA opens mailto with subject
  pre-filled.
- Manually setting `bos.brand.niche = 'fitness'` + reload phase-3 →
  renders the fitness "Reading your fitness HC" placeholder.
- Setting `bos.brand.niche = 'skincare'` + opening phase-2 → renders
  the "Curate your own" placeholder for blueprint.
- Setting a `pack.videos.epic-intro.url = 'https://www.youtube.com/embed/dQw4w9WgXcQ'`
  via devtools + reload → iframe renders 16:9 + meta below.

## Q-ASSUMED + R030 follow-ups

- **URLs are null this round** — honesty over fab. Operator (Ed)
  fills as real curation. `bos.brand.videoOverrides` could carry
  per-business overrides as R+1 to avoid editing the pack files.
- **Operator-curated videos** is a real ongoing task; chapter notes
  it as a tasks.md item to come back to.
- **Hosting** + **per-business uploads** out per prompt.
- **Aspect ratio** locked to 16:9 — covers YouTube + Vimeo standard
  embeds. Vertical-shorts would need a separate slot variant (R+1).
- **Loader fallback chain** — no pack.videos → keeps existing slot
  default; pack.videos missing the current phase → keeps default;
  null url → curate placeholder; valid url → iframe. No broken
  behaviour at any step.

## Cross-refs

- R002 (#78) per-phase Incubator pages — phase pages this slot lives in.
- R004 (#80) niche copy packs — this round adds the videos field
  to all 4 packs (same shape, no new file).
- R019 (#95) niche asset packs — assets + videos now both live on the
  pack object; loader applies in same `apply()` pass.
- Chapter §15b block taxonomy — videoEmbed block formalised here as
  niche-driven.
- Chapter #71 open follow-ups — "real video URLs" from chapter #71
  is now closer to closed (the system is in place; only the URLs
  themselves need real curation).
