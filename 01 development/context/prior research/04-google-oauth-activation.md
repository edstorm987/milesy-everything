# 04 — Google OAuth activation (T1, post-Sprint-2)

Audit + gap-fill round on the chapter #109 R9 Google OAuth shipment.
The "Continue with Google" button has been live in `LoginForm.tsx` since
R9, gated on `isGoogleOAuthConfigured()`. This round verifies the
end-to-end flow, fills the small gaps, and wires the env into the typed
secrets surface (chapter #142) so operators can flip the button on with
three env vars and zero code changes.

## What was already working (verified, kept)

- `src/lib/server/oauthGoogle.ts` — env reader + `isGoogleOAuthConfigured()`
  + HMAC-signed stateless `state` (`nonce|exp|returnUrl`) so the
  callback verifies CSRF without a server-side store · `buildAuthorizeUrl`
  emits all required params (client_id, redirect_uri, response_type,
  scope `openid email profile`, state, access_type=online,
  prompt=select_account) · `exchangeAndVerify` POSTs to
  `https://oauth2.googleapis.com/token` then calls
  `verifyIdToken` against Google's `tokeninfo` endpoint with audience +
  issuer + expiry checks.
- `GET /api/auth/oauth/google/start?return=<url>` — 404 when env unset,
  302 to Google's authorize URL otherwise. Reads
  `PORTAL_SESSION_SECRET` for state HMAC.
- `GET /api/auth/oauth/google/callback?code=…&state=…` — verifies state,
  exchanges code, requires `email_verified`, branches:
  - **First-run bootstrap** (no agencies) → bootstraps "Milesy Media"
    agency + creates the OAuth identity as agency-owner. Random
    unguessable password closes the password-form path for that account
    (Q-ASSUMED chapter #109).
  - **Existing-email path** → `getUser(claims.email)` agency-/client-tier
    match, issues `lk_session_v1`, redirects.
  - **Unknown email** → `/login?oauth_error=unknown_email` (chapter
    architecture's "contact your agency admin" surface).
- `LoginForm.tsx` props `googleEnabled` + `/login`, `/embed/login`,
  `/embed/[clientSlug]/[variant]` server-fetch
  `isGoogleOAuthConfigured()` and pass it down — env unset hides the
  button.
- Session cookie correct: HttpOnly + SameSite=Lax + Secure-in-prod
  (verified `lib/server/auth.ts sessionCookie`).
- State token is stateless HMAC (no cookie needed) — survives serverless
  cold starts, mirrors the magic-link nonce design (chapter #109).

## Gaps filled this round

### G1 — Role-aware fallback redirect (chapter #125)

`callback/route.ts` previously redirected to whatever `state.returnUrl`
held (defaulted to `/portal`). Now: when `returnUrl === "/portal"` the
callback routes through `resolvePostLoginPath(null, user)` — agency
tier → `/portal/agency`, client tier → `/portal/clients/<slug>`,
end-customer → `/portal/customer`, **lead → `/business-os`** (chapter
#125 contract). Explicit non-default `returnUrl` still wins. This makes
Google sign-in mirror the password-form login route (which already
calls `resolvePostLoginPath`).

### G2 — Typed secrets accessors (chapter #142)

Three accessors added to `lib/server/secrets.ts`:

```
googleOauthClientId() → string | undefined
googleOauthClientSecret() → string | undefined
googleOauthRedirectUri() → string | undefined
```

All optional — env unset returns `undefined`. Typed surface so future
callers stop reading `process.env.GOOGLE_OAUTH_*` directly.

### G3 — ENV_ALLOWLIST extended

`env.ts` ENV_ALLOWLIST gains the three keys + `PORTAL_KEY_PATTERN`
gains a `GOOGLE_OAUTH_` prefix arm so the startup typo guard catches
e.g. `GOOGEL_OAUTH_CLIENT_ID`.

### G4 — `.env.example` documented

New block at the bottom with the 3 vars commented out + setup steps:
Google Cloud Console → APIs & Services → Credentials → Create OAuth
2.0 Client ID (Web application) + authorised redirect URI =
`<NEXT_PUBLIC_PORTAL_BASE_URL>/api/auth/oauth/google/callback`.

### G5 — `runbooks/deploy.md` env table

Three new rows flagged "optional (T1 R9)" with the explicit caveat
"Login still works without; just hides the button." Same broader
STALE-rewrite caveat applies (full rewrite at T6 R001).

## Smoke

NEW `scripts/smoke-google-oauth.test.ts` — 12/12 pass via
`npx tsx --test scripts/smoke-google-oauth.test.ts` (~1s):

1. env gating: all unset → not configured
2. env gating: client_id + secret set → configured + redirect derived from `NEXT_PUBLIC_PORTAL_BASE_URL`
3. start route: builds authorize URL with all 5 required params + state
4. start route: file shape — config gate, 302 redirect, return param
5. callback: malformed state fails `verifyOAuthState` (CSRF guard)
6. callback file shape — state + email_verified + session + role-aware redirect (`resolvePostLoginPath` import asserted)
7. callback file shape — unknown email → `oauth_error=unknown_email`
8. ENV_ALLOWLIST contains the 3 GOOGLE_OAUTH_* keys
9. secrets.ts exposes typed `googleOauth*` accessors (source-marker)
10. `.env.example` documents the 3 vars + setup note
11. `runbooks/deploy.md` env table lists the 3 vars as optional + "Login still works without"
12. LoginForm gates the Google button on `googleEnabled` prop

Pairs with the existing helper-level `smoke-auth-oauth.test.ts` (10
cases — buildAuthorizeUrl / verifyOAuthState / verifyIdToken happy
path / audience mismatch / expired / exchange + missing id_token).
Together: 22 cases covering the full stack.

`tsc --noEmit` clean.

## Operator setup steps (post-deploy)

1. Google Cloud Console → select / create project.
2. APIs & Services → OAuth consent screen → configure (External, your
   support email, scopes: `openid email profile`).
3. APIs & Services → Credentials → Create Credentials → OAuth 2.0
   Client ID → Application type: Web application.
4. Authorised redirect URIs:
   - Local dev: `http://localhost:3030/api/auth/oauth/google/callback`
   - Prod: `<NEXT_PUBLIC_PORTAL_BASE_URL>/api/auth/oauth/google/callback`
5. Copy the Client ID + Client Secret into Vercel env (or `.env.local`):
   - `GOOGLE_OAUTH_CLIENT_ID=…`
   - `GOOGLE_OAUTH_CLIENT_SECRET=…`
   - `GOOGLE_OAUTH_REDIRECT_URI=…` (only if the deploy origin differs
     from the registered URI)
6. Redeploy. The "Continue with Google" button appears on `/login`,
   `/embed/login`, and per-client embed login surfaces automatically.

## Q-ASSUMED

- **State stays stateless HMAC over a server-side nonce store**.
  Chapter #109 already justified this; no nonce-store regression in
  this round. JWKS-local ID-token verification (jose) still v2.
- **Role-aware fallback only fires when state's returnUrl is the
  generic `/portal`**. Explicit `?return=…` from the LoginForm is
  preserved — embed flows that pass a parent-site URL still land
  there. This matches `/api/auth/login`'s contract where `returnUrl`
  from the client config wins over `redirect`.
- **Typed accessors are advisory** — chapter #142 says new code prefers
  them; `oauthGoogle.ts`'s direct `process.env` read stays so the
  module remains tsx-importable for smoke (no `server-only` shim).
- **Cookie flags reused from `sessionCookie`** — no separate OAuth
  state cookie; HMAC state in the URL covers CSRF + survives cold
  starts. This is a deliberate trade vs PKCE / state-cookie which
  would add a per-request cookie write. Re-evaluate if state ever
  needs >300 bytes.
- **End-customers still go through magic-link** (chapter #109) — the
  callback's `getUser` lookup is intentionally agency-/client-tier
  only; no change this round.

## NOT in scope

- JWKS-local ID-token verify (v2 hardening — adds `jose` dep).
- `authProviders: Set<"password"|"google">` field on `ServerUser`
  (deferred from chapter #109).
- Multi-account picker UX (Google's `prompt=select_account` already
  forces the picker — sufficient for v1).
- Workspace-domain (`hd` claim) restrictions — surfaceable later via
  per-agency `oauthAllowedDomains` setting.

## HARD BOUNDARY

T1 only. No `plugins/`, `public/`, `clients/` touched. Files modified:

- `src/app/api/auth/oauth/google/callback/route.ts` (resolvePostLoginPath fallback)
- `src/lib/server/secrets.ts` (3 typed accessors)
- `src/lib/server/env.ts` (ENV_ALLOWLIST + pattern)
- `.env.example`
- `runbooks/deploy.md`
- `scripts/smoke-google-oauth.test.ts` (NEW)
