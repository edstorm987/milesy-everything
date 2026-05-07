/loop

# T3 — Round 032: i18n / multi-language per page

Per-page localized variants. Operator authors English + can add
French/Spanish/etc. variants. Storefront serves matching locale based
on URL prefix or accept-language.

## Mandatory pre-read

1. Existing page persistence shape.
2. T3 R025 redirect registry (locale-aware fallback).

## Scope

**A** — Per-page `locales: { [code]: { tree, meta } }` map. Default
locale required; others optional.

**B** — URL prefix routing: `/fr/<page>` serves French if available,
else falls back to default with banner "This page hasn't been
translated".

**C** — Editor "Language" topbar dropdown switches active locale —
edits go to that locale's tree.

**D** — Auto-translate stub (operator-paste machine translation —
no real API).

**E** — Smoke + chapter `04-i18n.md` + MASTER row.

## NOT in scope

- Real translation API (T6).
- RTL layouts.
- Per-block locale override.

## When done
DONE referencing `032-i18n-multi-language.md`.
