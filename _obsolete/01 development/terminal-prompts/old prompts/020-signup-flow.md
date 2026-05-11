/loop

# T1 — Round 020: Real signup flow

`/login` exists; `/signup` is missing. Per requirements §3 the marketing
site Demo button drops visitors into a sandbox + offers signup. Wire
real signup → new agency creation + Founder-role bootstrap.

## Mandatory pre-read

1. T1 R009 OAuth + magic-link chapter.
2. T1 R013 demo mode (`Sign up →` placeholder CTA).
3. Foundation `createAgency`/`createUser` server fns.

## Scope

**A** — `/signup` page: company name + email + password (or Continue
with Google). On submit creates agency + Founder user + first-run
seed (kanban + sops + agency-hr defaults).

**B** — Auto-login after signup → redirects to `/portal/agency`.

**C** — Email verification flow (token-based, dev-mode logs token).

**D** — Smoke + chapter `04-signup-flow.md` + MASTER row.

## NOT in scope

- Real email send (T6).
- Multi-step onboarding wizard.

## When done
DONE referencing `020-signup-flow.md`.
