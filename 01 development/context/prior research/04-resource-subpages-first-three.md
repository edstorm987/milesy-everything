# Resource sub-pages — first three real (T4 R002, Sprint 2)

Carry-forward from chapter #123 §"Open follow-ups" item 5: the seven
`/resources/[slug]` entries were stub "coming soon" cards inside a
catch-all renderer. R002 replaces 3 of them with real, browser-side
diagnostic tools.

## What shipped

Three new dedicated routes (each pre-empts the catch-all stub):

- `src/app/resources/seo-audit/page.tsx`
- `src/app/resources/site-speed/page.tsx`
- `src/app/resources/accessibility-audit/page.tsx`

Each is a server component that renders `<SiteShell>` + a header + a
client tool. Tools live at:

- `src/components/resource-tools/SeoAuditTool.tsx`
- `src/components/resource-tools/SiteSpeedTool.tsx`
- `src/components/resource-tools/AccessibilityAuditTool.tsx`

Plus `src/components/resource-tools/shared.ts` — `attemptFetch`,
`normaliseUrl`, `bandFromCount`, `bandLabel`, the `Band` type, and the
`CheckResult` shape — shared between the three.

## Honesty contract (chapter #68)

- **A–F bands, never numeric percentages** — all three tools surface a
  band derived from passed/total checks (or, for site-speed, from
  round-trip ms thresholds). No fabricated scores.
- **CORS-blocked is surfaced, not hidden** — when a target site doesn't
  set `Access-Control-Allow-Origin`, the browser blocks the read. We
  display that explicitly with a note pointing to T2 R023
  rank-my-website (post-ship server-side scanner).
- **"Rough estimate from this device" caption** on site-speed — no
  pretence of Lighthouse parity.
- **No email capture, no lead creation** — that's T2 R023's job. R002
  ships the tool; the funnel hookup arrives separately.

## What each check covers

### SEO audit
- Title 30–60 chars
- Meta description 70–160 chars
- Exactly one `<h1>`
- `<link rel="canonical">` present
- OpenGraph title + image
- `/robots.txt` reachable (HEAD-equivalent fetch)
- `/sitemap.xml` reachable

### Site speed
- Round-trip ms (HTTP fetch start → text-body resolved)
- Total HTML bytes
- `<img>` count
- `<script>` count
- Reference: this page's own DCL from `PerformanceNavigationTiming`
- Band derived from round-trip thresholds (<800ms A, <1500 B, <3000 C,
  <6000 D, else F)

### Accessibility audit
- Image alt-tag coverage
- Page has an `<h1>`
- Heading levels don't skip (no `h2 → h4` jumps)
- `<html lang>` set
- `<main>` landmark present
- `<nav>` landmark present
- `<footer>`/contentinfo landmark
- Inline-style `color`+`background` pairs ≥ 4.5:1 contrast (WCAG 2.1 AA
  for normal text). Caveat noted: external CSS isn't reachable from
  the HTML scan alone.

## Catalog wiring

`src/lib/resources/catalog.ts` flipped `status: "soon" → "live"` for
`seo-audit`, `site-speed`, `accessibility-audit`. The Resource Finder
+ Resources hub pick them up automatically — no other changes needed.

## Catch-all stub trim

`src/app/resources/[slug]/page.tsx` — STUBS map had its `seo-audit` /
`site-speed` / `accessibility-audit` entries removed (the dedicated
routes pre-empt the catch-all). Comment left in source explaining why
to prevent future drift between live tool + stale stub copy.

## Styles

`public/_marketing/styles.css` extended (~30 lines) with `.mm-tool*`
classes — form layout, A–F band readout, check-list grid, stat tiles,
note callout. Brand-kit CSS-vars only (`--muted`, accent `#C9A76A`
matching existing usage); no hardcoded brand colours.

## Out of scope (R+1 / post-ship)

- Email capture / lead creation (T2 R023 plugin owns).
- Real Lighthouse / PageSpeed Insights integration (server-side, post-
  ship).
- The other 4 stubs (`ux-orchestration` / `copy-clinic` / `playbooks`
  / `case-studies`) — deferred.
- Server-side scanning to bypass CORS limits (T2 R023).
