/loop

# T4 — Round 008: HC React rewrite + portal tracking integration

Today the Health Check is a static `public/health-check/` app
embedded via iframe in `app/health-check/page.tsx`. Two side-effects
Ed flagged:

1. Two stacked vertical scrollbars (outer page + inner iframe).
   *Commander-side patched the outer-page scrollbar; iframe still
   has its own.*
2. HC results don't feed into the portal — completed quizzes should
   land as leads in the leads pipeline (T2 R027) and as activity
   in the founder dashboard (chapter #93).

This round rebuilds the HC as a proper React component sharing
SiteShell + brand-kit tokens, and wires the completion flow into
the portal so every HC submission becomes a lead.

## Pre-read

- Chapter #123 §"iframe-inside-SiteShell" (current pattern — being
  retired here).
- T2 R021 `public-funnel` chapter (HC→lead endpoint already shipped:
  `POST /api/portal/public-funnel/hc-complete`).
- T2 R027 leads-pipeline (final hand-off destination — this round
  doesn't depend on T2 R027 ready, just calls the public-funnel
  endpoint which routes correctly when leads-pipeline lands).
- Existing `public/health-check/hc-questions.js` (question schema).

## Scope

**A** — NEW `src/app/health-check/` becomes a real React route:
- `page.tsx` — server component fetching question pack via
  agency-by-domain resolver (Phase 12 R3 not yet shipped, fall back
  to default pack file at `src/lib/healthCheck/defaultPack.ts`).
- `_HCQuiz.tsx` client component — replicates the existing branching
  flow (skipIf, mental-note, lever-calc, sticky-search-embed) but in
  React + brand-kit CSS-vars. **Match feature parity** with the
  static app — every step type from the chapter #123 redesign.
- `_HCResults.tsx` — final score + email-capture form.

**B** — Question loader: import the existing question objects from
`public/health-check/hc-questions.js` via JSON file or hand-port
into a TypeScript module. Single source of truth going forward
(retire the JS file once parity confirmed).

**C** — Completion flow: on submit, POST `/api/portal/public-funnel/
hc-complete` (T2 R021 endpoint) with `{email, slot}`. Server creates
lead, issues session, returns redirect to `/business-os` (BOS auth-
gated per T2 R022).

**D** — Tracking: HC completion event lands in the agency activity
inbox (existing public-funnel emit `lead.captured` chains through).
Founder dashboard "Touchpoints/7d" tile already reads from this
(chapter #93).

**E** — Retire iframe: remove `app/health-check/page.tsx`'s iframe
shell (current commander-side fix patched the scrollbars but the
real fix is the React rewrite). Drop the `mm-hc-frame*` CSS once
parity tested.

**F** — Keep `public/health-check/` static files for one cycle as a
fallback / archive — delete in a follow-up after Ed signs off.

**G** — Smoke checklist (manual): every step type renders, branching
honoured, sticky-search-embed works, email submit creates lead +
redirects to BOS.

**H** — Chapter `04-health-check-react-rewrite.md` + MASTER row.

## NOT in scope

- Per-niche-agency question packs (Phase 12 R4 — T7 territory if
  reactivated).
- Drag-to-reorder questions in admin (post-ship — operator JSON).
- Multi-language HC (Phase 12 + post-ship).

## When done
DONE referencing `008-hc-react-rewrite-tracking.md`.
