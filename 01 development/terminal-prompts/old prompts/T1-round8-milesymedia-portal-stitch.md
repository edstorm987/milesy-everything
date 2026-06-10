/loop

# T1 — Round 8: Stitch milesymedia.com + Aqua portal as one surface

Per the architecture extension chapter `04-architecture-extension-per-client-portals.md`,
milesymedia.com is **the front door** and the Aqua portal lives **inside
it** at `/portal`. Today they're separate folders in the repo and serve
on separate localhost origins (the static milesymedia + the Next.js
portal at port 3030). Round 8 stitches them so:

- **Local dev**: `localhost:3030/` serves the milesymedia static site;
  `/portal/*` + `/login` + `/demo` + `/embed/*` + `/api/*` keep the
  Next.js handlers; everything else falls back to the static site.
- **Vercel production**: a single project deploys both — same
  rewrites, same origin, same cookies.
- **Files stay separate** in the repo (`milesymedia website/` and
  `portal/`) so each can be edited on its own.

After R8, every entry point a visitor or operator hits ends up looking
like one site. The portal is the inside of the milesymedia building,
not a different building.

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
2. `01 development/context/prior research/04-architecture.md` — §11 (URL surface)
3. `01 development/context/prior research/04-architecture-extension-per-client-portals.md` — the new extension (read this carefully — it sets the long-term direction)
4. `01 development/context/prior research/04-milesymedia-demo.md` — your R4 chapter (data-portal-base meta + Sign-in/Demo wiring)
5. `01 development/context/prior research/04-end-customer-flow.md` — your R5 chapter
6. `04-the-final-portal/milesymedia website/index.html`, `login.html`, `admin.html`, `styles.css`, `README.md`
7. `04-the-final-portal/portal/next.config.ts` — current rewrites + transpilePackages
8. Repo root `vercel.json` — currently pinned to deploy ONLY the static site

## Scope — three goals

### Goal A: Local dev — Next.js rewrites serve milesymedia at root

Two-server local-dev pattern:
1. Run the milesymedia static site on a side port (e.g. `:3001`) via
   `npx serve -p 3001 "04-the-final-portal/milesymedia website"`.
2. Configure portal's `next.config.ts` `rewrites()` so any path NOT
   handled by Next.js falls through to the static server.
3. Add an npm script `dev:all` that boots both side-by-side
   (`concurrently` or a tiny shell wrapper). `npm run dev:all` brings
   up the stitched localhost.

Alternative cleaner path if Next.js rewrites don't compose well:
add a tiny dev-proxy script (`scripts/dev-proxy.mjs`) on port 3030
that reverse-proxies based on path: `/portal/*`, `/login`, `/demo`,
`/embed/*`, `/api/*` → Next.js (port 3031); everything else → static
server (port 3001). The Next.js dev server moves to 3031.
Q-ASSUMED whichever path you pick.

### Goal B: Production — single Vercel deployment, two folders

Update root `vercel.json` (currently deploys only milesymedia) to:
- Build the portal (`04-the-final-portal/portal/`) as the primary
  Next.js project.
- Add `rewrites` so static milesymedia files at `04-the-final-portal/milesymedia website/<file>`
  serve at root paths (`/`, `/admin.html`, `/login.html`, `/styles.css`, ...).
- Vercel automatic asset-prefixing keeps the static site's relative
  paths working.

Test config locally with `vercel dev` if the CLI is available; OK to
ship as a config-only commit and validate on next deploy.

The static site's existing `data-portal-base` meta (your R4) means
Sign-in / Demo links are still configurable, but in production they
should default to same-origin (no need for `localhost:3030` fallback).
Update the static site's meta to `data-portal-base="" /` (empty =
same origin) by default, with the `localhost:3030` fallback only
firing in dev.

### Goal C: Update R4 demo flow + R5 customer flow chapters with the new model

Lightweight chapter notes (don't rewrite the chapters — append a
"Round 8 update" section at the bottom of each):

- `04-milesymedia-demo.md` — note that the Demo button now hits
  same-origin `/demo` rather than a separate portal origin.
- `04-end-customer-flow.md` — note that `/embed/login` is also
  same-origin under the stitch; iframe embedding into client
  websites still works (still cross-origin from the client's domain).

## NOT in scope

- Don't generate per-client portals — that's T2 R11's job.
- Don't deploy to Vercel — config-only, Ed deploys when ready.
- Don't touch plugin source.
- Don't add new auth surfaces — the existing `/login` + `/embed/login`
  cover all three audiences.
- Don't restructure the milesymedia static site's content beyond
  updating the `data-portal-base` meta default.

## Loop discipline

Each cycle: pull → read inbox + outbox → progress → commit → push →
append `COMMIT` → `ScheduleWakeup` with `<<autonomous-loop-dynamic>>`.
Mid-task 600–900s, fully DONE 1500s, 3 empty wakes → omit ScheduleWakeup
to end. Goal A is the bulk; B + C lighter.

## When done

1. `npm run dev:all` (or your chosen pattern) brings up the stitched
   site at `localhost:3030`. Visiting `/` shows the milesymedia
   landing; clicking Sign-in lands at `/login` (Next.js); Demo lands
   at `/demo` then `/portal/agency` with the banner.
2. `next.config.ts` rewrites verified (or proxy script works).
3. Root `vercel.json` updated for production stitch.
4. `tsc --noEmit` clean.
5. Chapter `04-milesymedia-portal-stitch.md` documenting:
   - Local-dev approach (rewrites vs proxy script).
   - Production Vercel stitch.
   - Same-origin / cookie / auth implications.
   - Files-separate-but-stitched discipline (Ed's "puzzle piece"
     metaphor — keep the milesymedia and portal folders editable
     independently).
6. MASTER row.
7. `tasks.md` row done.
8. Final `DONE` + `COMMIT`.
