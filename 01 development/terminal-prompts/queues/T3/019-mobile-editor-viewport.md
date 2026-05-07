/loop

# T3 — Round 019: Multi-device viewport + mobile preview

Editor topbar gets viewport switcher: Desktop / Tablet / Mobile.
Live preview swaps frame width + simulates touch. Per-block responsive
class hints.

## Mandatory pre-read

1. Chapter 06 visual editor — current viewport handling.
2. Brand-kit CSS-vars (R011 existing).

## Scope

**A** — Topbar viewport chip: Desktop (1280) · Tablet (768) · Mobile
(390). Switching changes preview iframe width.

**B** — Mobile-only / desktop-only block visibility flag (toggle on
each block: hide on mobile / hide on desktop).

**C** — Auto-detect responsive issues — overflow > viewport flagged
amber on the block.

**D** — Smoke + chapter `04-mobile-viewport.md` + MASTER row.

## NOT in scope

- Per-block-per-viewport styling (separate concern).

## When done
DONE referencing `019-mobile-editor-viewport.md`.
