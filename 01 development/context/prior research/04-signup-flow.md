# T1 R020 — Real signup flow

`/login` shipped first-run bootstrap (creates "Milesy Media" agency on the first user when zero agencies exist). `/signup` was missing — the marketing-site Demo banner's "Sign up →" CTA pointed at `/login?from=demo` as a placeholder (R013). This round closes that gap with a real signup endpoint that creates a NEW agency for any visitor, auto-logs them in, and emits an HMAC verification token.

## Goal A — `/signup` page + form

NEW `src/app/signup/page.tsx` server component (mirrors `/login/page.tsx` shape: Suspense + brand voice + `isGoogleOAuthConfigured()` server-fetch passed to client form). Tagline copy "Where Healing Meets Revolution" per Aqua brand voice.

NEW `src/app/signup/SignupForm.tsx` client component:

- Three fields: company name, email, password (≥8 chars, browser-native `minLength=8`).
- "Continue with Google" link at the bottom — server-fetched `googleEnabled` flag hides it when env unset (graceful degradation per R009).
- "Already have an account? Sign in →" footer link.
- `?from=demo` query param shows an emerald notice "Convert your sandbox into a real agency. Your demo data won't carry over." — DemoBanner's CTA points here.
- POSTs `/api/auth/signup` JSON body `{companyName, email, password}`.
- On success: `router.push(json.redirect)` → `/portal/agency`. Dev mode: surfaces `devVerifyUrl` in an amber notice (also console-logged server-side).
- Test ids: `signup-form`, `signup-company`, `signup-email`, `signup-password`, `signup-submit`, `signup-google`, `signup-error`.

## Goal B — `/api/auth/signup` POST + auto-login

NEW `src/app/api/auth/signup/route.ts`. Flow:

