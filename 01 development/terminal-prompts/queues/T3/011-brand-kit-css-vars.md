/loop

# T3 — Round 011: Brand-kit CSS-variable system (per requirements §5)

Per Ed's hard constraint: **brand kit drives everything; no hardcoded
brand colours; CSS variables only.** Audit every existing block for
hardcoded brand colour, swap to `var(--brand-*)`. Per-install brand-
kit settings page.

## Mandatory pre-read

1. `01 development/eds requirments.md` §5 (Aesthetic & UX commitments).
2. T3 prior rounds (block library) — current block CSS.
3. Felicia's portal (clients/felicias perfect portal/) — north-star
   brand-kit shape.

## Scope

**A** — `BrandKit` schema additions: `primary`, `secondary`, `accent`,
`bg`, `bgElevated`, `text`, `textMuted`, `border`, `radiusSm`,
`radiusMd`, `radiusLg`, `fontHeading`, `fontBody`, `logoUrl`, `darkMode`.

**B** — `BrandKitProvider` server component sets CSS vars on `<body>`
based on per-install brand-kit. Existing var names (`--accent` etc.)
remain for back-compat — added `--brand-*` aliases.

**C** — Block audit: scan all 58+ blocks for any hex / Tailwind
brand-named class; replace with `var(--brand-*)` + sensible fallback.
Document remaining violations as `// brand-kit-todo` for follow-up.

**D** — Brand-kit settings page (`@aqua/plugin-website-editor`):
colour pickers · logo upload · font selectors · live preview swatch.
Saved per-install.

**E** — Smoke (visual diff baseline saved) + chapter
`04-brand-kit-css-vars.md` + MASTER row.

## NOT in scope

- Custom font hosting (use Google Fonts URL field).
- Per-block colour overrides (separate concern).

## When done
DONE referencing `011-brand-kit-css-vars.md`.
