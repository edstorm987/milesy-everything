/loop

# T1 — Round 4: Milesy Media demo button + sign-in wiring

Your Round 3 wired all three plugins into the foundation (`29bd49a`). The
agency portal works end-to-end. The Milesy Media public marketing site at
`04 the final portal/milesymedia website/` is a static HTML site with a
`Sign in` button and a `Demo` flow that don't actually go anywhere yet.
Round 4: connect the public site to the live portal so visitors can either
sign in (real flow) or demo (sandboxed flow with POV toggle).

## Working environment

- **Repo**: https://github.com/edsworld27/ker-v3
- **Local**: `~/Desktop/ker-v3/`
- **Branch**: `main`. `git pull --rebase --autostash && git push` after each commit.
- Top-level folders contain spaces — quote them.

## Messaging

- **Outbox**: `01 development/messages/terminal-1/to-orchestrator.md`
- **Inbox**: `01 development/messages/terminal-1/from-orchestrator.md`
- Don't stop on questions; log `Q-ASSUMED`. Only stop on `Q-BLOCKED`.

## Mandatory pre-read

1. `01 development/CLAUDE.md` (Mode A — terminal mesh)
2. `01 development/context/prior research/04-architecture.md` — §8 (demo button) + §11 (URL surface)
3. `01 development/context/prior research/04-foundation.md`, `04-foundation-round2.md`, `04-foundation-round3.md` — your prior chapters
4. `01 development/eds requirments.md`
5. The static site: `04 the final portal/milesymedia website/{index,login,admin}.html` + `styles.css`
6. Vercel config: root `vercel.json` (deploys the static site only)

## Scope

### Goal A: Wire the static site's "Sign in" button to the live portal

Currently `index.html` and `login.html` have `Sign in` buttons that
href to local files (`login.html`, `admin.html`). Update them to point
at the live portal's `/login` route on the same deployed origin.

Decisions to make:
- The static site at `milesymedia website/` deploys to root via Vercel.
- The portal at `04 the final portal/portal/` is currently NOT deployed
  (Vercel pinned to milesymedia only).
- For Round 4, the simplest move is: keep portal as a local dev target,
  but make the static site's `Sign in` button hit the portal's `/login`
  on `localhost:3000` when running locally and a configurable production
  URL when deployed.

Implementation:
- Add `data-portal-base` meta attr in `<head>` of each HTML page so the
  base URL is overridable.
- Read it via JS, default to `http://localhost:3000`. Use a tiny inline
  script that rewrites `Sign in` and `Demo` button hrefs at load.
- Document the env var in the static site's README.

### Goal B: Demo flow — sandboxed agency + POV toggle

When a visitor clicks `Demo` on the static site:

1. Static site redirects to `<portal>/demo?source=milesymedia`.
2. Portal route `/portal/demo/page.tsx` (new — server component):
   - If no demo cookie present, POST `/api/dev/seed-demo` (already exists,
     thanks to your R2) to ensure demo agency + Felicia mirror exist.
   - Issue a session cookie for the seeded agency-owner of the demo
     agency. Mark it as a demo session (cookie payload includes
     `isDemo: true`).
   - Redirect to `/portal/agency` with a "demo banner" injected.
3. `/portal/demo/toggle` route — flips between agency-owner and
   client-owner POV in the same demo session. Re-issues cookie with
   updated `role` + `clientId` fields. Redirects to the appropriate
   surface (agency: `/portal/agency`; client: `/portal/clients/<felicia-id>`).
4. Demo banner component — a sticky top bar visible whenever
   `session.isDemo === true`. Shows current POV + a button to toggle.
   Renders inside `portal/layout.tsx` or `agency/layout.tsx` — wherever
   it makes sense.

### Goal C: Reset cadence

Demo data shouldn't accumulate forever. Add a simple reset:

- `/api/dev/seed-demo?reset=1` — wipes the demo agency + all its
  children (clients, plugin installs, activity, phases) and re-seeds.
- A nightly Vercel cron (or a callable endpoint) that resets at 04:00
  UTC. For now, just expose the manual reset endpoint; cron wiring can
  come later.

### Goal D: Update the static site footer

Add a small "Last deployed" timestamp under the footer (auto-stamped at
build time — the static-site build is just `cp` so embed
`{{BUILD_DATE}}` and replace via a tiny pre-deploy step OR just hard-code
the current date and bump on each deploy).

## NOT in scope

- Don't deploy the portal to Vercel yet (separate decision).
- Don't touch fulfillment / ecommerce / website-editor plugin source.
- Don't build a registration / signup flow — beyond v1.
- Don't add real cron infra — manual reset endpoint is fine.

## Loop discipline

Same. Pass `<<autonomous-loop-dynamic>>` to `ScheduleWakeup`.

## When done

1. Static site's `Sign in` and `Demo` buttons work locally (with portal
   running on `localhost:3000`).
2. Demo flow lands on `/portal/agency` with banner + POV toggle.
3. POV toggle works — flips between agency and client view in the same
   session.
4. `/api/dev/seed-demo?reset=1` wipes + re-seeds cleanly.
5. Smoke pass.
6. Chapter: `04-milesymedia-demo.md` covering the demo flow architecture,
   the cookie shape (`isDemo`, current POV), reset semantics, and the
   sign-in env-var pattern.
7. MASTER row + `tasks.md` row.
8. Final `DONE` + `COMMIT`.
