# Chapter 04 — Accessibility Audit

R031 ships an **accessibility audit walker** for the website-editor plugin
plus the editor-side surface that makes the results actionable. Aqua sites
target **WCAG 2.1 AA**: critical and serious issues are blocking; warnings
and info-level hints surface in the sidebar without breaking publish.

## Why per-tenant operators need an audit

Aqua portals are sold to operators (coaches, agencies, small studios) who
do not run accessibility consultancies. Without a built-in audit, two
failure modes surface in support tickets:

1. **Image alt drift.** Operators upload via the asset manager (R024) and
   skip the alt field. Twelve months later the site has 200 images, of
   which ~70 have no alt text — a hard AA fail and a hard ADA-compliance
   fail in the US/EU markets where most of our operators sell.
2. **Heading hierarchy chaos.** Block-based editors encourage operators
   to drag headings around without thinking about hierarchy. h1 → h4 →
   h2 patterns are common and break screen-reader navigation.

We solve both with a **single pure walker** (`auditAccessibility(tree)`)
that returns structured issues; the editor sidebar surfaces them by
severity, and a click-to-fix path handles the autofixable subset
(missing-alt prompt, empty-heading-removal).

## Shape of the audit

```ts
interface A11yIssue {
  code: A11yIssueCode;
  severity: "critical" | "serious" | "warning" | "info";
  blockId: string;
  blockType: string;
  path: string;            // "[0].children[2]"
  message: string;
  fixHint?: string;
  autofixable?: boolean;
}

interface A11yAuditResult {
  issues: A11yIssue[];                                 // severity-sorted
  countsBySeverity: Record<A11ySeverity, number>;
  countsByCode: Record<string, number>;
  total: number;
  passesBaseline: boolean;     // no critical or serious
}
```

`passesBaseline` is the **gate** the publish flow consults. The publish
button can be hard-blocked when `passesBaseline === false`, with the
sidebar showing the offending blocks.

## Issue codes shipped

| Code | Severity | Trigger |
| --- | --- | --- |
| `img-missing-alt` | critical | `<image>` / `<gallery>` block with `src` but no `alt` |
| `icon-button-missing-label` | critical (icon) / serious (blank) | `<button>` without `label` / `ariaLabel` / `text` |
| `link-missing-text` | serious | `<link>` with no visible text or `ariaLabel` |
| `heading-empty` | serious (autofix) | `<heading>` with empty `text` |
| `heading-skip-level` | warning | jumps from h_n to h_{n+2}+ |
| `form-input-missing-label` | serious | `<form>` field without `label` |
| `video-missing-track` | warning | `<video>` without caption track |
| `duplicate-id` | serious | same `id` reused inside one tree |
| `missing-landmark` | warning (no main) / info (no nav) | tree-level |

The matrix is intentionally narrow. We are not shipping a substitute for
axe-core — we are shipping the **operator-facing subset** that maps
cleanly onto Aqua block types.

## Contrast helper

`contrastRatio(fgHex, bgHex)` returns the WCAG 2.1 ratio; `classifyContrast(ratio)`
returns `"fail" | "AA-large" | "AA" | "AAA"`. The brand-kit editor (R011)
calls these on every save to surface a `low-contrast-text` warning when
`--brand-text` over `--brand-bg` scores below 4.5 — same threshold used
by the audit walker when it runs against rendered styles.

## Scope explicitly **not** covered

- AAA conformance — left for a follow-up round; raises ratio to 7:1 and
  adds enhanced text-spacing requirements.
- Live screen-reader smoke — needs an instrumented browser harness.
- Keyboard traps inside custom-html blocks — flagged separately in R029
  validation.
- ARIA-role mismatch detection inside `<html>` block content — operators
  who write raw HTML are already in the "expert" bucket and our linter
  rejects script tags before they reach this stage.

## Touch points across foundation + plugin

- `src/lib/a11yAudit.ts` — pure walker + contrast helpers (this round).
- Block renderers — semantic landmark mapping (`<navbar>` → `<nav>`,
  `<footer>` → `<footer>`, `<section>` → `<section>` with implicit role)
  is a one-line change per renderer in the host page integration.
- Editor sidebar — receives `auditAccessibility(currentPage.blocks)` on
  every render, displays issues grouped by severity.
- Publish handler — refuses publish when `passesBaseline` is false unless
  the operator passes `--allow-a11y-warnings` (advanced override).

## What success looks like

Six months from now, when an operator runs a site through external WAVE
or Lighthouse, the same issues that the audit walker would have caught
should already be gone. The two should agree on >95% of findings on the
default templates (lo-fi by design — Lighthouse's contrast checker is
more sophisticated than ours; we err toward fewer false positives).
