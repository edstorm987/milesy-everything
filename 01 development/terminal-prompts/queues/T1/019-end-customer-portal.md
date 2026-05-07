/loop

# T1 — Round 019: End-customer portal (third audience, recursion)

Per requirements §3 audiences: end-customers (Felicia's shoppers,
members, affiliates) log in via iframe on the client's own website.
T3 R013 + T1 R016 build the iframe + route — this round closes the
loop with the end-customer's actual portal surface.

## Mandatory pre-read

1. `01 development/eds requirments.md` §3 audiences + §6 recursion.
2. T1 R016 embed route chapter (must ship first).
3. Chapter 09 storefront, chapter 17 concepts to port (recursion).

## Scope

**A** — `app/portal/customer/page.tsx` server component. Logged-in
end-customer sees: branded welcome (their client's brand kit),
their orders (from ecommerce plugin), bookings (from bookings plugin),
membership (from memberships plugin), affiliate dashboard (from
affiliates plugin) — only the surfaces enabled for that client.

**B** — Per-client variant tree determines exact layout — operator
edits via T3 portal-variant editor (R012). End-customer sees their
client's specific portal-customer variant.

**C** — Sub-routes: `/portal/customer/orders` · `/account` ·
`/bookings` · `/membership` · `/affiliate` — each gated on whether
the relevant plugin is installed for that client.

**D** — Iframe-friendly: same chrome stripped when `?embed=1` or
served via `/embed/<slug>/customer` route from R016.

**E** — Smoke `§ End-customer portal` + chapter
`04-end-customer-portal.md` + MASTER row.

## NOT in scope

- New plugin development.
- Per-end-customer custom permissions beyond plugin presence.

## When done
DONE referencing `019-end-customer-portal.md`.
