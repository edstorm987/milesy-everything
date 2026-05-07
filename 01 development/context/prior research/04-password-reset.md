# T1 R038 — Forgotten-password flow

`/login` and `/signup` shipped in earlier rounds (chapter #117 covers signup; chapter #129 covers founder password rotation). What's been missing is the **forgotten-password** path — the round-trip a user follows when they can't remember their password and need a reset link. R038 closes that gap end-to-end: HMAC reset token, request-reset endpoint, completion endpoint, two new pages, and a "Forgot password?" link wired into LoginForm.

## Goal A — `lib/server/passwordReset.ts`

NEW helper that mirrors `emailVerification.ts` (chapter #117) byte-for-byte in shape but with a distinct nonce kind:

- **Token shape**: `base64url(JSON({userId, email, exp, nonce})) "." HMAC-SHA256` over the b64 with `PORTAL_SESSION_SECRET`.
- **TTL**: 24 hours — comfortable inbox-latency window; same as email-verify, longer than magic-link's 15 min since users may walk away from the inbox before clicking through.
- **Single-use**: atomic via the durable nonce store (chapter #138). New `password-reset` value added to the `NonceKind` union so the password-reset surface can't be cross-replayed against the email-verify or magic-link surfaces.
- **No `import "server-only"`** — same rationale as emailVerification.ts: smoke imports the module directly to test the HMAC roundtrip; HMAC + nonce store only take effect when actually called.

Three exports: `signPasswordResetToken`, `verifyPasswordResetToken`, `consumeResetNonce`.

## Goal B — `/api/auth/password/request-reset` POST

NEW route. Body: `{ email }`. Flow:

1. **IP rate-limit** — `password-reset-request:<ip>` 5/min (R021 helper, same shape as signup).
2. **Validate email** — must be string + contain `@`. (Shape error is fine; no oracle, since we'd reject it the same way before any lookup.)
3. **Lookup** — `getUser(email)`. If missing, fall through to the generic `{ ok: true }` success response. Never confirm-or-deny existence.
4. **Mint token** — `signPasswordResetToken({userId, email})`. Build URL `<origin>/login/reset?token=…`.
5. **Try to enqueue email** — lazy-import `emailEnqueuePort` from `leadsPipelinePorts.ts` (chapter #159 added the adapter onto the email-sender plugin). If it succeeds, the email lands in the email-sender outbox. If the port throws (foundation-pending — email-sender plugin isn't yet registered, see #159 close-out), we swallow the error and fall through to the dev-console fallback.
6. **Dev fallback** — when no email was enqueued AND `NODE_ENV !== "production"`, log the URL to the dev console and return `devResetUrl` in the response so Ed can click through locally without SMTP wired.
7. **Always return** `{ ok: true }` (with optional `devResetUrl`) — no leak. Same response shape regardless of email existence.

Activity logging is deliberately omitted at this layer — logging "password reset requested for ed@x.com" against an unknown email would be a low-key oracle. The `password_reset` activity is logged in the completion route once the user proves possession of the token.

## Goal C — `/api/auth/password/reset` POST

NEW route. Body: `{ token, newPassword }`. Flow:

1. **Verify token** — `verifyPasswordResetToken(token)` checks signature, payload claims, expiry. 400 on any failure mode (`invalid_signature`, `malformed_token`, `malformed_payload`, `missing_claims`, `expired`).
2. **Validate password** — `validatePassword(newPassword)` (≥8 chars, trivial-list filter, no single-repeat-char). 400 with the validator's error message. Done BEFORE consuming the nonce so a typo doesn't burn the token (the user can retry without re-requesting the link).
3. **Consume nonce** — `consumeResetNonce(payload.nonce, payload.exp)` atomically. Closes the check-then-mark race (multi-instance + concurrent same-token reset). 400 `already_used` on second attempt.
4. **Lookup user** — `getUserById(payload.userId)` + defensive email match (rejects `email_mismatch` if a tampered token swaps users).
5. **`setUserPassword`** — bumps `sessionRev` per chapter #120 / R021. Every existing cookie for this user is now stale and fails the freshness check on the next request — including any device that was already signed in. This is the load-bearing security guarantee of the reset flow: a leaked-and-recovered account drops every active session simultaneously.
6. **Activity log** — `category: "auth", action: "password_reset"` so the agency activity feed surfaces the event.
7. **Return** `{ ok: true, redirect: "/login?reset=1" }` so the UI can drop a one-shot toast on the login page.

## Goal D — `/login/forgot/page.tsx`

NEW server component, SiteShell-wrapped. Same chrome shape as `/login` — brand panel + auth card. Mounts `<ForgotForm />` (client island).

`ForgotForm.tsx` ("use client"):

- Single email input.
- POSTs `/api/auth/password/request-reset`.
- Success state: "Check your inbox — a reset link is on its way (valid 24h)." When `devResetUrl` is in the response, render an inline "Open it now" link (dev-only).
- Error state: in-form alert with the server's error message.
- Test ids: `forgot-form`, `forgot-email`, `forgot-submit`, `forgot-error`, `forgot-sent`, `forgot-dev-url`.

## Goal E — `/login/reset/page.tsx`

NEW server component, SiteShell-wrapped. Brand panel + auth card. Mounts `<ResetForm />`.

`ResetForm.tsx` ("use client"):

- Reads `?token=` via `useSearchParams`. Missing token → renders an explanatory error block instead of the form.
- Two password fields — new password + confirm.
- Client-side mismatch validation ("Passwords don't match.") + length check (≥8) before fetch.
- POSTs `/api/auth/password/reset`. On success, `router.replace(data.redirect ?? "/login?reset=1")` + `router.refresh()`.
- Test ids: `reset-form`, `reset-pw`, `reset-confirm`, `reset-submit`, `reset-error`, `reset-no-token`.

## Goal F — LoginForm "Forgot password?" link

`/login/LoginForm.tsx` patched: below the password input, when `!isMagic && mode === "signin"`, render a `<a href="/login/forgot" className="mm-form-toggle" data-testid="login-forgot-link">Forgot password?</a>`. The `mm-form-toggle` class lands the link in the same visual register as the existing magic-link toggle (Login premium redesign chapter palette).

## Goal G — Smoke

`scripts/smoke-password-reset.test.ts` — 12 cases, `npm run smoke:password-reset` (~1.5s).

- HMAC token roundtrip preserves payload.
- Tampered token rejected (invalid signature).
- Malformed token (no dot) rejected.
- Expired token rejected (forged exp in the past with a valid signature so we test the expiry branch in isolation).
- `consumeResetNonce` flips on second call (single-use enforced).
- Distinct kind tag — source markers verify `passwordReset.ts` uses `"password-reset"` and `nonceStore.ts` `NonceKind` union includes it.
- File-structure source markers (7 cases): lib exports, request-reset rate-limits + no-leak regex, reset route verifies + consumes + setUserPassword + sessionRev reference + redirect + activity action, both pages + form components exist with expected wiring, LoginForm forgot-password link.

The smoke is a mix of pure-runtime checks (passwordReset.ts + nonceStore.ts have no `import "server-only"` shim — they're explicitly importable from smokes) and source-marker checks for the route handlers + pages whose dependency graphs reach into `users.ts`/`storage.ts` (server-only — tsx --test can't load them). Pattern matches chapter #117 (signup-flow smoke) and #138 (durable-nonce smoke).

## NonceKind extension

`src/lib/server/nonceStore.ts`: `NonceKind = "magic-link" | "email-verify" | "password-reset" | "csrf"`. One-line addition; no adapter changes — the memory and postgres adapters key on the token string; the kind is metadata used for split analytics + cross-kind isolation guarantee at the call site.

## Foundation-pending after R038

1. **Email-sender plugin foundation registration** — `emailEnqueuePort.enqueue` throws when the email-sender plugin isn't registered in `_registry.ts` (same caveat as #159 leads-pipeline foundation glue). The request-reset route catches the throw and falls through to the dev-console URL log, so the flow works end-to-end in development. Once email-sender ships its registration round, real SMTP delivery lights up automatically — no route changes needed.
2. **Toast surfacing on `/login?reset=1`** — the redirect query param is set; `LoginForm` could render a one-shot success banner ("Password reset — sign in with your new password.") when it sees `params.get("reset") === "1"`. R+1 polish.

## Q-ASSUMED

- **`emailEnqueuePort` reuse over a new `passwordResetPort`** — chapter #159 already wraps email-sender's enqueue path; spinning a separate port just for password-reset would duplicate the foundation-pending dance. Subject + bodyText/bodyHtml shape matches `EmailEnqueueInput` exactly.
- **`triggeredByPlugin: "foundation:auth"`** — namespace clearly distinguishes auth-flow emails from plugin-emitted emails in the email-sender outbox. Chapter #144 doesn't pin a foundation-side namespace; this chapter sets the convention.
- **`externalRef: password-reset:<userId>`** — collapses double-clicks into a single outbox row via email-sender's idempotency table. No timestamp suffix so a follow-up reset request inside the email-sender's idempotency window dedupes (the inflight token is still single-use, so this is harmless).
- **Activity logged at the completion layer only** — request-reset is anonymous-by-design; logging there would be the oracle. Completion proves possession of a valid token and is the natural audit point.
- **No `mustChangePassword` flag set** — completing a reset clears `mustChangePassword` in `setUserPassword` (existing behaviour). Different from a founder-rotation flow which sets the flag (#129) — there the operator wants to FORCE a rotation; here the user just chose a new password.
- **Smoke takes the file-structure path for routes/pages** — same rationale as chapters #117/#138/#155: route handlers transitively import `server-only` modules; tsx --test runtime smokes can't drive them. Source markers + the runtime tests on the `import-clean` lib + nonceStore catch the security-critical wiring (single-use, sessionRev bump documented in source, no-leak shape).
- **Generic-success branch when email is unknown** — most production reset flows do this (Stripe, GitHub, Google). Auditable evidence trail still exists via the rate-limit metric — a flood of requests for unknown emails shows up as `password-reset-request:<ip>` 429s without being a per-email enumeration oracle.
- **Password validation gate calls `validatePassword`** — same rules as signup + admin. Trivial-list filter means a user can't reset to "password" or "12345678".
- **Session invalidation drops EVERY device, not just other devices** — by design. A leaked password is the threat model; we want every existing session gone, not just the attacker's. The user re-signs-in with the new password and gets a fresh cookie.
- **No CAPTCHA in v1** — rate-limit + no-leak generic success cover the immediate threat; CAPTCHA is an R+1 polish if we see real abuse.

## NOT in scope (R+1)

- Email-sender plugin foundation-registration round (separate; closes the dev-fallback branch for prod).
- One-shot toast on `/login?reset=1` (UI polish).
- "Account exists?" link on the login form when a sign-in fails (R+1 UX — would partially undo the no-leak design, so deliberately deferred).
- Multi-factor reset (TOTP / passkey path) — Phase 12+.
- Per-IP-per-email rate-limit refinement (today's bucket is per-IP; an attacker rotating IPs against one email would slip through — fine for v1 since the no-leak shape limits the oracle).

## Files shipped

NEW:
- `src/lib/server/passwordReset.ts`
- `src/app/api/auth/password/request-reset/route.ts`
- `src/app/api/auth/password/reset/route.ts`
- `src/app/login/forgot/page.tsx`
- `src/app/login/forgot/ForgotForm.tsx`
- `src/app/login/reset/page.tsx`
- `src/app/login/reset/ResetForm.tsx`
- `scripts/smoke-password-reset.test.ts`
- `01 development/context/prior research/04-password-reset.md` (this chapter)

PATCHED:
- `src/lib/server/nonceStore.ts` — `NonceKind` union += `"password-reset"`.
- `src/app/login/LoginForm.tsx` — "Forgot password?" link below the password input in signin mode.
- `package.json` — `smoke:password-reset` script.
- `01 development/context/MASTER.md` — chapter row.
- `01 development/tasks.md` — T1 R038 row.

`npx tsc --noEmit` clean. Smoke 12/12 pass.
