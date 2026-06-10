/loop

# T3 — Round 026: Private / password-protected pages

Per-page privacy levels: public / unlisted / password / members-only.
Storefront enforces; editor surfaces toggle + password field.

## Mandatory pre-read

1. T3 R007 cookie consent + force-password-change pattern.
2. Existing page persistence shape.

## Scope

**A** — Per-page `privacy` enum + `passwordHash?` (scrypt or
PBKDF2) + cookie-based gate session.

**B** — Storefront: public renders normally; unlisted = 200 but no
sitemap; password = challenge form + cookie unlock; members-only =
checks session role.

**C** — Editor: privacy chip in page settings; entering password
hashes client-side before submit.

**D** — Smoke + chapter `04-private-pages.md` + MASTER row.

## NOT in scope

- Multi-password / temporary access tokens.
- Per-block privacy.

## When done
DONE referencing `026-private-pages-password.md`.
