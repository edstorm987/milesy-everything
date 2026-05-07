# 04 — Brand-kit CSS variables (T3 R011)

T3 Round 011. Per Ed's hard constraint (`eds requirments.md` §5):
brand kit drives everything; no hardcoded brand colours; CSS
variables only. R011 extends the website-editor's vendored
`BrandKit` shape with the requested fields, ships an
`extendedBrandToCss` helper that emits the full var surface, exposes
per-install endpoints to save/load the extended fields, and
audits the existing 69-block library for hardcoded brand-adjacent
colours.

## 1. State on entry

Foundation already ships `portal/src/lib/chrome/brandKit.ts::brandToCss`
emitting the original 7 vars on every per-tenant layout (mounted via
`ThemeInjector`). `BrandKit` (foundation `portal/src/server/types.ts`
+ vendored `plugins/website-editor/src/lib/tenancy.ts`) carries
`logoUrl / primaryColor / secondaryColor / accentColor / fontHeading
/ fontBody / borderRadius / customCSS`.

R011 adds 9 fields **on the website-editor's vendored copy only** —
foundation source-of-truth `BrandKit` is T1 territory, modifying it
is cross-team. The vendored extension is additive: foundation reads
its 7 fields unchanged; website-editor reads its 16 fields when
present.

## 2. Schema additions (vendored)

`plugins/website-editor/src/lib/tenancy.ts::BrandKit` gains 9 optional
fields per requirements §5:

```ts
bg?: string             // page background
bgElevated?: string     // card / panel background
text?: string           // body text colour
textMuted?: string      // secondary copy / captions
border?: string         // hairline border default
radiusSm?: string       // 4px-ish
radiusMd?: string       // alias / superset of `borderRadius`
radiusLg?: string       // 18-24px-ish
darkMode?: boolean      // palette hint
```

## 3. Helper

NEW `plugins/website-editor/src/lib/brandKitCss.ts`:

- `extendedBrandToCss(brand)` returns `{ vars, customCSS? }` —
  emits the original 7 vars + 9 extended vars. Each extended var
  carries a sensible dark-friendly fallback (so a partial brand-kit
  still produces a complete palette). `darkMode` emits as
  `--brand-dark-mode: 0|1` (consumers can `[data-brand-dark="1"]`-
  scope or read the var via `var(--brand-dark-mode)`).
- `extendedBrandToStyleString(brand, scope=":root")` returns a
  `<style>`-body string ready to drop into a layout. Custom scope
  arg lets per-client / per-iframe surfaces stamp their own scope
  (e.g. `.tenant-felicia { … }`).
