# 04 — Block library polish (T3 R017)

T3 Round 017. Audit pass on `@aqua/plugin-website-editor` block
library: registry already carries 70+ ids (R002+ shipped accordion,
tabs, pricing-table, feature-grid, hero, faq, testimonials, etc.).
R017 fills 5 high-utility gaps with full Live renderers, sensible
default trees on insert, brand-kit CSS-var driven chrome.

## 1. Audit

`grep -E "^  [a-z\"-]+:" blockRegistry.ts` returns 71 unique ids.
The chapter-07 catalogue spans 58 — the editor over-shoots that
floor (the catalogue is conservative; commerce + auth + ecommerce
plugins each contribute additional blocks). Picked 5 missing
high-utility additions per Felicia / Aqua usage patterns:

1. `feature-comparison` — pricing/tier comparison table.
2. `team-grid` — team-member cards with avatar/name/role/bio/socials.
3. `breadcrumb` — page-navigation crumbs.
4. `process-steps` — numbered ordered list of steps.
5. `share-buttons` — Twitter / LinkedIn / Facebook + copy-link.

## 2. Block contracts

### `feature-comparison` (▦)
- Props: `{ heading?, subheading?, columns: Column[], rows: Row[] }`.
- `Column { id, label, ctaLabel?, ctaHref?, highlighted? }` — the
  highlighted column gets a primary-colour top border + bold CTA.
- `Row { feature, values: Record<columnId, string|boolean> }`.
- Cell rendering: `true` → `✓` (primary colour), `false`/`null` →
  `—` (muted), strings → literal.
- Default tree ships a 3-tier Starter/Growth/Scale comparison
  with 5 features.

### `team-grid` (👥)
- Props: `{ heading?, subheading?, columns?=3, members: Member[] }`.
- `Member { name, role?, bio?, avatarUrl?, socials? }`.
- Avatar fallback: 96×96 circle with member initial when no
  avatarUrl. Socials render as 28×28 round chips with kind glyph
  (𝕏 / in / ig / ✉ / ↗).
- Empty state: "Add team members in the block's properties."
- Default tree seeds 3 members.

### `breadcrumb` (›)
- Props: `{ items?, separator?="›", homeLabel?="Home" }`.
- When `items` empty, derives from `window.location.pathname`
  segments (capitalises hyphen-words, last segment renders as
  current page).
- Last item is `<span aria-current="page">`; intermediate items
  are anchors. Separator hidden from AT via `aria-hidden="true"`.

### `process-steps` (①)
- Props: `{ heading?, subheading?, layout?: "horizontal"|"vertical",
  steps: Step[] }`.
- `Step { title, description?, icon? }`. Icon override replaces
  the auto-numbered counter (1, 2, 3…) when supplied.
- Layout switches via CSS grid (`auto-fit minmax(220px, 1fr)`)
  for horizontal; column flex for vertical.
- Default tree ships horizontal Discover → Design → Deliver.

### `share-buttons` (↗)
- Props: `{ heading?="Share this:", url?, text?, networks? }`.
- `networks` defaults to `["twitter", "linkedin", "facebook",
  "copy"]` — operator subsets via the prop.
- URL falls back to `window.location.href` when prop empty.
- Copy is a `<button>` with `navigator.clipboard.writeText` +
  1.5s "Copied ✓" flash; gracefully degrades when clipboard API
  unavailable.
- Twitter / LinkedIn / Facebook emit standard `intent` URLs with
  encoded URL + text.

## 3. Theme overlay

Every block reads via brand-kit CSS vars (R011 surface):
`--brand-text / --brand-text-muted / --brand-bg-elevated /
--brand-border / --brand-radius-sm / --brand-radius-md / --brand-
primary / --brand-font-heading / --brand-font-body`. Hardcoded
fallbacks are the rgba-white tones from R011 so existing dark hosts
render unchanged.

## 4. Smoke

NEW `__smoke__/r017-block-library-polish.test.ts` 39/39:

- Registry: all 5 ids registered + non-empty `defaultProps`.
- feature-comparison: `<table>` shape, all 3 columns surface,
  boolean → ✓/—, highlighted top-border, --brand-text token.
- team-grid: `<article>` per member, initial-fallback when no
  avatarUrl, --brand-primary on role, empty state copy.
- breadcrumb: `<nav aria-label="Breadcrumb">`, intermediate items
  as anchors, last item span with `aria-current="page"`, 2
  separators between 3 items.
- process-steps: `<ol>` with `data-layout`, 3 `<li>`, sequential
  1/2/3 numbering, icon override replaces number.
- share-buttons: Twitter/LinkedIn/Facebook intent URLs encoded
  correctly, Copy is `<button>` not `<a>`, heading surface,
  custom networks subset honoured.
- Theme overlay: every block emits at least one `var(--brand-*)`
  token.

`react-dom/server` import pattern from R009 (`@ts-expect-error`
+ typed wildcard). package.json test chain extended.
website-editor tsc-clean.

## 5. Files

- `plugins/website-editor/src/components/blocks/FeatureComparisonBlock.tsx`
  (NEW).
- `plugins/website-editor/src/components/blocks/TeamGridBlock.tsx`
  (NEW).
- `plugins/website-editor/src/components/blocks/BreadcrumbBlock.tsx`
  (NEW).
- `plugins/website-editor/src/components/blocks/ProcessStepsBlock.tsx`
  (NEW).
- `plugins/website-editor/src/components/blocks/ShareButtonsBlock.tsx`
  (NEW).
- `plugins/website-editor/src/components/blockRegistry.ts` patch
  (5 imports + 5 entries with full default trees).
- `plugins/website-editor/src/__smoke__/r017-block-library-polish.test.ts`
  (NEW).
- `plugins/website-editor/package.json` (test chain).

## 6. Q-ASSUMED / deviations

- Picked the 5 by gut + grep, not a formal catalogue audit
  document — registry already over-shoots chapter 07's 58-block
  floor, so further audits are diminishing-return work; better
  to ship blocks operators ask for and grow the library
  pragmatically.
- Properties pane visual coverage: each block's `fields` schema
  surfaces the top-level scalar props in the existing
  `EditorPropertiesSidebar` field-form render. Array props
  (columns / rows / members / steps / socials) are still
  hand-edited as JSON pending an array-editor R+1 (same R+1 as
  R009's propertyStrip rows / R006's TemplateGallery saved
  templates).
- breadcrumb auto-segments by `/` and capitalises hyphen-words;
  doesn't translate slug → title via a sitemap lookup. Operator
  can supply explicit `items` for full control.
- share-buttons Copy is a `<button>` not a styled `<a>` so
  semantic submit + clipboard event firing both work.
- No animation choreography per block (per prompt out-of-scope).

## 7. R+1 candidates

- Visual properties-sidebar editors for the array props
  (columns / rows / members / steps / socials) — landed
  alongside the R009 propertyStrip-rows editor + R006 saved-
  template-tags editor as one batch of array-form chrome.
- Featured-block surface in TemplateGallery (R016) so operators
  drag a featured block into the canvas the same way they pick
  templates.
- Breadcrumb structured-data (`schema.org/BreadcrumbList` JSON-
  LD) emit when `items` set — feeds back into R014's SEO
  surface.
- Share-buttons share-count integration (Twitter / LinkedIn
  share-count APIs) when telemetry budget allows.
- Process-steps progress indicator (% complete checkbox) for
  Incubator-style step trackers.
