# schema.org structured data per page (T3 R037)

## What

R026 shipped the SEO/meta surface (canonical, OG, twitter,
keywords, noIndex). R037 adds the JSON-LD layer: pure
generators that walk the block tree and emit schema.org
objects the host stamps as `<script type="application/ld+json">`
in `<head>`.

Five schemas in this round — Article, Product, FAQPage,
BreadcrumbList, Organization. Recipe / Event / LocalBusiness +
heuristic inference from non-typed content blocks land R+1.

## Files

- `src/lib/structuredData.ts` (NEW)
  - `buildJsonLd(page, opts)` — walks `page.blocks`, emits an
    array of `JsonLdObject`. Per-kind builders:
    - `article` → `Article` (headline / datePublished / author
      wrapped as `{@type:Person,name}` / image / description).
      Falls back: `title→headline`, `publishedAt→datePublished`,
      `cover→image`, `excerpt→description`.
    - `product` AND `product-card` → `Product` (name / image /
      description; `price + currency [+ availability]` collapse
      into a single `Offer`).
    - `faq-item` blocks (anywhere in the tree, any depth) →
      single `FAQPage` with `mainEntity[]` of `Question`s. Items
      missing question or answer are dropped.
    - `breadcrumb` → `BreadcrumbList` from `props.items` (or
      `props.crumbs`); positions are 1-based and sequential;
      entries without `name` are dropped.
    - Always emits `Organization` once per page from `opts.org`
      (last in the array; `sameAs` deep-copied so the caller
      input isn't aliased into output).
  - `validateJsonLd(obj)` — required-field check per `@type`.
    Returns `JsonLdIssue[]` (`{type, field, message}`). Required
    map: Article (headline, datePublished, author), Product
    (name), FAQPage (mainEntity), BreadcrumbList
    (itemListElement), Organization (name), Question (name,
    acceptedAnswer). Recursive: FAQ child Question issues bubble
    with `mainEntity[i].<field>` paths; Breadcrumb entries
    checked for name + position. Wrong @context flagged. Unknown
    @type flagged (so callers can detect drift early).
  - `serializeJsonLd(arr)` — `JSON.stringify` then escape:
    `</script>`-close → `<\/script`, `<!--` / `-->` → `<` /
    `>` variants, U+2028 / U+2029 → ` ` / ` `
    (defence-in-depth; Node's JSON.stringify already escapes
    these on modern V8). Output is a single safe string ready
    for the script body.
- `src/__smoke__/r037-structured-data.test.ts` (NEW) — 30
  assertions covering each schema happy path, validation
  failures, FAQ child-issue path-bubbling, multi-FAQ
  aggregation across tree depth, organization-always-emitted,
  product-card alias, and script-escape safety (closing tag,
  HTML comments, U+2028 / U+2029).
- `package.json` test chain extended.

## Walker shape

A single recursive walker visits the full block tree. The
switch matches by `block.type`:

- `article` / `product` / `product-card` / `breadcrumb` →
  immediate emit.
- `faq-item` → push to a bucket; after the walk, the bucket
  collapses into one `FAQPage`.

`Organization` is appended unconditionally at the end. Order is
deterministic: per-block emits in tree-walk order, then FAQPage
(if any), then Organization.

## Why one FAQPage per page

Google guidance allows one FAQPage per URL. Bundling all
faq-items into one schema (rather than per-item Question
schemas at the page root) matches that. The "consecutive runs"
framing in the round-prompt isn't enforced literally — items
deep in the tree still aggregate. Smoke verifies a section
nested inside `section > faq-item` and a sibling top-level
`faq-item` collapse to the same `FAQPage.mainEntity` array.

## Script-tag safety

Three escape stages:

1. `</script` → `<\/script` (case-insensitive). Prevents the
   embedded JSON from breaking out of the host script tag if a
   field carries the literal substring.
2. `<!--` and `-->` → `<!--` / `-->`. Some legacy UAs
   parse comment markers inside scripts in odd ways; cheap
   defence.
3. U+2028 / U+2029 → ` ` / ` `. Modern V8 already
   escapes these in `JSON.stringify` output; the explicit
   replace makes the contract independent of runtime version.

A reverse-escape of step 1 alone yields valid JSON, so the
smoke verifies `JSON.parse(s.replace(/<\\\/script/gi,
"</script"))` round-trips the array.

## Q-ASSUMED

- `product-card` is treated as a `Product` alongside `product`.
  The block registry uses `product-card` for the storefront
  card-shaped variant; the schema is the same. R+1 may split
  if a richer `ProductCard`-style schema is needed.
- FAQPage aggregates across the whole tree (not just
  consecutive runs). Google permits at most one FAQPage per
  page; collapsing matches that constraint and keeps the
  contract simple.
- Author is promoted to `{@type:Person}` even when the prop is
  a bare string. R+1 can accept structured author objects when
  the block schema starts carrying them.
- Validation flags wrong `@context` and unknown `@type` rather
  than throwing — callers are expected to surface
  `JsonLdIssue[]` in editor diagnostics, not crash.

## NOT in scope (R+1)

- Recipe / Event / LocalBusiness schemas.
- Auto-inferring schema from non-typed blocks (heading + text +
  image patterns → Article).
- Aggregating multiple Articles or Products into a CollectionPage.
- Wiring `serializeJsonLd` output into the host `<head>`
  (foundation work).
