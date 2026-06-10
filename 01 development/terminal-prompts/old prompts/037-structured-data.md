/loop

# T3 — Round 037: schema.org structured data per block

Emit JSON-LD blobs per page based on block tree contents — Article,
Product, FAQPage, Organization, BreadcrumbList. Pure generator; host
stamps the `<script type="application/ld+json">` into <head>.

## Mandatory pre-read

1. R026 SEO/meta chapter.
2. Block schema (existing kinds: hero, product, faq-item, breadcrumb,
   article).

## Scope

**A** — `lib/structuredData.ts`:
- `buildJsonLd(page, opts)` → array of JSON-LD objects. Walks the block
  tree:
  - `article` block(s) → Article schema (headline, datePublished,
    author, image).
  - `product` block(s) → Product schema (name, image, description,
    price, currency, availability).
  - sequence of `faq-item` blocks → FAQPage with `mainEntity[]`.
  - `breadcrumb` block → BreadcrumbList.
  - Always emit Organization schema once per page (from `opts.org`).

**B** — `validateJsonLd(obj)` — required-field checks per schema kind.
Returns issue list.

**C** — Helper `serializeJsonLd(arr)` → escaped string for safe `<script>`
embedding (escapes `</script>` and U+2028/U+2029).

**D** — Smoke `§ Structured data` (≥12 cases — each schema kind happy
path + missing-required-field validation + multi-FAQ aggregation +
script-escaping safety).

**E** — Chapter `04-structured-data.md` + MASTER row + tasks row.

## NOT in scope

- Recipe / Event / LocalBusiness schemas (R+1).
- Auto-inferring schema from non-typed block content (R+1).

## When done
DONE referencing `037-structured-data.md`.
