# Deploy runbook rewritten — T6 R001 (post-unification)

`01 development/runbooks/deploy.md` was flagged STALE since the
chapter #122 unification removed `04-the-final-portal/portal/` and
collapsed everything into `04-the-final-portal/milesymedia-website/`.
T6 R001 ships the full rewrite. STALE banner is dropped — the file
is genuinely current.

## Before / after delta

| | Before | After |
|---|---|---|
| Project shape | "Shared portal at `portal/` + per-client at `clients/<slug>/`" | One Next.js host at `milesymedia-website/`. Per-client deferred until T5 ships. |
| Build wrapper | `node scripts/build-portal.mjs` copying milesymedia static into `portal/public/_milesy/` | None. Vercel runs `next build` directly from `milesymedia-website/`. |
| Deploy command | `node scripts/deploy-vercel.mjs --target=portal --prod` | `vercel deploy --prod` from the website folder. |
| Pre-deploy `cd` target | `04-the-final-portal/portal` | `04-the-final-portal/milesymedia-website` |
| Edge rewrites table | `/`, `/index.html`, `/login.html`, `/admin.html`, `/styles.css` → `/_milesy/<file>` | Removed — marketing is real Next.js routes + `public/_marketing/` static, no rewrites needed. |
| Env table required count | 5 required (`PORTAL_SESSION_SECRET`, `DATABASE_URL`, `NEXT_PUBLIC_PORTAL_BASE_URL`, `NEXT_PUBLIC_PORTAL_SECURITY`, FOUNDER_*) | 6 required (added explicit `PORTAL_BACKEND` doc + tightened FOUNDER_* notes citing chapter #129). |
| Env table optional count | 9 optional rows (mixed observability + Vercel + GOOGLE_OAUTH_*) | 11 optional rows organised into observability / OAuth / domains buckets + dev-only `NEXT_PUBLIC_DEV_BYPASS` row split out. |
| Smoke route list | 7 entries (mostly `.html` static + `/login`, `/demo`, `/portal/agency`, `/api/auth/me`) | 25 entries per chapter #124 ship-gate item #9 — covers `/for-*` niches, `/health-check`, `/business-os` + `/incubator` redirect, `/login/forgot` + `/login/reset` (chapter #160), `/portal/agency/pipelines/<slug>` (chapter #156), `/portal/account/{preferences,permissions}` (chapter #155), `/healthz/full` (chapter #144 R030). |
| Glossary | "Shared portal" / "Per-client portal" / "Milesymedia front door" with build-time copy-into-public mention | Single Next.js host glossary. Dead "Milesymedia front door" entry removed; "Per-client portal" reframed under §4 deferred. |
| Troubleshooting | Included `Shared portal returns 500 on /` (cause: `_milesy/` copy missed) and "Per-client portal API 502" | Dropped both obsolete entries. NEW: prerender errors on `/login` when `FOUNDER_PASSWORD` missing in prod (chapter #129); CSR-bailout on `/login/reset` (chapter #160 — fix `dynamic = "force-dynamic"`). Kept: workspace plugin not found, missing `pg`, custom-domain-attach without `VERCEL_TOKEN`. |
| Crons | Same 3 (demo reset, healthcheck, postgres backup) commented-out in vercel.json | Preserved verbatim; flagged as T6 R003's flip. |
| Custom-domain runbook (§6) | Vercel REST + manual-DNS path | Preserved; flagged that `@aqua/plugin-domains` activation is T6 R004's territory. |
| Rollback (§7) | Vercel UI + git revert + Postgres PITR + domain detach | Preserved; PITR section explicitly cites chapter #134 + provider windows. |
| STALE banner | Yes, top-of-file 13 lines | Dropped. |

## Cross-links — chapters that informed env-var rows

- **#129** founder password rotation — `FOUNDER_EMAIL` /
  `FOUNDER_PASSWORD` / `FOUNDER_AGENCY_NAME` notes; new troubleshooting
  entry for `/login` prerender on missing prod password.
- **#134** Postgres backend — `DATABASE_URL` + `?sslmode=require` +
  `PORTAL_BACKEND` auto-derive; rollback §7c PITR section.
- **#138** durable nonces — explains why `PORTAL_SESSION_SECRET` is
  load-bearing for password-reset / magic-link / email-verify HMAC.
- **#142** env-secrets policy — env-allowlist + typed accessors
  contract referenced in §2a footer.
- **#144** SMTP outbound + observability — `SENTRY_*` env vars,
  `/healthz/full` route in smoke list.
- **#149** GA4 — referenced under §2b per-install plugin config (GA4
  measurement IDs are per-tenant, not env).
- **#150** Google OAuth — `GOOGLE_OAUTH_CLIENT_ID/SECRET/REDIRECT_URI`
  trio, redirect-URI defaulting rule.
- **#160** forgotten-password flow — `/login/forgot` + `/login/reset`
  in smoke list; CSR-bailout troubleshooting entry.
- **#162** email-sender registration — backs the `/login/forgot` real
  send path mentioned in §5 troubleshooting.
- **#122 / #123 / #124** unification + follow-ups + ship plan — drives
  the one-project-one-Vercel-deploy shape.

## Verification

`grep -n "portal/" runbooks/deploy.md` returns only:

- `milesymedia-website/` paths (29 hits across §1–§9).
- `clients/<slug>/` reference under §4 / §6d / §6 (T5 / T6 R004
  forward-references).
- One single mention of the deleted `04-the-final-portal/portal/`
  folder in the intro paragraph, explicitly framed as "the old
  folder is gone" — load-bearing context for migrators.
- `/portal/*` route paths in §5 smoke list and route-auth note.

No live `portal/` build paths remain.

## Q-ASSUMED

- Chapter #144 R030 ships `/healthz/full`; included in smoke list as
  current. If R030 hasn't landed yet, smoke step degrades gracefully
  (404 vs 200) — no rewrite needed once it lands.
- `PORTAL_BACKEND` documented as "auto-derived from DATABASE_URL but
  explicit override available" — matches `.env.example` line 49 +
  chapter #134 behaviour.
- `NEXT_PUBLIC_DEV_BYPASS` split into a dev-only sub-table rather
  than a new "dev-only" column — keeps the required/optional table
  clean.
- Per-client portal section (§4) marked deferred rather than removed —
  T5 reactivation will fill it in at T6 R005.
- Cron block kept commented-out per existing operator instructions
  (each firing counts toward Vercel quota); T6 R003 flips it.

## NOT in scope (R+1)

- Vercel project creation (operator action).
- Production secret generation (operator action).
- Cron flip — T6 R003.
- `@aqua/plugin-domains` activation — T6 R004.
- CI workflow (`.github/workflows/`) — T6 R002.
- Per-client portal section fill-in — T6 R005, post-T5-ship.
