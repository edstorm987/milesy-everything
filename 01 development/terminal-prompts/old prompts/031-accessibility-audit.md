/loop

# T3 — Round 031: Accessibility audit on rendered storefront

Audit pass on rendered storefront blocks. Fix landmark roles, alt-text
prompts, focus states, contrast warnings, ARIA labels for icon-only
buttons.

## Mandatory pre-read

1. Existing block library (R017 + R027).
2. T3 R011 brand-kit CSS-vars (contrast pairs).

## Scope

**A** — Audit utility `auditAccessibility(tree)` returns structured
issues per block (missing alt, low-contrast text, button without
label, missing landmark).

**B** — Each block's renderer fixes the obvious violations:
`<img>` requires alt (editor enforces); icon-only buttons get
auto-aria from props.text fallback; semantic landmarks (`<header>`,
`<nav>`, `<main>`, `<footer>`) where appropriate.

**C** — Editor sidebar gets "Accessibility" panel showing audit
results per page + click-to-fix where automatic.

**D** — Smoke (audit returns 0 critical issues on default tree) +
chapter `04-accessibility.md` + MASTER row.

## NOT in scope

- WCAG AAA compliance (target AA).
- Screen-reader testing (manual ops task).

## When done
DONE referencing `031-accessibility-audit.md`.
