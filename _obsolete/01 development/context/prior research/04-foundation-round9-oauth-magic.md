# 04 — Foundation Round 9: Google OAuth + magic-link sign-in (T1)

R8 stitched milesymedia + Aqua portal as one origin (`7074f49`). R9
widens the auth front door so the existing email/password form is no
longer the only way in.

## What shipped

Three additive auth paths, each env-/install-gated. Existing
email/password flow at `/api/auth/login` is untouched.

### Goal A — Google OAuth (agency + client tiers)

`src/lib/server/oauthGoogle.ts` (~170 LOC) — pure helpers, no
`server-only` import (smoke imports it directly via tsx). Surface:

- `readGoogleOAuthConfig(redirectFallback?)` reads
  `GOOGLE_OAUTH_CLIENT_ID` + `GOOGLE_OAUTH_CLIENT_SECRET` (+ optional
  `GOOGLE_OAUTH_REDIRECT_URI`). Returns `null` when either is unset.
- `isGoogleOAuthConfigured()` — env probe used by `LoginForm` to
  decide whether to render the "Continue with Google" button. Default
  unset → button hidden, start/callback routes 404.
- `buildAuthorizeUrl(config, { returnUrl, secret })` — returns
  `{ url, state }`. State is HMAC(`nonce|exp|returnUrl`) with the
  session secret; survives serverless cold starts without server-side
  state storage.
- `verifyOAuthState(state, secret)` — round-trip verifier.
- `exchangeAndVerify(config, code, { fetchImpl? })` — POSTs the auth
  code to `https://oauth2.googleapis.com/token`, then verifies the
  returned ID token against `https://oauth2.googleapis.com/tokeninfo`
  with audience + issuer + expiry checks. `fetchImpl` injection lets
  smoke run without network.

Routes:

- `GET /api/auth/oauth/google/start?return=<url>` — redirect to
  Google's authorize URL. 404 when env not configured.
