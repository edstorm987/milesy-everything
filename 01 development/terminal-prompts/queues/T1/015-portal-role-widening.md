/loop

# T1 — Round 015: PortalRole widening + foundation BrandKit absorption

Two Q-FOLLOWUPs from T3 R011 + R012 absorbed in one round:
1. Widen foundation `PortalRole` to add `customer | member |
   start-here | other` (per chapter §15g).
2. Absorb T3's 9 extended `BrandKit` fields into the foundation
   `BrandKit` type so per-tenant layouts emit the full 16-var surface
   natively.

## Mandatory pre-read

1. T3 R011 chapter `04-brand-kit-css-vars.md`.
2. T3 R012 chapter `04-portal-variant-editor.md`.
3. `04-the-final-portal/portal/src/server/types.ts` — current PortalRole + BrandKit.
4. `04-the-final-portal/portal/src/lib/chrome/brandKit.ts` — current `brandToCss`.

## Scope

**A** — `PortalRole` union extended additively: existing roles +
`customer | member | start-here | other`. Tightens validators
(`assertPortalRole`).

**B** — `BrandKit` extended with 9 optional fields from T3 R011:
`bgElevated`, `text`, `textMuted`, `border`, `radiusSm`, `radiusMd`,
`radiusLg`, `fontHeading`, `fontBody`. All optional with sensible
defaults.

**C** — `brandToCss(kit)` emits 16 vars (existing 7 + 9 new) using
`--brand-*` namespace + back-compat aliases for current var names.

**D** — Per-tenant layout (`portal/src/components/chrome/Layout.tsx`)
threads BrandKit through unchanged — all new vars now available to
plugin blocks.

**E** — Smoke `§ PortalRole + BrandKit widening` (assertPortalRole
accepts new roles; brandToCss emits 16 vars).

**F** — Chapter `04-portal-role-and-brandkit-widening.md` + MASTER row.

## NOT in scope

- Per-block colour overrides.
- Brand-kit settings UI (T3 R011 deferred to its R+1).

## When done
DONE referencing `015-portal-role-widening.md`.