1. **IP rate-limit** — `signup:<ip>` 5/min via existing `rateLimit` helper. Returns 429 with `retry-after`.
2. **Validation** — companyName non-empty, email contains `@`, password ≥8.
3. **Email collision** — `getUser(email)` (plain-email key, hits agency/client tier; end-customer emails are per-client scoped so don't conflict here). Returns 409 with friendly "try signing in" copy.
4. **Bootstrap** — `bootstrapAgency({name: companyName, ownerEmail: email})` creates the Agency + auto-installs every `core: true` plugin via `installCorePluginsForScope`. Existing onInstall hooks fire (kanban / sops / agency-hr / fulfillment seed defaults). The provisional `usr_pending_<ts>` actor lets the `agency.bootstrap` activity entry record an actor before the real user lands a moment later.
5. **createUser** — `role: "agency-owner"`. The user's role is hard-coded; first-Founder semantics.
6. **Verification token** — `signVerifyEmailToken({userId, email})` HMAC-signs a 24h-TTL payload. URL: `<origin>/api/auth/verify-email?token=…`. Dev mode console-logs the URL + adds `devVerifyUrl` to response body. T2 R10's email-sender owns SMTP delivery (NOT in scope per prompt).
7. **Auto-login** — `issueSession` + `sessionCookie` set on the response. Client redirect to `/portal/agency`.

Activity log entry: `category: "auth", action: "agency.signup"`.

## Goal C — `/api/auth/verify-email` GET

NEW `src/app/api/auth/verify-email/route.ts`. Flow:

1. Read `?token=` query param → 400 if missing.
2. `verifyVerifyEmailToken(token)` — HMAC signature check + payload claim check + expiry check.
3. `isVerifyNonceUsed(nonce)` — replay protection.
4. `getUserById(payload.userId)` — 400 if user no longer exists.
5. Defensive email match — refuses if the token's email doesn't match the user's current email (defends against tampered tokens that swap users).
6. `markEmailVerified(user.id)` — sets `emailVerifiedAt: Date.now()` on the user record (idempotent).
7. `markVerifyNonceUsed(nonce, exp)` — single-use enforcement.
8. Activity log `auth.email_verified`.
9. **Redirect** to `/portal/agency?verified=1` — banner-ready query param for a one-shot toast (R+1 wires the toast; today the redirect just lands cleanly).

V1 doesn't gate portal access on verification — users can use the portal pre-verification. Adding a banner + gate is R+1.

## Schema addition

`ServerUser.emailVerifiedAt?: number` — single optional field, epoch ms. New helper `markEmailVerified(userId)` in `src/server/users.ts` walks the users map (which is keyed by composite email|role|client) to find the user by id and patch the row through the existing `mutate` helper. Idempotent (re-marking refreshes the timestamp).

## emailVerification.ts helper

Mirror of `magicLink.ts` (R009) — same shape, longer TTL, distinct nonce store:

- **Token**: `base64url(JSON({userId, email, exp, nonce}))` "." HMAC-SHA256 over the b64 with `PORTAL_SESSION_SECRET`.
- **TTL**: 24 hours (vs magic-link's 15 min — users may verify later).
- **Single-use**: in-memory `Map<nonce, exp>` with TTL GC. v1 single-process limitation — same caveat as magic-link, R+1 hardening shared with R10's RLS multi-instance work.
- **No `import "server-only"`** — smoke imports the module directly to test the HMAC roundtrip.

## DemoBanner CTA update

`/login?from=demo` → `/signup?from=demo`. The `from=demo` query param triggers the SignupForm's emerald notice clarifying that demo data won't persist into the new real agency.

## Goal D — smoke + chapter + MASTER row + tasks.md

NEW `scripts/smoke-signup-flow.test.ts` (10 tests via `npm run smoke:signup-flow` ~750ms):

- `signVerifyEmailToken` → `verifyVerifyEmailToken` roundtrip preserves payload (with email lowercased — `Ed@Example.com` → `ed@example.com`).
- Tampered token (signature replaced) returns `invalid_signature`.
- Malformed token (no dot separator) rejected.
- Nonce store flips correctly (`isVerifyNonceUsed` returns `true` after `markVerifyNonceUsed`).
- File existence + import-marker checks for: `/signup/page.tsx`, `/signup/SignupForm.tsx`, `/api/auth/signup/route.ts`, `/api/auth/verify-email/route.ts`, `LoginForm.tsx` (signup link), `DemoBanner.tsx` (CTA href).

10/10 pass. tsc clean.

## NOT in scope (per prompt)

- Real email send via SMTP (T2 R10 email-sender owns delivery; foundation only signs the token + logs the URL in dev).
- Multi-step onboarding wizard (single page form is the simplest correct surface).
- Banner toast on `?verified=1` landing (R+1 — query param emitted, consumer wires the toast).
- Verification-required gate on portal access (R+1 — today users can use portal pre-verification).
- Multi-process verification nonce store (shared v1 limitation with magic-link; R+1 alongside RLS hardening).

## Q-ASSUMED

- **Email collision via `getUser(email)`** (plain-email key) is the right surface — agency-owners + client-tier users share that namespace; end-customers are per-client scoped and don't conflict at signup.
- **`agency-owner` role hard-coded** at signup — Aqua's three-audience model treats the first user as Founder; secondary roles come via team-invites (R+1 round 024 already queued).
- **24h TTL** on the verification token — generous for users who don't immediately re-open their email.
- **Auto-login pre-verification** — users land in their portal immediately; verification is a follow-up (gate is R+1).

## Files touched

- `portal/src/lib/server/emailVerification.ts` — NEW HMAC token helper.
- `portal/src/app/api/auth/signup/route.ts` — NEW.
- `portal/src/app/api/auth/verify-email/route.ts` — NEW.
- `portal/src/app/signup/page.tsx` — NEW.
- `portal/src/app/signup/SignupForm.tsx` — NEW.
- `portal/src/server/types.ts` — `ServerUser.emailVerifiedAt?: number`.
- `portal/src/server/users.ts` — `markEmailVerified(userId)` helper.
- `portal/src/app/login/LoginForm.tsx` — non-embedded `/signup` link.
- `portal/src/components/chrome/DemoBanner.tsx` — CTA `/login?from=demo` → `/signup?from=demo`.
- `portal/scripts/smoke-signup-flow.test.ts` — NEW (10 tests).
- `portal/package.json` — `smoke:signup-flow` script.

tsc clean. HARD BOUNDARY honoured (zero touches to `milesymedia website/`, `business-os/`, `clients/compass-coaching/`).
