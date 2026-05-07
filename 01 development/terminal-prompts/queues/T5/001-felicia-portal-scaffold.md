/loop

# T5 — Round 001: Felicia portal scaffold (WS-F R001)

Stand up `04-the-final-portal/clients/luv-and-ker/` as Felicia's
branded portal. Skeleton consuming foundation API, brand kit seeded,
4 plugin installs.

Plan: chapter #124 WS-F R001. Sprint 3.

## Pre-read

- Chapter #19 architecture §"Per-client portal" pattern.
- T1 R016 embed-route foundation (this client portal can also be
  iframe-embedded on luvandker.com).
- T1 R025 multi-agency users (Felicia is a `client-owner` of MM).
- `runbooks/deploy.md` §4 per-client portal pattern (now stale post-
  unification — read for intent, ignore details).

## Scope

**A** — `04-the-final-portal/clients/luv-and-ker/` Next.js skeleton:
package.json proxying API to shared portal via
`NEXT_PUBLIC_PORTAL_BASE_URL`. Pages: `/` (storefront home), `/login`
(embed-style), `/account`, `/orders`, `/loyalty`.

**B** — Brand kit seeded in foundation: ochre + cream palette + heritage
script font for headings + sans-serif for body. Brand kit values pulled
from `ed-dropbox/luvandker/` if present, else operator placeholders.

**C** — 4 plugin installs for the Felicia client record:
website-editor (T3), ecommerce, memberships, client-crm. Default
phase preset: "Live".

**D** — Customer auth: end-customer signs in via embed-login → cookie
on `milesymedia.com` origin (parent app) — works because of the
unified-host model (chapter #121).

**E** — Smoke checklist for operator (in chapter): can the per-client
portal boot, fetch `/api/auth/me` from shared portal, render brand kit,
list installed plugins, fetch products from ecommerce.

**F** — Chapter `04-felicia-portal-scaffold.md` + MASTER row.

## NOT in scope
- Real product data (R002).
- End-customer flow polish (R003).
- Custom domain (luvandker.com → Vercel — post-ship).

## When done
DONE referencing `001-felicia-portal-scaffold.md`.
