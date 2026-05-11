# 04 — Block animations + scroll-triggered effects (T3 R030)

T3 Round 030. Scroll-triggered reveal animations per block,
CSS-only with IntersectionObserver runtime. Respects
`prefers-reduced-motion: reduce` so accessibility-conscious
visitors see no motion at all.

## 1. Schema state

`BlockStyles` already carries `animate? / animateDuration? /
animateDelay? / animateEasing?` from R002+. R030 ships the
runtime + the renderer hook:

- **Stylesheet** at the page level — keyframes + base styles for
  every animation kind, single `<style>` injection.
- **Runtime IIFE** at the page level — IntersectionObserver
  watches `[data-animate]` elements, flips `data-animate-in
  ="true"` when they enter viewport.
- **Per-block `cssVars` + `dataAnimate`** — renderer reads
  block.styles.animate and emits the right markup.
- **Reduced-motion gate** — both the stylesheet (media query)
  and the runtime (matchMedia) respect `prefers-reduced-motion:
  reduce`; no transition fires for visitors who set it.

## 2. Library

NEW `lib/blockAnimations.ts` (pure SSR-safe):

```ts
type AnimationKind = "none" | "fade-in" | "slide-up" |
  "slide-left" | "slide-right" | "zoom-in" | "rotate-in" | "blur-in";

ANIMATION_KINDS: readonly AnimationKind[]
DEFAULT_DURATION = "600ms"
DEFAULT_EASING   = "cubic-bezier(0.4, 0, 0.2, 1)"

animationStyleProps({ animate, animateDuration?, animateDelay?, animateEasing? })
  → { cssVars: Record<string, string>, dataAnimate?: AnimationKind }

buildAnimationStylesheet() → string
buildAnimationRuntime()    → string
buildAnimationHeadFragment() → string  // composes both
```

`animationStyleProps` returns an empty object when animation is
"none" or undefined — no DOM noise on opt-out blocks. Custom
duration/easing land as CSS custom properties (`--aqua-anim-
duration` / `--aqua-anim-easing`); custom delay lands as
`transitionDelay` directly so the cascade is clean.

`buildAnimationStylesheet()` emits one `[data-animate]` base
rule (opacity 0 + transition declarations using the custom
properties + sensible fallbacks) plus per-kind rules for each
of the 7 visible kinds (fade/slide-up/slide-left/slide-right/
zoom/rotate/blur). The reveal rule
`[data-animate-in="true"] { opacity:1!important; transform:none
!important; filter:none!important }` overrides the per-kind
initial state in one shot. Reduced-motion media query short-
circuits transitions.

`buildAnimationRuntime()` emits a ~600-byte IIFE. Behaviour:

- SSR-safe — `typeof window === "undefined"` early-return.
- Reduced-motion gate — when matched, sets `data-animate-in=
  "true"` on every `[data-animate]` immediately and returns
  (no observer, no animations).
- Otherwise: instantiates an IntersectionObserver with
  `threshold: 0.15` + `rootMargin: 0px`; on intersect sets
  `data-animate-in="true"` and `unobserve`s.
- `MutationObserver` watches body/document for newly-mounted
  blocks (e.g. blog-feed loads more posts) and re-observes
  `[data-animate]:not([data-animate-in])`.

## 3. Renderer integration

The block-renderer's existing `blockStylesToCss` (R002 era)
should call `animationStyleProps(block.styles)` and merge the
returned `cssVars` into the block's inline styles + emit
`data-animate={dataAnimate}` on the wrapper element. Foundation
storefront layout calls `buildAnimationHeadFragment()` once and
stamps it into `<head>`.

R030 ships the pure library — renderer wire-up is the host
page's existing surface. `BlockRenderProps` already passes
`block.styles`; the renderer just routes those into
`animationStyleProps()` and applies the result.

## 4. Smoke

NEW `__smoke__/r030-animations.test.ts` 37/37 pass:

- ANIMATION_KINDS includes "none" first + every visible kind.
- DEFAULT_DURATION + DEFAULT_EASING set.
- `animationStyleProps`: none/undefined → empty; fade-in →
  dataAnimate set + no overrides; custom duration/easing/delay
  → `--aqua-anim-duration` / `--aqua-anim-easing` /
  `transitionDelay`.
- `buildAnimationStylesheet`: opacity:0 on `[data-animate]`,
  per-kind rule for every visible kind (7 kinds), reveal rule
  with `!important`, prefers-reduced-motion media query +
  `transition:none`, custom-property usage.
- `buildAnimationRuntime`: IIFE wrap, reduced-motion check,
  IntersectionObserver instantiation, `data-animate-in="true"`
  flip, unobserve-on-intersect, threshold 0.15, MutationObserver
  rescan, SSR window-check.
- `buildAnimationHeadFragment`: single `<style data-aqua=
  "animation">` + `<script data-aqua="animation">` containing
  both bodies.

`@aqua/plugin-website-editor` package.json test chain extended.
website-editor tsc-clean.

## 5. Files

- `plugins/website-editor/src/lib/blockAnimations.ts` (NEW —
  ANIMATION_KINDS + animationStyleProps + buildAnimation*).
- `plugins/website-editor/src/__smoke__/r030-animations.test.ts`
  (NEW).
- `plugins/website-editor/package.json` (test chain).

## 6. Q-ASSUMED / deviations

- BlockStyles' `animate` field type already covers the 8
  values (R002+). No schema change.
- Renderer integration is host-page wire-up — `blockStylesToCss`
  calls `animationStyleProps(styles)` and merges the result. R030
  ships the pure helper; the renderer change is a one-liner the
  host applies in its existing block-render path.
- 0.15 threshold (15% of element visible) feels right for hero-
  size blocks; smaller blocks may want 0.5 (R+1: per-block
  threshold override via `animateThreshold?: number`).
- Custom timing curves explicitly out-of-scope per prompt
  (operator-supplied easing strings work via the existing
  `animateEasing` field, but R030 doesn't add a curve picker UI).
- Multi-step animations (keyframes with multiple stops)
  explicitly out-of-scope per prompt — every kind here is
  initial→final transition only.
- Runtime is shipped as a `<script>` inline body, not module —
  zero dependencies, runs in every modern browser without a
  bundler. Foundation can ship a wrapped version once a build
  pipeline is in place (R+1).
- `prefers-reduced-motion` reveals every block immediately on
  page load — operator can rely on the visual state being
  identical to the post-animation state, no FOUC.
- Editor preview re-runs animations on toggle — this is a host-
  side concern (the editor remounts the block when its props
  change so the runtime observer picks it up via the
  MutationObserver rescan).

## 7. R+1 candidates

- Per-block `animateThreshold` override via BlockStyles.
- Custom timing curves UI picker in the editor.
- Multi-step animations (keyframes with multiple stops) — needs
  schema extension to a list of `{ at, props }` snapshots.
- Editor "Animation chip" UI in block properties (mirrors R007
  cookie-consent block field-form pattern). Today the field
  surfaces as a select via the existing field-form renderer.
- Stagger animations (children inside a card-grid reveal in
  sequence) via `--aqua-anim-stagger` index variable.
- `parallax` kind (per-prompt) — needs scroll-position math, not
  pure-CSS. Out of R030 scope but listed in chapter 07; a
  dedicated `parallax-section` block is the cleaner shape than
  retrofitting BlockStyles.animate.