- `looksLikeHardcodedBrandColour(s)` — heuristic regex bank that
  catches the orange (#ff6b35 / #ff7300 family), cyan-500
  (#38bdf8), cyan-600 (#0ea5e9) hardcodes. Used in the smoke as a
  contract-stable gate; future runtime checks can wire it as a
  CI step.

`radiusMd` falls through to the legacy `borderRadius` field when
the operator hasn't explicitly set the new key — so existing
brand-kits don't lose their corner radius.

## 4. API

NEW `plugins/website-editor/src/api/handlers/brandKit.ts`:

- `GET /api/portal/website-editor/brand-kit/extended` — returns
  `{ ok, extended }`. Empty object when no override stored.
- `POST /api/portal/website-editor/brand-kit/extended` — body
  partial-update over `{ bg, bgElevated, text, textMuted, border,
  radiusSm, radiusMd, radiusLg, darkMode }`. Allow-list strips
  unknown keys; empty-string values clear that field only;
  malformed bodies → 400.

Storage: `t/<agencyId>/<clientId>/website-editor/brand-kit-extended`.

## 5. Block audit

Heuristic `grep` across `src/components/blocks/`:

```
grep -E '"#[0-9a-fA-F]{3,6}"' src/components/blocks/ | wc -l → 90 hits
```

Most are utility colours (error red `#fca5a5`, neutral muted
`#94a3b8`, dark surfaces `#1a1a1a`) — not brand colours, kept as-is.
Brand-adjacent hardcodes flagged for follow-up:

- `IconBlock.tsx::color` default — patched in R011 to fall through
  `var(--brand-accent, #ff6b35)` (every block-level brand-coloured
  default now reads the var first).
- Other blocks (CardGridBlock, BannerBlock, BeforeAfterBlock,
  ProductCardBlock) reference `var(--brand-accent, #ff6b35)` already
  (R002+ pattern).
- `BlogFeedBlock.tsx` cyan tag-chip — `#7dd3fc`-family is decorative
  / status-style, not brand. Keep until brand-kit ships an explicit
  `chipBg` field (R+1).

`brand-kit-todo` comment marker landed in `IconBlock.tsx`. Future
audits should grep for `// brand-kit-todo` to track remaining
violations as the library grows.

## 6. Smoke

NEW `__smoke__/r011-brand-kit-css-vars.test.ts` 31/31 pass:

- Minimal brand-kit emits primary + 8 extended vars with defaults.
- Full brand-kit emits all 16 vars; `--brand-logo` wraps URL in
  `url(…)`; radius scale picks up custom values; dark-mode emits
  as `1`/`0`; `customCSS` passes through verbatim.
- `radiusMd` falls through to legacy `borderRadius`.
- `extendedBrandToStyleString` opens with `:root {`, contains all 9
  extended vars, appends `customCSS` after the block, honours a
  custom scope arg.
- `looksLikeHardcodedBrandColour` flags orange-family + cyan-500/600
  hardcodes; doesn't false-positive on error red `#fca5a5`.
- HTTP round-trip: GET empty `{}`, POST persists allow-listed fields
  + strips unknown, GET surfaces persisted, POST empty-string clears
  one field while preserving siblings, POST malformed body → 400.

`@aqua/plugin-website-editor` package.json test chain extended.
tsc-clean.

## 7. Files

- `plugins/website-editor/src/lib/tenancy.ts` patch (BrandKit +9
  optional fields).
- `plugins/website-editor/src/lib/brandKitCss.ts` (NEW —
  `extendedBrandToCss` / `extendedBrandToStyleString` /
  `looksLikeHardcodedBrandColour`).
- `plugins/website-editor/src/api/handlers/brandKit.ts` (NEW).
- `plugins/website-editor/src/api/routes.ts` patch (2 new routes).
- `plugins/website-editor/src/components/blocks/IconBlock.tsx` patch
  (color default → var with brand-kit-todo comment).
- `plugins/website-editor/src/__smoke__/r011-brand-kit-css-vars.test.ts`
  (NEW).
- `plugins/website-editor/package.json` (test chain).

## 8. Q-ASSUMED / deviations

- Foundation `portal/src/server/types.ts::BrandKit` left untouched
  (T1 territory). The website-editor's vendored copy diverges
  intentionally; T1 will absorb the 9 fields when it lands the
  same extension on its source-of-truth type.
- Foundation `brandToCss` left untouched. `extendedBrandToCss` is
  additive — call sites that need the extended palette opt in via
  the new helper; existing per-tenant layouts continue to use
  foundation's `brandToCss` until T1 swaps.
- Brand-kit settings page (Goal D's "colour pickers + logo upload
  + font selectors") deferred — the API endpoints + helper are
  the structural prerequisite; the visual page wires onto them in
  R+1 (`BrandKitSettingsPage.tsx` mounts in the editor admin shell).
- 90 hex hardcodes in the block library; manual audit identified
  most as utility / decorative not brand. Only IconBlock had a
  brand-coloured default that wasn't already reading a var; patched.
  Future audits via `grep '// brand-kit-todo'` track remaining
  cases as the library grows.

## 9. R+1 candidates

- `BrandKitSettingsPage.tsx` — colour pickers, logo upload, live
  preview swatch, font selector with Google Fonts URL field.
- T1 foundation `BrandKit` extension to the same 9 fields +
  `brandToCss` extension so foundation per-tenant layouts emit
  the full surface (no website-editor-specific helper needed
  long-term).
- CI step running `looksLikeHardcodedBrandColour` over
  `src/components/blocks/**/*.tsx` and failing on new hits.
- BrandKit picker for the `--inc-*` Notion-Incubator vars (R009)
  so the Incubator scope gets first-class brand-kit drive too.
- `darkMode: true` propagation into block defaults (e.g. swap
  card chrome rgba lightness based on the hint).
