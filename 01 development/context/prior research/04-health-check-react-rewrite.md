# Chapter 152 — Health Check React rewrite + portal tracking (T4 R008)

## Why
Chapter #123 left HC iframed inside SiteShell. That fixed framing
but bequeathed two debts the Sprint-2 ship plan flagged:

1. Stacked vertical scrollbars (outer page + iframe). Commander-side
   patched the outer scrollbar earlier in Sprint 2; the iframe's own
   scrollbar remained.
2. HC submissions never reached the portal. Completed quizzes should
   land in the leads pipeline (T2 R027) and as activity for the
   founder dashboard (chapter #93). The static iframe had no path to
   either system — `index.html` posted to a self-contained JS handler.

This round retires the iframe and rebuilds the HC as a real React
route sharing SiteShell + brand-kit tokens, then wires completion
into the public-funnel endpoint (T2 R021).

## Surface

- **NEW** `src/lib/healthCheck/types.ts` — type model for areas,
  tiers, steps, options, and a `skipIf` DSL (`{rawAt, neq|eq}`)
  replacing the static JS file's arbitrary `function(slot){...}`
  closures. Every `skipIf` in the legacy pack reduced to
  `slot.raw[N] !== V`, so the DSL is sufficient.
- **NEW** `src/lib/healthCheck/defaultPack.ts` — hand-port of every
  area in `public/health-check/hc-questions.js` (seo · site · flow ·
  business · retain), all three tiers (beginner / intermediate /
  professional), every step type. Single source of truth going
  forward; once parity is signed off the static JS retires.
- **NEW** `src/app/health-check/_HCQuiz.tsx` — client component
  rendering the per-area tier picker, step-by-step flow with
  `skipIf` honoured, sticky search/site embeds, and per-area score
  aggregation. Step types covered: choice · multi · slider · text ·
  url · task · reveal · lever-calc · mental-note. Sticky search
  uses `https://www.google.com/search?igu=1&q=...` (the same trick
  the static app used).
- **NEW** `src/app/health-check/_HCResults.tsx` — final summary
  (overall score + per-area scores) + email-capture form. On submit
  POSTs `/api/portal/public-funnel/hc-complete` with `{email, slot}`
  and redirects to `data.redirect` (defaults to `/business-os`).
  Honesty contract honoured: every score is derived from the user's
  own answers — nothing implies an audit ran.
- **REWRITE** `src/app/health-check/page.tsx` — was the SiteShell
  iframe wrapper; now a server component rendering `<SiteShell>` +
  the React quiz. Question pack is server-resolved so the per-niche
  agency resolver (Phase 12 R3) can swap packs by host without
  touching the client.
- **NEW** `public/_marketing/health-check.css` — uses brand-kit
  CSS-vars only (`--mm-ink`, `--mm-paper`, `--mm-rule`, `--mm-accent`,
  `--mm-ink-soft`); no new colours. Loaded via the page's
  `<link rel="stylesheet">` so it co-exists with `_marketing/styles.css`.

## Completion flow

```
HCResults submit
  → POST /api/portal/public-funnel/hc-complete  { email, slot }
  → server creates lead (T2 R021), issues session
  → server emits lead.captured → activity inbox (chapter #93 tile)
  → response { redirect } → window.location.href
  → /business-os (BOS auth-gated per T2 R022)
```

Endpoint not visible in `src/app/api/` today — handler is plugin-
delivered via `[plugin]/[...rest]` (T2 R021) and may not yet be
registered locally. Wired regardless: when leads-pipeline + public-
funnel land, the call routes; until then it fails gracefully (form
shows the error message, user can retry or email).

## skipIf DSL — why a DSL not a function

The static JS held `skipIf: function(slot){ return slot.raw[4] !== 3; }`.
A function pointer can't survive JSON, can't be authored from an
admin UI (post-ship goal), and can't sit in a per-agency pack pulled
from a database. Every existing `skipIf` reduced to one of:

- `slot.raw[N] !== V` → `{rawAt: N, neq: V}`

If a future pack needs richer logic (multi-clause AND/OR), extend
the DSL. The current set doesn't.

## Iframe retirement

`page.tsx` no longer references `mm-hc-frame`. The CSS classes
`mm-hc-frame-shell` + `mm-hc-frame` in `_marketing/styles.css` are
now dead in source — left in place this cycle (no other page uses
them and they cost nothing); follow-up round can grep+drop after Ed
signs off on parity. `public/health-check/index.html` and
`hc-questions.js` survive at their old paths as a fallback / archive
per scope F — to be deleted post-signoff.

## Smoke checklist (manual)

- `:3030/health-check` renders inside SiteShell — no nested scrollbars
- Tier picker shows all three options for area 1 (Visibility & Search)
- "Just show me" path: pub-test sticky search renders inline; choice/
  reveal/task/lever-calc/mental-note steps each advance correctly;
  `skipIf` on the gut-check text step honours raw[4]
- Multi-area pill nav switches between the 5 areas
- Final results page shows overall + per-area scores + email form
- Submit → either redirects to `/business-os` (when public-funnel is
  registered) or shows the error banner (when it isn't), without
  fabricating success

## NOT in scope (per round prompt)

- Per-niche-agency question packs (Phase 12 R3 — T7 territory)
- Drag-to-reorder in admin (post-ship — operator JSON)
- Multi-language HC (Phase 12 + post-ship)
- Deletion of `public/health-check/` static files (one cycle as fallback)
- Real audit endpoint for the `professional` tier (mock scan output
  preserved verbatim)

## Hard boundaries honoured

Only T4 territory touched: `src/app/health-check/`, `src/lib/health-
Check/`, `public/_marketing/health-check.css`. No `src/app/api/`,
`src/app/portal/`, `src/lib/server/`, `src/server/`, `plugins/`,
`clients/` writes.

After R008 the HC stops being an iframe island; the next time someone
edits brand tokens in `_marketing/styles.css`, the HC inherits them.
