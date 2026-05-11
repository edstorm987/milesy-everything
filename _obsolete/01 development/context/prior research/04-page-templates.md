# Page-type templates (T3 R042)

## What

Operators creating new pages used to start from blank or pick
from `components/pageTemplates.ts` — the editor "Create page"
modal's rich 13-entry registry (homepage, shop, cart,
checkout, ...). R042 ships a focused 6-page-type registry
under `lib/`, shaped for programmatic creation paths (storage
seeding, batch creation, smoke). Each template carries SEO
defaults the page-creation flow can plug straight into
`EditorPage.seo`.

The two registries coexist by design:

| Registry | Path | Role |
|----------|------|------|
| Editor modal | `components/pageTemplates.ts` | Rich UX picker, 13 templates incl. ecommerce shop/cart/checkout |
| Page-type lib | `lib/pageTemplates.ts` | 6 type-shaped templates with SEO defaults for programmatic seeding |

## Files

- `src/lib/pageTemplates.ts` (NEW)
  - `PageTemplateId` union: `"landing" | "blog-post" | "product"
    | "about" | "contact" | "faq"`.
  - `PageTemplate` shape: `{id, name, description, defaultSlug,
    blocks: BlockTreeJSON, seoDefaults: EditorPageSeo}`.
  - 6 templates seeded:
    - **Landing** — hero + feature-grid + testimonials + cta
      (`/landing`).
    - **Blog post** — heading + image + text + author-bio
      (`/blog/post-title`).
    - **Product** — gallery + heading + text + product-card +
      payment-button (`/products/new-product`).
    - **About** — hero + text + logo-grid (team) + cta
      (`/about`).
    - **Contact** — heading + contact-form (name+email+message)
      + map + text-hours (`/contact`).
    - **FAQ** — heading + accordion w/ 3 placeholder Q&As
      (`/faq`).
  - `getPageTemplate(id)` — registry lookup, returns
    `PageTemplate | undefined`.
  - `applyTemplate(id, override?)` — returns
    `{slug, title, blocks, seo}`. Deep-clones the block tree
    AND restamps every block id (recursive) so two pages
    created from the same template don't collide on `id`
    lookup. Override `slug` and `title` flow into the result;
    `title` also overwrites `seo.metaTitle` so the page-creation
    UX shows the user-typed title in meta tags.
  - `uniqueSlug(desired, existing)` — appends `-2`, `-3`, …
    until free. Idempotent on a unique slug. Falls back to
    `-<timestamp>` past 999 collisions (paranoia — never seen
    in practice).
- `src/__smoke__/r042-page-templates.test.ts` (NEW) — 20
  assertions: registry shape (4) / per-template completeness
  (1) / ≥2 blocks (1) / unique defaultSlugs (1) / applyTemplate
  basics + override (5) / id restamp on apply (2 — top-level +
  nested recursion) / no-mutate-registry (1) / throws on
  unknown (1) / uniqueSlug 3 cases (3) / valid twitterCards (1).
- `package.json` test chain extended.

## SEO defaults

Each template's `seoDefaults` carries `metaTitle`,
`metaDescription`, and `twitterCard`. Picked defaults:

- Title: short and template-named (`"Landing page"` /
  `"Blog post"` / `"Product"`). The page-creation UX overwrites
  this with the user-typed title via `applyTemplate.override`.
- Description: a one-sentence stub the operator should edit
  before publishing — flagged in chapter as "placeholder copy"
  the publish gate may eventually warn on.
- twitterCard: `summary_large_image` for hero/blog/product
  (large image works); `summary` for about/contact/faq
  (text-heavy).

## Q-ASSUMED

- Two registries are correct; we don't unify because
  `components/pageTemplates.ts` carries icon strings + a
  `build()` factory that pulls block defaults from the block
  registry, while `lib/pageTemplates.ts` is data-only +
  cloneable. R+1 may collapse if the editor modal needs SEO
  defaults too.
- `applyTemplate` restamps ids on every call so the same
  template applied twice yields disjoint id sets — required
  for any storage layer that uses block id as a key. Smoke
  verifies recursion into children.
- `uniqueSlug` walks linearly up to 999; past that the
  desired slug is genuinely contested and operators need to
  intervene. Timestamp fallback is just to keep page creation
  unblocked.
- Block trees are intentionally minimal. Polish comes from
  R027 catalog presets + R011 brand-kit CSS vars. Templates
  are scaffolds, not finished pages.

## NOT in scope (R+1)

- AI-generated templates (post-ship — needs prompt → block
  tree generator).
- Per-tenant custom templates (post-ship — could be a small
  `templates` plugin with `CustomTemplate` rows in storage).
- Editor "Create page" modal wiring to call `applyTemplate`
  (foundation work — current modal uses
  `components/pageTemplates.ts:build()`).
- Publish-gate warning when SEO description still matches the
  template default (operator forgot to edit).
- Type-share with `components/pageTemplates.ts` to avoid the
  two-registry drift (refactor opportunity).
