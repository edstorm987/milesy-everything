# Perf audit + easy wins (T1, 2026-05-08, chapter #168)

Ed's recurring complaint: "the app feels slow." This round audits
`04-the-final-portal/milesymedia-website/`, ships the easy wins, and
queues the hard wins for follow-up rounds.

## Build-time bundle baseline (Next 16.2.4 / Turbopack)

Next 16's Turbopack builder does **not** print the legacy
`Route (app)  Size  First Load JS` table. We capture an indicative
baseline by walking `.next/` directly via the new
`scripts/perf-baseline.mjs` (also wired as `npm run perf:baseline`).

Pre-change snapshot:

- `.next/static/chunks/` total: **2.1 MB** (76 chunks)
- Largest static chunks (top 5):
  - 224 KB `14kcf8ledydp-.js`
  - 212 KB `023qexa~3.0ub.js`
  - 208 KB `0-0owwh617cq2.js`
  - 204 KB `11~anscci704n.js`
  - 168 KB `0hksjxjsktl-k.js`
- Largest prerendered HTML (proxy for fattest static routes):
  - 65.9 KB `index.html` (`/`)
  - 39.4 KB `for-fitness.html`
  - 39.3 KB `for-skincare.html`
  - 39.2 KB `for-agencies.html`
  - 39.2 KB `for-coaching.html`
  - 38.2 KB `resources.html`

**Top three fattest routes**: `/`, the four `/for-<niche>` pages
(near-identical sizes), `/resources`. The home page lifts the JSX
home body via `dangerouslySetInnerHTML` from `_home/home.html` (340+
lines) — an obvious follow-up componentisation target but out of
scope for an "easy wins" round.

## Easy wins shipped

1. **Font loading hint**. `src/components/SiteShell.tsx` gained
   `<link rel="dns-prefetch">` for both Google Fonts hosts +
   `<link rel="preload" as="style">` for the Playfair Display
   stylesheet alongside the existing real `<link rel="stylesheet">`.
   Inter is system-stack (no preload needed). Best-guess shave:
   ~80–150 ms off first contentful paint on cold cache, more on slow
   networks. (Chapter #200 fully-async-CSS swap is a future round —
   today the preload is purely a hint upgrade so a stylesheet swap
   regression is impossible.)

2. **Code-split the resource tools**. `src/app/resources/{seo-audit,
   site-speed,accessibility-audit}/page.tsx` import their respective
   tool component via `next/dynamic` with a small loading skeleton
   (`<div className="mm-tool-loading">`). The three tool components
   are 500+ LOC of client logic, below the page header (not LCP
   critical), and only run after a user action. After the change
   each tool ships in its own client chunk and no longer joins the
   shared layout split — the *other* two resource pages no longer
   pay for this code on first paint.
   - Could not use `ssr: false` (Next 16 forbids it inside server
     components — must be a client component). Documented in source.

3. **Dev-bypass seed memoize**. `seedFounderForDevBypass` in
   `src/lib/server/founderSeed.ts` previously re-walked every
   installable plugin on every `/dev/pov` click — commander's open
   perf item. Brought back a smarter version with a 30-second TTL
   (`DEV_SEED_TTL_MS`): repeat clicks within 30 s short-circuit on
   the cached promise, but a full re-walk happens after the window
   so newly-added plugins still get picked up promptly. Failed runs
   clear the cache immediately so the next click retries (no cache
   poisoning). `_resetFounderSeedForTests` clears both promises.

4. **Public static apps already in good shape**. Audit found:
   - **Zero `<img>` tags** across `public/{health-check,business-os,
     incubator,_marketing}/*.html` (mostly icon-emoji + CSS art) —
     no `loading="lazy"` work needed.
   - **All `<script src=…>` tags already use `defer`** (chapter #123
     covered this) — verified with the smoke walker; no offenders.
   - **No legacy `X-UA-Compatible` IE meta** in any static app —
     verified by the smoke.

## Hard wins (queued for follow-up rounds)

Documented in `01 development/terminal-prompts/queues/`:

- `T1/perf-postgres-on-prod-url.md` — `PORTAL_BACKEND=postgres` on a
  real DB URL (T1 R027 wired the code; operator action ships it).
  Single biggest lever for hot-path perf in a real deploy.
- `T4/perf-cdn-image-resizer.md` — adopt the chapter #38 image
  helper per block (resource finder cards, hero images, niche-page
  hero stripes). Adds `?w=…` to every `<img>` so phones don't
  download 2000-px hero JPGs.
- `T4/perf-marketing-service-worker.md` — service worker for the
  marketing surface (`/`, `/for-*`, `/resources`, `/health-check`,
  `/business-os`, `/incubator`) with stale-while-revalidate on
  static assets. Long-tail return-visit perf.
- `T1/perf-bundle-analyzer-tree-shake.md` — wire
  `@next/bundle-analyzer`, run per-plugin tree-shake audit. The
  224 KB / 212 KB / 208 KB top chunks above are unidentifiable
  without it.

## Files touched (T1 boundary)

- `src/components/SiteShell.tsx` — font preload + dns-prefetch.
- `src/app/resources/seo-audit/page.tsx`
- `src/app/resources/site-speed/page.tsx`
- `src/app/resources/accessibility-audit/page.tsx`
- `src/lib/server/founderSeed.ts` — 30 s memoize (+ test reset).
- `package.json` — `smoke:perf-easy-wins` + `perf:baseline` scripts.
- NEW `scripts/perf-baseline.mjs`
- NEW `scripts/smoke-perf-easy-wins.test.ts` (11 cases)
- NEW queue files under `01 development/terminal-prompts/queues/`
- `01 development/tasks.md` row tick + hard-win queue row.

## Verification

- `npm run smoke:perf-easy-wins` → 11/11 pass.
- `npx tsc --noEmit` → clean.
- `npm run build` → exit 0; route table unchanged in shape, three
  resource pages still `○ (Static)`.

## Q-ASSUMED

- `ssr: false` on `next/dynamic` dropped because Next 16 requires it
  inside a client component; the tools still SSR (initial header +
  loading skeleton) but the JS chunk is now split.
- Bundle-size "before/after" not a hard number — Turbopack hides the
  per-route table. Best-guess directional improvement based on the
  number of routes that previously imported the tool components into
  their shared layout split.
- Dev-seed TTL chose 30 s as a "fast enough for dev iteration, slow
  enough that 5 rapid /dev/pov clicks don't re-walk plugins" sweet
  spot. Tunable.
- Hard-win queue files are shaped as "T<n> R+1 prompts" so future
  rounds can be picked up by either commander or the relevant
  manager. Not staged into specific R-numbers — intentionally
  scope-flexible.
