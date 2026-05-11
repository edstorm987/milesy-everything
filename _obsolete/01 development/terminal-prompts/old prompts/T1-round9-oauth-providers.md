/loop

# T1 — Round 9: OAuth providers (Google + magic-link)

R8 stitched milesymedia + Aqua portal as one surface (`7074f49`).
R9 widens the auth front door: **OAuth providers** so agency staff +
clients can sign in with Google, plus a **passwordless magic-link**
flow for end-customers (lower friction than passwords).

## Working environment

- Repo / local / branch — same.

## Messaging

- **Outbox**: `01 development/messages/terminal-1/to-orchestrator.md`
- **Inbox**: `01 development/messages/terminal-1/from-orchestrator.md`

## Mandatory pre-read

1. `04-foundation.md` (R1 — auth surface)
2. `04-end-customer-flow.md` (R5 — end-customer signup)
3. `04-architecture.md` §3 (Auth — single cookie, role-routed)
4. T6 R1+R2 chapters — coordinate with their domain + observability work
5. T2 R10 chapter `04-plugin-email-sender.md` — magic-link emails
   route through their service

## Scope — three goals

### Goal A: Google OAuth (agency + client roles)

`/api/auth/oauth/google/start` → redirect to Google → `/api/auth/oauth/google/callback`.
Verify ID token (use Google's JWKs endpoint), match email against
existing user, issue session cookie. If new email AND first-run
bootstrap mode → create agency-owner. Otherwise: existing email →
sign in; unknown email → reject ("contact your agency admin").

Provider config in env: `GOOGLE_OAUTH_CLIENT_ID` +
`GOOGLE_OAUTH_CLIENT_SECRET`. Default unset → button hidden.

### Goal B: Magic-link sign-in (end-customers)

`/api/auth/magic/request` body `{ email, clientId }` → generates a
short-lived signed token, calls **email-sender** plugin (T2 R10) to
deliver an email containing `https://milesymedia.com/login/magic?token=...`.
On click, verifies token + scopes session to `(agencyId, clientId, role: end-customer)`.

Token: HMAC-signed with `LK_SESSION_SECRET`, 15-minute TTL, single-use
(stored in `magic_used` set with TTL).

Per-client signups-enabled flag (your R5 `client.endCustomers.signupsEnabled`)
applies — if signups disabled, magic-link request fails 403.

### Goal C: LoginForm + EmbedLogin updates

Update `/login` and `/embed/login` LoginForm to render:
- Google button (when env configured)
- Email + password form (existing)
- "Email me a magic link" button (when client context implies end-customer
  pool; falls back to password mode if clientId absent)

Add a tiny passwordless toggle so the operator can pick.

## NOT in scope

- Don't add Microsoft / Apple / GitHub / Twitter OAuth — Google +
  magic only for v1.
- Don't build full SSO / SCIM — single-tenant Google.
- Don't replace existing email/password — additive.
- Don't ship password reset (magic-link covers reset for end-customers;
  agency-side password reset is a future round).

## Loop discipline

Standard. `<<autonomous-loop-dynamic>>`.

## When done

1. tsc clean.
2. Smoke (`scripts/smoke-auth-oauth.mjs` + `scripts/smoke-auth-magic.mjs`)
   covers happy paths + unknown email + expired token + replay rejection.
3. Chapter `04-foundation-round9-oauth-magic.md`.
4. MASTER row.
5. tasks.md row done.
6. DONE + COMMIT.
