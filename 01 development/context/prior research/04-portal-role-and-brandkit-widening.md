# `04` PortalRole widening + BrandKit absorption (T1 R15)

> Authored 2026-05-07. Closes two Q-FOLLOWUPs that landed across T3
> R011 (BrandKit CSS vars) + T3 R012 (portal-variant editor + chapter
> §15g): the foundation `PortalRole` union grows from 4 to 8 roles,
> and the foundation `BrandKit` absorbs T3's 9 extended fields so the
> 16-var CSS surface is emitted natively (not via T3 plugin overlay).

## Files touched

- `portal/src/plugins/_types.ts`
  - `PortalRole` widened additively. Existing roles preserved. New
    union members:
    - `customer` — end-customer landing for storefront tenants.
    - `member` — gated members area (paid / subscription content).
    - `start-here` — post-signup orientation surface.
    - `other` — catch-all for tenant-specific custom variants.
  - NEW `PORTAL_ROLES: readonly PortalRole[]` constant for runtime
    iteration.
  - NEW `assertPortalRole(v): PortalRole` — throws on unknown
    string. Used by foundation routes that receive role from
    request bodies.
  - NEW `isPortalRole(v): v is PortalRole` predicate for narrowing
    without throw.
- `portal/src/server/types.ts`
  - `BrandKit` absorbs the 7 NEW fields (fontHeading + fontBody were
    already there): `bgElevated`, `text`, `textMuted`, `border`,
    `radiusSm`, `radiusMd`, `radiusLg`. All optional with no default
    — vars only emit when set.
- `portal/src/lib/chrome/brandKit.ts`
  - Removed the `import "server-only"` shim (pure function — smoke
    tests import directly; same identity client/server).
  - `brandToCss(kit)` now emits up to **16 namespaced `--brand-*`
    vars**: existing 7 (primary / secondary / accent / font-heading
    / font-body / radius / logo) + new 7 (bg-elevated / text /
    text-muted / border / radius-sm / radius-md / radius-lg). Each
    var only present when the corresponding field is set —
    consumers fall back to bundled theme defaults at the CSS layer.
  - Back-compat: existing var names (`--brand-radius`, etc.) kept.
- `portal/src/plugins/foundation-adapters/portalVariantAdapter.ts`
  - Cast `role as never` at the `t3ApplyStarterVariant(...)` call
    boundary — foundation `PortalRole` is wider than T3's published
    plugin type today; if `role` is one of the new 4, T3 returns
    `ok:false: unknown variantId` (safe failure mode). Comment
    notes T3's coordinated widening lands when their next round
    publishes the broadened type.
- `portal/scripts/smoke-portal-role-brandkit.test.ts` (NEW)
  - 8 tests: `PORTAL_ROLES` membership; `assertPortalRole` accepts
    each canonical role + the 4 new ones; rejects unknown / null /
    undefined / numeric input; `isPortalRole` predicate narrows;
    `brandToCss` emits 1 var from a minimal kit; emits all 16 from a
    fully-populated kit; does NOT emit fabricated defaults.
- `portal/package.json`
  - NEW `smoke:portal-role-brandkit` script alias.

## CSS variable surface (full 16 vars)

```
--brand-primary
--brand-secondary
--brand-accent
--brand-font-heading
--brand-font-body
--brand-radius              ← shorthand (existing)
--brand-logo                ← url(...) wrapper
--brand-bg-elevated         ← T1 R15 NEW
--brand-text                ← T1 R15 NEW
--brand-text-muted          ← T1 R15 NEW
--brand-border              ← T1 R15 NEW
--brand-radius-sm           ← T1 R15 NEW
--brand-radius-md           ← T1 R15 NEW
--brand-radius-lg           ← T1 R15 NEW
```

## Q-ASSUMED log

1. **`start-here` spelling** with hyphen, not underscore. Chapter
   §15g prose uses the hyphenated form; matches the existing
   convention for compound role labels.
2. **No fabricated defaults at the CSS-var emission layer.** Each
   var only emits when the field is set. Plugins / theme stylesheets
   provide the fallback defaults (matches chapter #68 honesty
   contract — we don't push values the tenant never chose).
3. **Adapter casts to T3's narrower type.** The foundation type is
   widened in this round; T3 plugin's published `PortalRole` will
   widen in their coordinated follow-on. Unknown roles failing as
   "unknown variantId" is the safe failure mode.
4. **Removed `import "server-only"` from brandKit.ts.** Pure
   function — no Node-only or runtime-secret-only paths inside.
   Smoke tests can now import directly via tsx.
5. **fontHeading + fontBody already existed** before this round —
   the prompt's "9 fields" enumeration counts them; net new fields
   added by R15 is 7 (chapter §15g shipping the full 16-var
   surface).

## NOT in scope

- Per-block colour overrides (T3 R+1).
- Brand-kit settings UI (T3 R011 deferral).
- Wide-coordination plugin-side `PortalRole` widening — T3 owns the
  canonical type at `@aqua/plugin-website-editor/types`; foundation
  ships its own widened mirror this round, and the adapter casts at
  the boundary until T3's next sync.
- Touching milesymedia / business-os.

## Smoke results

`smoke:portal-role-brandkit` → **8/8 pass** (~700ms).
tsc clean across `portal/`. HARD BOUNDARY honoured.