- `GET /api/auth/oauth/google/callback?code=…&state=…` — verifies
  state, exchanges code, looks up the email, issues `lk_session_v1`,
  redirects to `returnUrl`. **First-run bootstrap**: when there are
  no agencies the OAuth identity bootstraps a default agency and
  becomes its `agency-owner` (mirrors the password-form bootstrap at
  `/api/auth/login`). **Existing-email path**: `getUser(email)` (no
  scope) — agency/client tier match wins. End-customer is
  intentionally not matched here; those go through magic-link.
  **Unknown email**: redirects back to `/login?oauth_error=unknown_email`
  (the architecture's "contact your agency admin" surface).

**Q-ASSUMED**: tokeninfo over JWKS for v1. JWKS-local verification
(via `jose`) is a v2 hardening — gets the network call off the hot
path but adds a dep. Documented as deferred.

**Q-ASSUMED**: OAuth-bootstrapped accounts get a random unguessable
password so the password form path stays closed for that account
until the user explicitly sets one. Future round: store an
`authProviders: Set<"password"|"google">` field on `ServerUser`.

### Goal B — Magic-link sign-in (end-customers)

`src/lib/server/magicLink.ts` (~130 LOC) — same no-`server-only`
posture. Surface:

- `signMagicToken({ email, clientId, agencyId })` — returns
  `{ token, payload }`. Token = `base64url(JSON({…, exp, nonce}))` +
  `.` + `HMAC(SHA256, PORTAL_SESSION_SECRET, body)`. Default TTL
  900s (15 min). Each token has a 16-byte random nonce.
- `verifyMagicToken(token)` — round-trip verifier; rejects malformed
  / bad-sig / expired / missing-claim payloads.
- `isUsed(nonce)` / `markUsed(nonce, exp)` — single-use replay guard.
  In-memory `Map<nonce, exp>` with on-call GC. **v1 limitation**:
  process-local. Multi-instance prod needs a shared store (Redis or
  the `portal_kv` table from R7); flagged as R10 hardening.
- `registerMagicLinkDelivery(fn)` / `deliverMagicLink({…, magicUrl})`
  — pluggable delivery hook. T2 R10's email-sender registers an
  adapter at boot; when unset, the URL is logged to console so
  developers can copy/paste. Response includes `via:
  "email-sender"|"console"` + (dev only) `devMagicUrl`.

Routes:

- `POST /api/auth/magic/request` body `{ email, clientId, returnUrl? }`
  — resolves clientId to a Client, checks
  `client.endCustomers.signupsEnabled !== false` (mirrors the R5
  end-customer-signup gate; disabled → 403), per-IP + per-(client,
  email) rate limits, signs token, calls `deliverMagicLink`. Returns
  `{ ok: true, sent, via }` regardless of whether the email exists
  (don't leak account existence).
- `GET /api/auth/magic/verify?token=…&return=…` — verifies, checks
  `isUsed(nonce)` (replay → redirect to `/login?magic_error=already_used`),
  `markUsed`, looks up or auto-creates the end-customer (the token
  itself is proof of email ownership), issues session, redirects.
- `/login/magic` — Next.js page that does a server-side redirect into
  `/api/auth/magic/verify` with the original query string. Keeps the
  user-visible URL clean.

### Goal C — LoginForm + EmbedLogin updates

`src/app/login/LoginForm.tsx`:

- New props `googleEnabled?: boolean` + `magicLinkEnabled?: boolean`.
- New mode `"magic"` (alongside existing `"signin"` / `"signup"`).
  Magic mode submits to `/api/auth/magic/request` instead of `/login`;
  on success renders a confirmation banner with optional dev
  click-through link.
- Renders `<a href="/api/auth/oauth/google/start?return=…">Continue
  with Google</a>` button + horizontal "or" divider when
  `googleEnabled`.
- Renders a small "Email me a magic link instead" toggle below the
  submit when `magicLinkEnabled && clientId`.

`src/app/login/page.tsx` (top-level `/login`) passes
`googleEnabled={isGoogleOAuthConfigured()}`. Magic-link is hidden at
`/login` (no clientId context) — that surface is for agency/client
tier sign-in.

`src/app/embed/login/page.tsx` (`/embed/login?client=…`) passes both
`googleEnabled` and `magicLinkEnabled={allowSignup}` so end-customers
embedded under a Live client get the full passwordless option.

## Smoke (18/18 pass)

`npx tsx --test scripts/smoke-auth-oauth.test.ts` (11 cases):

- env gating — unset → not configured / both set → configured.
- `buildAuthorizeUrl` shape — all required params + state echoed.
- `verifyOAuthState` round-trip preserves returnUrl.
- bad signature / malformed state rejected.
- `verifyIdToken` happy path returns normalised claims (email lower-
  cased, `emailVerified: boolean`).
- audience mismatch / expired / `missing_id_token` rejected.
- `exchangeAndVerify` combines token-exchange + verify with mocked fetch.

`npx tsx --test scripts/smoke-auth-magic.test.ts` (7 cases):

- `signMagicToken` → `verifyMagicToken` round-trip; email lower-cased.
- tampered signature / malformed / expired payload rejected.
- single-use: `markUsed` flips `isUsed` → true (replay rejection).
- delivery hook: registered fn called, reports `via:"email-sender"`.
- delivery hook: unregistered falls back to console (`via:"console"`,
  `delivered:false`).

`npm run smoke:auth-oauth` + `npm run smoke:auth-magic` aliases. tsc
clean across the portal (`npx tsc --noEmit`).

## Deviations from prompt

- Smoke files are `.test.ts` (run via `tsx --test`), not `.mjs`. The
  helpers under test are TypeScript modules with type-level invariants
  worth preserving in the smoke harness; this matches T6 R2's
  `smoke-vercel-domain.test.ts` precedent. `npm run smoke:auth-{oauth,
  magic}` aliases shadow the same surface area.
- ID-token verification uses Google's `tokeninfo` endpoint, not local
  JWKS validation. Q-ASSUMED for v1 (no extra dep, fewer moving
  parts). `jose`-based JWKS verify deferred to R10.
- "Magic-link covers reset for end-customers; agency-side password
  reset is a future round" — honoured. No reset surface added.

## v1 limitations (documented as R10+ hardening)

- **Single-process magic-link nonce store**. Multi-instance prod will
  see replay-allowed under load-balancing. Move to `portal_kv` blob
  with `magic-used/<nonce>` keys (cheap, R7's storage abstraction
  already supports prefix scans for GC).
- **OAuth user record has random password**. Password form is
  technically still mounted; closing it permanently means storing
  `authProviders` and gating `verifyPassword` on it.
- **No CSRF cookie on the start route** beyond the HMAC state. State
  is cookie-less by design (serverless-safe). Adequate for OAuth's
  redirect flow; not adequate for arbitrary CSRF on POST mutations
  (we don't add any here).

## Cross-team handoffs

- **T2 R10 (email-sender)**: register a `MagicLinkDelivery` at plugin
  boot via `registerMagicLinkDelivery(fn)` so production magic-link
  emails go through the EmailService instead of `console.log`. The
  hook receives `{ email, clientId, agencyId, magicUrl }` — let
  email-sender resolve a default identity, build a templated body
  with the click-through, and call its own `enqueue()`. Until R10
  wires this, magic-link works in dev (URL logged) but never sends
  in prod.
- **T6 R2 (domains)**: prod redirect URI must match the Vercel
  custom domain attached to the portal — `GOOGLE_OAUTH_REDIRECT_URI`
  env should be set to `https://<portal-host>/api/auth/oauth/google/callback`
  in the production deploy config. Add a one-line note to the deploy
  runbook §3 env taxonomy.
- **T3 (website-editor)**: no action. Auth is foundation territory.
- **T4 (UX)**: when polishing the login surface, the "Continue with
  Google" button uses a placeholder `🔐` icon — swap for the official
  Google glyph + ensure the contrast/focus-ring treatment matches
  the rest of the UI primitives.

## Files

```
04-the-final-portal/portal/src/
  lib/server/oauthGoogle.ts                                    NEW
  lib/server/magicLink.ts                                      NEW
  app/api/auth/oauth/google/start/route.ts                     NEW
  app/api/auth/oauth/google/callback/route.ts                  NEW
  app/api/auth/magic/request/route.ts                          NEW
  app/api/auth/magic/verify/route.ts                           NEW
  app/login/magic/page.tsx                                     NEW
  app/login/LoginForm.tsx                                      MOD (Google btn + magic mode)
  app/login/page.tsx                                           MOD (pass googleEnabled)
  app/embed/login/page.tsx                                     MOD (pass google + magic)
04-the-final-portal/portal/scripts/
  smoke-auth-oauth.test.ts                                     NEW (11 cases)
  smoke-auth-magic.test.ts                                     NEW (7 cases)
04-the-final-portal/portal/package.json                        MOD (2 npm script aliases)
```
