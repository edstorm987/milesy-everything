/loop

# T1 — Round 024: Founder password rotation (WS-A R024)

Removes the `"123"` hardcode from the founder seed. Critical ship-gate
item — see chapter #124 ship gate + chapter #122 + #123 gotchas.

Plan reference: chapter #124 `04-ship-plan-v1.md` WS-A.

## Mandatory pre-read

- Chapter #122 (founder seed introduced — `src/lib/server/founderSeed.ts`).
- Chapter #123 §"Gotchas to preserve" item 5 (founder seed bypasses
  `validatePassword`).
- `.env.example` shape if present.

## Scope

**A** — Move founder credentials to env:
- `FOUNDER_EMAIL` (default `edwardhallam07@gmail.com` for dev only)
- `FOUNDER_PASSWORD` (NO default — must be set or seed is skipped)
- `FOUNDER_AGENCY_NAME` (default `"Milesy Media"`)

**B** — Remove the `"123"` hardcode + the direct-mutate that bypasses
`validatePassword`. Use the same hashing path as `signup`. If
`FOUNDER_PASSWORD` is missing, log a warning + skip the seed (don't
create an unauthenticated founder).

**C** — Local dev path: `.env.local` carries `FOUNDER_PASSWORD=…`
(operator picks). Add to `.env.example` with documentation comment.

**D** — Production guard: in `NODE_ENV=production`, refuse to seed if
`FOUNDER_PASSWORD` is shorter than 12 chars OR `FOUNDER_EMAIL` is the
default dev value. Fail-closed startup error rather than silent insecure
seed.

**E** — Update deploy runbook (`runbooks/deploy.md`) §2a env table to
add the three FOUNDER_* vars; add a clear "rotate before public flip"
note. The runbook is currently flagged STALE — this round can include
a small targeted fix here even though the broader rewrite is later.

**F** — Smoke `§ Founder seed` (env present → seeds; env missing →
no seed + warning logged; weak password in production → throws;
hashed password validates via `verifyPassword`).

**G** — Chapter `04-founder-password-rotation.md` + MASTER row.

## NOT in scope

- Multi-founder support (R+1).
- Password reset UI for the founder (R+1).

## When done
DONE referencing `024-founder-password-rotation.md`. **Verify:** the
`"123"` literal no longer exists in the repo (`grep -r '"123"' src/`).
