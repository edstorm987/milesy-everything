/loop

# T5 — Round 003: End-customer flow (WS-F R003)

Felicia's customer signs up via her storefront → embed-login on her
domain → sees their account/orders. Proves the three-audience model
end-to-end.

Plan: chapter #124 WS-F R003. Sprint 3.

## Pre-read

- T5 R001 + R002 (portal scaffold + content).
- T1 R016 embed-route + R009 embed-login.
- Chapter #19 architecture §"Three nested levels" — end-customer is
  the third tier.

## Scope

**A** — Storefront sign-up CTA: "Create account" links to embed-login
in sign-up mode. Captures email + password (or magic-link). Creates
end-customer user scoped to Felicia's clientId.

**B** — Customer account routes:
- `/account` — name, email, addresses
- `/orders` — past purchases (read from ecommerce)
- `/loyalty` — memberships state (read from memberships plugin)
- `/logout`

**C** — Sign-in surface: embed-login on storefront page (sticky pill +
modal) OR full-page `/login` — both share session cookie on
`milesymedia.com` origin (Felicia's domain proxies through; explicit
when post-ship custom-domain provisioning lights up).

**D** — Manual smoke checklist: walk through end-customer signup,
sign-in, view orders, view loyalty, sign out. Document in chapter.

**E** — Ship-gate verification — this is THE proof for chapter #124's
"end-customer flow tested" line. Operator dry-run signs off.

**F** — Chapter `04-felicia-end-customer-flow.md` + MASTER row.

## NOT in scope
- Real Stripe checkout flow (post-ship).
- Custom-domain provisioning per client (post-ship).

## When done
DONE referencing `003-end-customer-flow.md`. Commander updates ship
gate status in chapter #124.
