# Final marketing copy pass — pre-ship (T4 R005, Sprint 2)

The last polish round before the ship gate for T4. Targeted sweep —
not a full rewrite — focused on rough edges flagged by chapter #68
honesty contract + footer/legal consistency + dev/pov clarity.

## Pages touched

- `public/_marketing/index.html`
- `public/_marketing/for-skincare.html`
- `public/_marketing/for-coaching.html`
- `public/_marketing/for-fitness.html`
- `public/_marketing/for-agencies.html`
- `public/_marketing/privacy.html` *(new)*
- `public/_marketing/terms.html` *(new)*
- `src/app/dev/pov/page.tsx`
- `next.config.ts` (rewrites for `/privacy` + `/terms`)

## Significant rewrites

- **Marketing-ese hit on the Services section H2.** Before:
  `"Bespoke solutions, big to small."` After: `"Engagements that fit,
  from a sprint to a stack."` ("solutions" was the only true jargon
  flag from the audit; "leverage" hits in the coaching page are
  retained — they're meaningful in coaching context, not jargon.)

- **dev/pov persona cards now carry a `sees:` line.** Each card was
  role + email + landing URL only. Added a one-sentence "what this
  persona actually sees" so the QA flow is obvious before clicking.
  Founder: "All agencies in the switcher, every plugin admin, full
  activity inbox." Demo agency-owner: "One agency dashboard, the demo
  client roster, plugin admins for that agency only." Demo client-
  owner (Felicia): "Their own client portal — onboarding, kanban,
  reports — scoped to one client." Demo end-customer: "The storefront
  face — only what a paying customer of one client sees."

- **Footer parity across all marketing pages.** Niche pages used
  relative `index.html#industries` (would 404 under the `/` rewrite
  from niche-page paths) and lacked Privacy / Terms / Resources
  links. Index footer also lacked Privacy / Terms. Now every
  marketing page footer carries: Health Check · Incubator · Resources
  · Industries · (Client portal + Demo only on index) · Privacy ·
  Terms · email. Cross-page section anchors absolute (`/#industries`).

- **Privacy + Terms stub pages shipped** at
  `public/_marketing/privacy.html` + `terms.html`. Plain-English
  v1 stubs labelled as such; the long-form policy lands before the
  first paid customer (chapter #124 ship gate). `next.config.ts`
  rewrites `/privacy` and `/terms` so the URLs are clean.

- **Last-deployed footnote refreshed** in index footer
  (2026-05-04 → 2026-05-07).

## Audits clean

- **Image alt audit**: zero `<img>` without `alt` across the marketing
  surface (grep verified).
- **H1 audit**: every page has exactly one `<h1>` (verified by R002
  SEO tool's same check earlier this sprint).
- **Marketing-ese sweep**: only "solutions" hit was the index Services
  H2 — fixed above. "Leverage" usage in for-coaching is preserved as
  meaningful (capacity multiplication for solo coaches, not buzzword).

## What stayed

- All hero copy, audiences grids, services bullets, replaces tables —
  these passed the read-through clean. Honesty contract already in
  place (ranges, no fabricated numbers, "your data stays yours"
  disclosures in HC + niche-page footnotes).
- styles.css untouched (per scope: text only).

## Out of scope

- New marketing pages (post-ship).
- Visual redesign / styles.css edits beyond text-only.
- iframe→React rewrites for HC / Incubator (post-ship).
- Long-form versioned legal documents (replace stubs before first
  paid customer).
