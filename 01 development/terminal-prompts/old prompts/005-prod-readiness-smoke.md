/loop

# T6 — Round 005: Production-readiness smoke (deploy preview)

End-to-end smoke against a real Vercel preview deploy. Confirms every
ship-gate item in chapter #124 actually works under prod conditions
(real Postgres, real env, real headers, real cookies). Last T6 round
before Ed flips DNS.

## Pre-read

- Chapter #124 ship gate (the checklist).
- T6 R001 deploy runbook §5 (smoke routes list).

## Scope

**A** — `scripts/post-deploy-smoke.mjs` — takes a base URL arg
(preview deploy or staging). Hits each ship-gate route:
- `GET /` → 200 (marketing home).
- `GET /for-{skincare,coaching,fitness,agencies}` → 200 each.
- `GET /health-check`, `/business-os`, `/incubator` → 200.
- `GET /login`, `/signup`, `/demo`, `/dev/pov` → 200.
- `GET /portal/agency` → 302 to `/login` when unauthed.
- `POST /api/auth/login` with founder creds → 200 + sets
  `lk_session_v1` cookie.
- `GET /portal/agency` with cookie → 200.
- `GET /api/auth/me` with cookie → 200 (founder details).
- `GET /healthz` → 200 with `db: "connected"`.
- `GET /healthz/full` → 200 with full diagnostics.
- HC completion flow: POST hc-complete → 200 + lead session cookie
  + redirect-target `/business-os`.
- `GET /business-os` with lead cookie → 200.
- `GET /business-os` without cookie → 302 to `/login?from=bos`.

Each check logs PASS/FAIL with HTTP status + reason. Exit 0 only when
all pass. Exit 1 on any fail.

**B** — Founder-password sanity check: smoke reads `FOUNDER_PASSWORD`
from process.env (not hardcoded), uses it to authenticate. Refuses
to run when `FOUNDER_PASSWORD === "123"` (the literal we removed in
R024 — defensive belt+braces).

**C** — Operator dry-run guide in chapter: walks Ed through the
manual ship-gate checklist (sign in, create client, install plugin,
phase advance, end-customer login). Each step has a copy-paste
command + expected output.

**D** — Chapter `04-prod-readiness-smoke.md` + MASTER row.

## NOT in scope

- Load testing (post-ship).
- Real-user-monitoring sweep (post-ship).
- Synthetic monitoring on schedule (T6 R+1 once basic smoke green).

## When done
DONE referencing `005-prod-readiness-smoke.md`. **This closes the T6
queue** — Ed's next action is the real DNS flip.
