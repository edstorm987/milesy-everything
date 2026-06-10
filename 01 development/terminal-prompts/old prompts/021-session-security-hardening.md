/loop

# T1 — Round 021: Session security hardening

Audit session cookie + auth surfaces for hardening. CSRF tokens,
session rotation on privilege change, brute-force protection on
login, session expiry sweep.

## Mandatory pre-read

1. T1 R009 auth chapter.
2. T1 R013 demo mode (cookie reissue patterns).
3. Chapter 10 (auth + middleware) for context.

## Scope

**A** — CSRF tokens on all state-changing routes. Hidden form field
+ server validation.

**B** — Session rotation: on role/permission change, force re-issue.

**C** — Login rate-limit per IP+email — 10 attempts / 5min lockout.

**D** — Session expiry sweep — background-style task that prunes
expired sessions on read (no real cron).

**E** — Smoke + chapter `04-session-security.md` + MASTER row.

## NOT in scope

- 2FA / MFA.
- WebAuthn / passkeys (R+1).

## When done
DONE referencing `021-session-security-hardening.md`.
