/loop

# T3 — Round 045: JSON-LD injection into page `<head>`

R037 shipped the JSON-LD generators (`src/lib/structuredData.ts`).
R045 wires them so every published page emits `<script
type="application/ld+json">` in its `<head>` automatically.

## Pre-read

- T3 R037 chapter (JSON-LD generators).
- T3 R026 SEO/meta chapter (the head-injection pattern).

## Scope

**A** — Renderer integration: the page `<head>` builder reads the
block tree → calls `buildJsonLd(page, opts)` → for each JSON-LD obj
in the result, emits `<script type="application/ld+json">{escaped}
</script>`. `serializeJsonLd` is the safe escape (already in R037).

**B** — Per-page Organization data sourced from the agency's brand
kit (name, logo URL, sameAs[] from agency.metadata.socialLinks).

**C** — Skip emission when block tree carries zero matchable schemas
+ no Organization opt configured (don't emit empty `<script>` tags).

**D** — Diagnostics: editor-side panel surface listing the JSON-LD
that WILL be emitted on this page. NOT a separate page — extend
existing SEO panel if present, else a small drawer in editor header.

**E** — Smoke `§ JSON-LD injection` (≥10 — Article emission;
Product emission; FAQ aggregation; multi-script emission;
Organization always emitted; empty-tree → no scripts; CSP-safe
escape; diagnostics list matches output).

**F** — Chapter `04-jsonld-injection.md` + MASTER row.

## NOT in scope

- Recipe / Event / LocalBusiness schemas (R+1).
- Auto-inferring schema from non-typed block content (R+1).
- Per-locale JSON-LD variants (R+1, depends on R032 i18n).

## When done
DONE referencing `045-jsonld-injection.md`.
