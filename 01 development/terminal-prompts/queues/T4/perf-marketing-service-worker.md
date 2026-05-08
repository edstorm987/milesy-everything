/loop

# T4 — perf-followup: Service worker for marketing pages

Stale-while-revalidate caching for the marketing surface so
return visits hydrate from disk while the network refreshes in
the background. Best-in-class for lead-magnet sites with high
return-visit ratios.

## Pre-read

- Chapter #168 (perf audit context).
- `src/components/SiteShell.tsx` (current asset loading).
- `next.config.ts` headers (CSP — `script-src` must allow the SW
  registration script if inline; use a separate `.js` file).

## Scope

**A** — Add `public/sw.js` (vanilla service worker, no Workbox
unless tree-shaking is provably better). Routes covered:
  - Cache-first: `/_marketing/styles.css`, font files, favicon set.
  - Stale-while-revalidate: `/`, `/for-*`, `/resources`,
    `/health-check`, `/business-os`, `/incubator`.
  - Network-only: `/api/*`, `/portal/*`, `/embed/*`, `/login`,
    `/signup`, anything with `Set-Cookie`.

**B** — Register from a small client component mounted by SiteShell
(progressive enhancement — page works without SW).

**C** — Versioning: cache name keyed on a build-time `BUILD_ID`
constant so an old SW evicts on deploy.

**D** — Smoke + manual offline check (pull network → reload page →
stale content renders → toast "Offline mode" optional).

## HARD BOUNDARY

T4 territory. Don't cache `/portal/*` — those are session-bound.
CSP + cookie surfaces stay network-only.

## Q-ASSUMED at queue time

- Skip Workbox for v1 (vanilla SW is ~2 KB).
- No push notifications, no background sync — out of scope.
- Toast UX optional — start with silent SW.
