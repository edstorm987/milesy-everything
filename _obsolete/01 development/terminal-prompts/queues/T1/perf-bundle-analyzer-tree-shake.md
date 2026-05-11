/loop

# T1 — perf-followup: bundle-analyzer + tree-shake audit

Chapter #168 perf baseline shows `.next/static/chunks/` totals
2.1 MB across 76 chunks; the top five are 224 / 212 / 208 / 204 /
168 KB and have anonymous Turbopack hashes. We can't tell what's
in them or which plugin / dep dominates without analyzer output.

## Pre-read

- Chapter #168 (perf easy wins + baseline).
- `next.config.ts` (transpilePackages list — every workspace plugin).
- Each `04-the-final-portal/plugins/<id>/package.json` for heavy deps.

## Scope

**A** — Wire `@next/bundle-analyzer`. Run `ANALYZE=true npm run build`,
capture the per-chunk module map.

**B** — Identify the top three ownership wins:
  - duplicated dep across plugins (e.g. multiple date libs)
  - heavy non-tree-shaken default imports
  - pure-server modules accidentally pulled into client bundles via
    barrel re-exports

**C** — Per-plugin tree-shake pass: convert default imports to
named imports, drop side-effect imports where possible, mark
plugin packages `"sideEffects": false` when safe.

**D** — Document the per-plugin chunk attribution + delta in chapter.

## Smoke

`npm run perf:baseline` before + after; record top-5 chunk sizes in
the chapter. Aim for −20% on `.next/static/chunks/` total.

## HARD BOUNDARY

T1 owns `next.config.ts` + workspace bundling glue. Per-plugin
source edits land inside the plugin's own package — coordinate with
T2 / T3 if a plugin's `package.json` `sideEffects` flag changes.

## Q-ASSUMED at queue time

- −20% chunk total is a stretch target — directional, not gating.
- `@next/bundle-analyzer` configuration goes behind an `ANALYZE`
  env flag so prod builds are unaffected.
