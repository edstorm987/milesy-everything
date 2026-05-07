/loop

# T3 — Round 030: Block animations + scroll-triggered effects

Per-block animation properties + scroll-triggered reveal effects.
CSS-only where possible (respects `prefers-reduced-motion`).

## Mandatory pre-read

1. Existing block schema (block animation references in chapter 07).
2. T3 R011 brand-kit CSS-vars.

## Scope

**A** — Add `animation` prop on every block: `none | fade-in |
slide-up | slide-left | scale-in | parallax`. Default `none`.

**B** — IntersectionObserver runtime — applies `[data-animate-in]`
attribute when block enters viewport; CSS keyframe handles transition.

**C** — `prefers-reduced-motion: reduce` short-circuits to `none`
(no CSS animation runs).

**D** — Editor: animation chip in block properties + live preview
re-runs on toggle.

**E** — Smoke + chapter `04-block-animations.md` + MASTER row.

## NOT in scope

- Custom timing curves (R+1).
- Multi-step animations.

## When done
DONE referencing `030-animations-scroll-effects.md`.
