/loop

# T3 — Round 029: Custom CSS injection per variant

Operator can paste custom CSS at variant level (e.g. brand-specific
overrides, font-loading rules). Injected into rendered storefront
between brand-kit vars and block styles.

## Mandatory pre-read

1. T3 R011 brand-kit CSS-vars.
2. Existing per-variant settings shape.

## Scope

**A** — Per-variant `customCss?: string` (max 8KB) + `customHead?:
string` (max 4KB, escaped in storefront `<head>`).

**B** — Editor "Custom code" tab in variant settings — textarea for
each + paste-format (validates syntax via lightweight regex; flags
suspicious `<script>` content with a confirm).

**C** — Storefront SSR injects inside `<style>` tag between brand-kit
and blocks.

**D** — Smoke + chapter `04-custom-css.md` + MASTER row.

## NOT in scope

- Per-block custom CSS.
- JavaScript injection (rejected).

## When done
DONE referencing `029-custom-css-injection.md`.
