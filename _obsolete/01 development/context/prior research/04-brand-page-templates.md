# Brand-page templates — therapist storefront in one click (T3 R004)

T3's queue-Round-004 lifts inventory chapter #58 Tier 3: storefront
brand-page templates. Every Aqua client (therapist / healing brand)
needs a 5–7-page brand site — about / story / philosophy /
sustainability / FAQ / contact / lab tests. Round 004 ships them as
starter `pageTemplates` plus a composite `brand-page-pack` that
seeds all 7 in a single `applyStarterVariant` call.

## Goal A — 7 brand-page presets

Each lives in `src/components/pageTemplates.ts` next to the existing
Aqua-Incubator templates and re-uses the existing block catalogue
(R2/R5 + R002 Notion-style blocks):

| ID | Slug | Anatomy |
|---|---|---|
| `brand-about` | `/about` | hero · paragraph · 3-card team grid |
| `brand-our-story` | `/our-story` | hero · 3 chapter sections separated by dividers |
| `brand-philosophy` | `/philosophy` | hero · 5 principle cards (2-col card-grid) |
| `brand-sustainability` | `/sustainability` | hero · stats-bar (3 metrics) · 3 commitment toggles |
| `brand-faq` | `/faq` | hero · 5 toggle blocks (booking / cancellation / insurance / remote / duration) |
| `brand-contact` | `/contact` | hero · contact-form · map block |
| `brand-lab-tests` | `/lab-tests` | hero · 3 cert cards · 2 download toggles |

Placeholder copy lands in Felicia's voice (slow / honest / mythos
register from chapter §15d) — operators rewrite per client. No
real assets baked in (cover images empty; operator drops via the
R003 asset upload pipeline).

## Goal B — Composite `brand-page-pack`

Single-click "complete storefront" starter. `BRAND_PAGE_PACK_ID =
"brand-page-pack"`. When `applyStarterVariant` is called with that
id:

1. Root EditorPage created from the **About** template's tree
   (acts as the storefront landing).
2. The other 6 brand presets seeded as sibling EditorPages on the
   same site, each carrying its own `variantId` so they're
   addressable individually.

Mirrors the R002 Aqua-Incubator sibling-seeding pattern in
`portalVariants.ts`. Operators can also apply individual presets
one at a time when they only want a single page.

## starterLoader — fall-through to PAGE_TEMPLATES

`src/server/starterLoader.ts` checks the static `STARTERS` map first;
on miss, falls through to `getTemplate(id)` for any
`AQUA_INCUBATOR_TEMPLATE_IDS` or `BRAND_PAGE_TEMPLATE_IDS` entry plus
`BRAND_PAGE_PACK_ID`. Synthesised `StarterTreeFile` carries
`role: "account"` (Q-ASSUMED v1 — same caveat as R002; PortalRole
needs widening).

`listStarterIds()` now reports **19** ids (6 round-1 + 5 incubator +
7 brand + 1 brand-pack).

## Smoke

NEW `__smoke__/brand-page-templates.test.ts` — 39 cases covering:

- Registry: `BRAND_PAGE_TEMPLATE_IDS.length === 7`, all 7 spec ids
  present, `BRAND_PAGE_PACK_ID === "brand-page-pack"`, every preset
  registered in `PAGE_TEMPLATES`.
- Tree shape: each preset resolves via `getTemplate()`, builds a
  non-empty tree, starts with a `hero` block (7 × 3 = 21 cases).
- `brand-faq` deep search ≥5 toggle blocks.
- `brand-contact` has both `contact-form` and `map`.
- `brand-sustainability` has `stats-bar` + ≥3 commitment toggles.
- `brand-lab-tests` card-grid renders 3 certifications.
- `brand-philosophy` card-grid renders 5 principles.
- Starter loader: `brand-about` resolves with `role: "account"`,
  `brand-page-pack` resolves with hero-rooted tree (About's),
  `listStarterIds()` includes all 7 brand presets + the pack,
  unknown id → null.

Plugin total **254/254** (68 + 25 + 25 + 26 + 39 + 32 + 39). tsc
clean. No registry / counts changed (R004 doesn't add new block
types — leverages existing catalogue).

## Cross-team handoffs

- **T1** — When the agency-shell "+ New page" picker exposes
  starter templates, surface `brand-page-pack` as a featured
  composite alongside individual presets. Featured ordering
  suggestion: Aqua-Incubator (Epic Intro) · Brand pack · individual
  brand presets · blank.
- **T1 / Foundation** — `PortalRole` widening (R002 carry-over)
  benefits this round identically.

## R+1 deferred

- Industry-vertical packs beyond therapist/healing (coaching,
  fitness, retail).
- Rich placeholder copy library — currently single
  Felicia-voiced placeholder per page; future round adds 2–3
  copy variants per slot keyed off plan tier.
- Rendered preview thumbnails on the picker (not block-tree
  shape — visual snapshot for operator scanning).
- Sitemap navigation block that auto-derives from sibling pages
  in the same site so the brand pack auto-builds the navbar.

## Files

- `src/components/pageTemplates.ts` (7 brand presets +
  `BRAND_PAGE_TEMPLATE_IDS` + `BRAND_PAGE_PACK_ID` +
  `buildBrandPageTemplates()` + injection into PAGE_TEMPLATES)
- `src/server/starterLoader.ts` (fall-through + listStarterIds
  growth)
- `src/server/portalVariants.ts` (brand-page-pack sibling-seed
  branch)
- `src/__smoke__/brand-page-templates.test.ts` (NEW, 39 cases)
- `src/__smoke__/blocks.test.ts` (starter-count assertion 11→19)
- `package.json` (test wires new smoke)

HARD BOUNDARY honoured throughout.
