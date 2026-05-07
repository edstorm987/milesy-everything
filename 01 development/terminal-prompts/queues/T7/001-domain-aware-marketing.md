/loop

# T7 — Round 001: Domain-aware marketing render (Phase 12 R3)

`aquaoasis-web.com` (and other niche-agency domains) should hit the
same Next.js host but render with that agency's brand kit + tagline +
lead magnet. Today every domain gets Milesy Media's marketing front.

Plan ref: chapter #123 §"Multi-agency vision" gap #3 (lazy path).
chapter #124 Phase 12 R3.

## Pre-read

- Chapter #123 §"Multi-agency vision" + §"Architectural fit".
- Chapter #131 `agencyIds[]` (multi-agency core in T1).
- Chapter #143 AquaOasis Demo content (the existing demo agency to
  test against).
- `next.config.ts` — current `beforeFiles` rewrites for `/` and
  `/for-*`.

## Scope

**A** — NEW `src/lib/server/agencyByDomain.ts` — host-header-based
resolver: takes `Host` header, returns `Agency | null`. Reads from
foundation `agency.metadata.marketingDomain` (NEW field). Caches
per-instance for 60s.

**B** — Middleware extension: when host matches a non-default
agency's marketingDomain, set request header `x-aqua-agency-id` for
downstream route to read.

**C** — NEW `src/app/(agency-marketing)/page.tsx` — JSX route group.
Reads `x-aqua-agency-id`, fetches agency record, renders marketing
home with that agency's brand kit + tagline + lead-magnet pointer.
Falls back to default Milesy Media when header absent.

**D** — Local dev: `aquaoasis-web.local` (etc/hosts entry — operator
action) → `:3030` → middleware sees host → resolves to AquaOasis
Demo agency (ch#133 + #143) → renders teal/heritage-lite branded
home.

**E** — Smoke `§ Domain-aware marketing` (≥8 — host-resolver hits
+ misses + cache TTL + 60s expiry + middleware sets header + JSX
reads header + brand kit drives CSS-vars + fallback to default).

**F** — Chapter `04-domain-aware-marketing.md` + MASTER row.

## NOT in scope

- Real DNS / Vercel domain attach (T6 R004).
- Per-agency niche-page variants (R002 next).
- Per-agency Resources mega-menu / footer (R+1 inside this lane).

## When done
DONE referencing `001-domain-aware-marketing.md`.
