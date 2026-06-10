/loop

# T1 — Round 017: Default favicon assets + Aqua HQ sidebar polish

Two small follow-ups bundled:
1. Default favicon assets so T3 R014's `deriveFaviconUrls` fallback
   path renders cleanly.
2. Aqua HQ sidebar surfaces the 6 main sections (Dashboard / Clients
   / Inbox / SOPs / Finance / Settings) per chapter §1.

## Mandatory pre-read

1. T3 R014 chapter `04-seo-meta.md` — favicon spec.
2. Chapter §1 Aqua HQ sidebar (chapter #59).
3. T1 R001 + R007 sidebar shape.

## Scope

**A** — Static assets at `portal/public/`:
`favicon-default-32.png`, `-180.png`, `-192.png`, `favicon-default.ico`.
Brand-neutral aqua-blue droplet glyph (simple SVG → rasterized).

**B** — Sidebar 6-section restructure in `Sidebar.tsx`: top group
"Aqua HQ" with 6 items (Dashboard /portal/agency · Clients
/portal/agency#clients · Inbox /portal/agency/inbox · SOPs /portal/
agency/sops · Finance /portal/agency/finance · Settings /portal/
agency/settings). Existing Tools collapsible group below. Founder
Todos widget remains on home page (R005).

**C** — Each section item respects R007 effective-role gating.

**D** — Smoke + chapter `04-aqua-hq-sidebar-polish.md` + MASTER row.

## NOT in scope

- Real branded favicon SVG redesign (placeholder ok).
- New routes — sidebar links existing pages or anchors.

## When done
DONE referencing `017-favicon-defaults.md`.
