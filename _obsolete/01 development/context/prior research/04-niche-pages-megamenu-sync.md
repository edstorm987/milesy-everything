# Niche pages — Resources mega-menu sync (T4 R001, Sprint 2)

Carry-forward from chapter #123 §"Open follow-ups" item 2 — the four
static niche pages still rendered the legacy 4-link nav while the
canonical surface in `_marketing/index.html` had already been upgraded
(per #123 fix-7) with the Industries dropdown + Resources mega-menu.

## What shipped

Single static-HTML sweep across the 4 niche pages:

- `public/_marketing/for-skincare.html`
- `public/_marketing/for-coaching.html`
- `public/_marketing/for-fitness.html`
- `public/_marketing/for-agencies.html`

The `<nav class="nav-links">` block in each page was replaced with the
canonical block lifted from `_marketing/index.html` (lines 39–78 at
sweep time):

- "How we work" / "Services" / "Clients" / "Contact" anchors rewritten
  from `index.html#…` (relative — broken under the `/` rewrite from
  niche-page paths) to `/#…` (absolute — always hits homepage hash).
- Industries dropdown (`nav-dropdown`) inlined — 4 niche links.
- Resources mega-menu (`nav-dropdown nav-dropdown-mega`) inlined — 3
  columns × 11 entries (Quick access / Audits & diagnostics / Reading
  & finder).

`nav-cta` block left as-is per scope ("Keep page-specific CTAs
untouched"). "Sign in" already → `/login`; no "Get started" CTAs were
present (verified via grep), so scope C was a no-op.

## Why /#… not index.html#…

Under the unified Next.js host, `/` rewrites to
`_marketing/index.html`. From a niche page at `/for-skincare`, a
relative `index.html#process` resolves to `/index.html#process` — not
guaranteed to match the rewrite map. Absolute `/#process` is the
defensive choice and matches how the canonical block in `index.html`
already addresses its OWN sections (bare `#process`).

## JSX-rewrite TODO (not this round)

Per #123 the long-term plan is to consolidate niche pages into JSX
under `src/app/(marketing)/for/[niche]/page.tsx`, rendered through
`<SiteShell>` so the mega-menu lives in one place. Until then this
sweep is the polish carry-forward; the next time the canonical
mega-menu changes, mirror it across the 4 niche pages AND the static
`_marketing/index.html` AND `<SiteShell>` (chapter #123 gotcha #6).

## Out of scope

- JSX rewrite of niche pages (later round).
- New niche pages (post-ship).
- Resource sub-page real work (R002 in this sprint).
