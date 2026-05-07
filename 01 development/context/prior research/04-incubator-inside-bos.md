# Chapter #159 — Incubator-inside-BOS (T4 R009)

## Why

Ed: *"the incubator lives inside business its like to get you setup
for it effectively so we need to wire this in."*

Until R009 the Incubator was a separate top-level surface
(`/incubator`, chapter #123 fix-6 SiteShell wrap). Going forward it
**is the setup phase of Business OS** — when a lead first lands on
BOS they're routed through the Incubator first, then graduate to the
main BOS dashboard once the four lesson-gated phases are done.

## Canonical paths (single source of truth)

- `/business-os/incubator`           → Incubator index (the setup hub)
- `/business-os/incubator/<page>`    → all phase + nav pages
- `/business-os/app.html`            → BOS dashboard (post-graduation)
- `/incubator` (bare)                → server-redirects to `/business-os/incubator`
                                       via `src/app/incubator/page.tsx`
- `/incubator/<page>`                → 307-redirects to `/business-os/incubator/<page>`
                                       via `next.config.ts redirects()`

The static incubator app continues to live at `public/incubator/`.
We did **not** physically move files (R009 picks the simpler shape
per chapter #68) — moving every internal `/incubator/...` asset
path was higher-risk than wiring two rewrites + one redirect. The
canonical URL is what users see; the on-disk location is an
implementation detail.

## Rewrite + redirect wiring (next.config.ts)

```ts
beforeFiles: [
  { source: "/business-os",                     destination: "/business-os/index.html" },
  { source: "/business-os/incubator",           destination: "/incubator/index.html" },
  { source: "/business-os/incubator/:path*",    destination: "/incubator/:path*" },
  // ...
]
async redirects() {
  return [
    { source: "/incubator/:path+", destination: "/business-os/incubator/:path+", permanent: false },
  ];
}
```

The bare `/incubator` is owned by `src/app/incubator/page.tsx` which
now `redirect()`s to `/business-os/incubator` (no SiteShell wrap;
the static app already has its own header). Marketing nav in
`SiteShell.tsx` (header + footer) keeps `/incubator` as the link
target — it transparently redirects, so no nav edit was needed.

## Setup gate (BOS app.html)

Inline `<script>` in `app.html` runs before the dashboard paints:

1. `?skipSetup=1` → never gate (dev bypass + commander tooling).
2. `?graduated=1` → set `bos.incubatorComplete=true`, render
   dashboard (the Incubator's graduate CTA bounces here).
3. `bos.incubatorComplete === 'true'` → render dashboard.
4. No `bos.user` → don't gate (the auth wall handles routing).
5. Otherwise → `location.replace('/business-os/incubator')`.

`public/business-os/index.html` (signup form + dev bypass) was
updated similarly:
- Real signup → routes to `/business-os/incubator` (unless
  `bos.incubatorComplete` already true → straight to dashboard).
- Dev bypass → seeds `bos.incubatorComplete=true` and lands on
  `app.html?skipSetup=1` (preserves the demo dashboard shortcut).

## Sidebar Setup section (bos.js)

`buildSidebarNav()` now prepends a `bos-side-setup` block at the
**top** of the sidebar with five canonical phases per chapter #66:

| # | id              | label              | icon |
|---|-----------------|--------------------|------|
| 1 | epic-intro      | Epic Intro         | 🌅   |
| 2 | blueprint       | Blueprint          | 📐   |
| 3 | diagnostics     | Diagnostics        | 🔬   |
| 4 | brand-builder   | Brand Builder      | 🎨   |
| 5 | mastery         | Traffic & Mastery  | 🏛   |

Per-phase done-state reads `incubator.phaseAdvanced` (the existing
`{phaseId:true}` map written by `lib/phase-advance.js`). Done rows
flip to `is-done` (sage tick). When `bos.incubatorComplete` is true,
all five render done and the section header carries a
`Setup Complete ✓` pill.

Q-ASSUMED: phase 5 (Mastery) has no lesson gate — it's the final
"graduate" CTA on the Incubator index. The four lesson-gated phases
in `lib/phase-advance.js` (`epic-intro` / `blueprint` / `diagnostics`
/ `brand-builder`) match `PHASE_LESSON_REQUIREMENTS` exactly; mastery
is layered on top by R009 and graduates to the dashboard rather than
to a "phase 5" page.

## Graduate CTA (incubator/index.html)

A new `<section data-inc-graduate>` paints when
`incubator.phaseAdvanced['brand-builder']` is true. Click → set
`bos.incubatorComplete=true`, redirect to
`/business-os/app.html?graduated=1`. Listens for the existing
`incubator:phase-complete` CustomEvent (dispatched by phase-advance)
so the CTA appears live the moment the user marks Brand Builder
done, no reload.

A floating "← Business OS" pill in the top-right gives mid-setup
users a peek-back escape hatch (the dashboard gate bounces them
right back unless `?skipSetup=1`).

## localStorage contract

| key                          | shape          | written by                                              |
|------------------------------|----------------|---------------------------------------------------------|
| `bos.incubatorComplete`      | `'true'/'false'` | dev-bypass (index.html), graduate CTA (incubator/index.html), `?graduated=1` (app.html) |
| `incubator.phaseAdvanced`    | `{phaseId:true}` | `lib/phase-advance.js#markComplete` (existing)        |
| `incubator.phase`            | current phase id | `lib/phase-advance.js#setCurrentPhase` (existing)     |
| `bos.user`                   | `{name,business,email,niche}` | `index.html` signup (existing)         |

## Manual smoke checklist

1. Clear localStorage. Visit `/business-os` → auth shell.
2. Sign up. Should land on `/business-os/incubator` (NOT app.html).
3. Floating "← Business OS" pill on Incubator → app.html with
   `?skipSetup=1` → dashboard renders, sidebar Setup section shows
   five phases all unticked, no "Setup complete" pill.
4. Open DevTools, set `localStorage['incubator.phaseAdvanced'] =
   '{"epic-intro":true,"blueprint":true}'`, reload BOS — first two
   sidebar phases tick green.
5. Set `incubator.phaseAdvanced['brand-builder']=true`, reload
   `/business-os/incubator` — graduate CTA appears.
6. Click "Graduate to Business OS →" → `/business-os/app.html?graduated=1`
   → dashboard renders, "Setup complete ✓" pill in greeting,
   sidebar Setup label has `Setup Complete ✓` pill, all 5 phases tick.
7. Visit `/incubator` → 307 → `/business-os/incubator`.
8. Visit `/incubator/phase-2-blueprint.html` → 307 →
   `/business-os/incubator/phase-2-blueprint.html`.
9. Visit `/business-os` from a fresh browser (no `bos.user`) →
   auth shell, no setup-gate redirect (only signed-in users gate).
10. Dev bypass on `/business-os` → app.html, no gate redirect
    (bypass seeds `bos.incubatorComplete=true`).

## Cross-team handoffs

- **T1** — none. The setup gate, sidebar, and graduate CTA all live
  inside T4 territory (`public/business-os/`, `public/incubator/`,
  `src/app/incubator/page.tsx`, `next.config.ts` rewrites/redirects).
  No middleware, no API, no portal route changes.
- **T2** — none. The Incubator is still a static app; lesson
  progress writes still go to `bos.lessonProgress` (existing); the
  leads-pipeline plugin is unaffected.
- **Future** — when the Incubator is rebuilt as a real React surface
  (chapter #123 fix-6 follow-up), the canonical path stays
  `/business-os/incubator` — the rewrite gets retired and a real
  `src/app/business-os/incubator/page.tsx` route takes over.

## Files touched

- `04-the-final-portal/milesymedia-website/next.config.ts`
  (rewrites + new redirects())
- `04-the-final-portal/milesymedia-website/src/app/incubator/page.tsx`
  (SiteShell wrap → server redirect)
- `04-the-final-portal/milesymedia-website/public/business-os/bos.js`
  (Setup section in sidebar, phase helpers on `window.BOS`)
- `04-the-final-portal/milesymedia-website/public/business-os/styles.css`
  (Setup section styles, complete pill)
- `04-the-final-portal/milesymedia-website/public/business-os/app.html`
  (setup-gate inline script, graduation pill)
- `04-the-final-portal/milesymedia-website/public/business-os/index.html`
  (signup → incubator; dev bypass marks complete)
- `04-the-final-portal/milesymedia-website/public/incubator/index.html`
  (Graduate CTA section, "← Business OS" floating pill)
