# T4 — manual mode: portal+website unification

Ed pastes this ONCE in a fresh terminal at `~/Desktop/ker-v3/`. This is a
**manual pair-programming session** — Ed drives, T4 implements, no /loop,
no ScheduleWakeup. T1 has been paused for the duration so T4 owns
`portal/` and `milesymedia website/` exclusively. T2 + T3 keep shipping
in `plugins/` (untouched here).

## You are
Terminal 4 in **unification mode**. Goal: collapse the two-host setup
(:3030 portal + :3033 milesy) into a **single Next.js host** rooted at
`04-the-final-portal/milesymedia website/`. Everything lives inside the
website folder: marketing pages, Health Check funnel, Business OS,
Incubator portal, AND the Aqua agency portal (login/signup/portal/api).

## Target shape (end-state Ed asked for)

```
04-the-final-portal/
├── milesymedia website/              ← Next.js project root, :3030 only
│   ├── package.json, next.config.js, tsconfig.json   (moved from portal/)
│   ├── src/                          (moved from portal/src/ — auth + agency + customer + api)
│   │   └── app/
│   │       ├── page.tsx              ← marketing home (Next.js)
│   │       ├── (marketing)/...       ← additional marketing routes if/when converted
│   │       ├── login/, signup/       (already built — T1 R020)
│   │       ├── portal/               (already built — agency-shell + customer surface)
│   │       └── api/                  (auth, tenant, plugin-bridge endpoints)
│   └── public/
│       ├── health-check/             (current HC static drop)
│       ├── business-os/              (BOS static drop)
│       ├── incubator/                (Incubator static drop)
│       ├── images/, css/, js/        (marketing assets)
└── plugins/                          ← UNCHANGED location; portal imports update
```

Single :3030. Single cookie domain. Marketing "Sign in" → real `/login`.
HC/BOS/Incubator keep working as `/health-check/…` etc.

## First things to do, in order

1. `cd ~/Desktop/ker-v3 && git pull --rebase --autostash`.
2. Read `01 development/CLAUDE.md` (Mode A — terminal).
3. Read `01 development/messages/terminal-4/from-orchestrator.md` for any
   pending commander note.
4. Read these for grounding:
   - `01 development/context/prior research/04-architecture.md`
   - `01 development/context/prior research/04-aqua-internals-reference.md` (chapter 14 sections)
   - The current `04-the-final-portal/portal/package.json` + `next.config.js` + `tsconfig.json`
   - The current `04-the-final-portal/milesymedia website/` top-level structure (`ls` it)
5. Confirm to Ed in 3-4 lines:
   - "T4 unification mode ready."
   - Current portal Next.js version + key dependencies you spotted.
   - Top-level files/folders inside `milesymedia website/` you'd be merging with.
   - "Ready for Step 1?"

## Execution plan — staged checkpoints

Each step ends with a working `:3030` (after Step 1 onwards) and a
commit. Stop at each checkpoint, show Ed the diff/summary, wait for nod
before continuing.

### Step 0 — Pre-flight

- Stop any running dev servers on :3030 / :3033 (ask Ed first; he may
  already have one open).
- `git status` — should be clean before we start. If it isn't, fix or
  stash first.
- Snapshot a list of files under `portal/` (top-level) and `milesymedia
  website/` (top-level) so we have a "before" record. Save to scratch.

### Step 1 — Move Next.js project into milesymedia website/

The cleanest path is `git mv` everything from `portal/` up into
`milesymedia website/`, then resolve any name collisions.

- `git mv` `portal/package.json`, `package-lock.json`, `next.config.js`,
  `tsconfig.json`, `next-env.d.ts`, any other root config → into
  `milesymedia website/`.
- `git mv portal/src` → `milesymedia website/src`.
- `git mv portal/public/*` (if portal had a public/) merging into
  `milesymedia website/public/` — flag any name collisions to Ed before
  overwriting.
- Existing `milesymedia website/` static HTML (`index.html`, etc.):
  decide WITH ED whether each file:
  - (a) stays at the top-level (Next.js will let some static files
    coexist, but `index.html` collides with `app/page.tsx` — discuss
    before keeping),
  - (b) moves into `public/marketing-legacy/` for now,
  - (c) gets converted to `app/page.tsx` / `app/(marketing)/...`.
  Default recommendation: move legacy `index.html` to `public/legacy-home.html`
  and create a Next.js `app/page.tsx` that renders the marketing home
  (can be a thin static-content port for v1 — pixel-perfect refactor
  is a later round).
- `tsconfig.json` — update `baseUrl` / `paths` so plugin imports still
  resolve. Plugins live at `04-the-final-portal/plugins/...`; from the
  new project root that's `../plugins/...`. Add path alias if existing
  imports use `@aqua/...` style.
- `next.config.js` — verify `outputFileTracingRoot` / any path-sensitive
  config; update if needed.
- `package.json` scripts — verify `dev` / `build` / `start` still point
  at the right place; smoke scripts may have hardcoded paths to update.
- Run `npm install` from the new root if package-lock got moved (it
  should re-resolve cleanly).
- `npm run dev` → `:3030` should boot. Hit `/login`, `/signup`,
  `/portal/agency` — confirm they render.
- Commit: `T4 unify-1: move portal Next.js into milesymedia website/`.

### Step 2 — Drop HC / BOS / Incubator into public/

- `git mv` HC files into `milesymedia website/public/health-check/`.
- `git mv` BOS files into `milesymedia website/public/business-os/`.
- `git mv` Incubator files into `milesymedia website/public/incubator/`.
- Update internal `<link>` / `<a>` URLs inside those static apps that
  used to assume same-origin :3033 — they should now be relative
  (`/health-check/...`) or already are.
- Verify each app loads: `:3030/health-check/index.html`,
  `:3030/business-os/...`, `:3030/incubator/...`.
- Commit: `T4 unify-2: HC + BOS + Incubator into public/`.

### Step 3 — Seed the `ed` user

- Add a one-time seed in `src/lib/server/users.ts` (or a new
  `src/lib/server/seed.ts` invoked from the auth-handler bootstrap path)
  that, **only when the users store is empty**, creates:
  - email: `ed@milesymedia.com` (CONFIRM with Ed before writing — he
    may want a different address)
  - password: `123` (hashed via the same helper signup uses)
  - role: `agency-owner`
  - `emailVerifiedAt: Date.now()` (skip the verify dance for this
    seed)
  - bootstrap a default agency named "Milesy Media" via `bootstrapAgency`
    so the founder lands on a real /portal/agency.
- Idempotent: never overwrite an existing user.
- Smoke: a 3-line test that imports the seed, runs it against a
  freshly-cleared store, asserts the user exists and password validates.
- Commit: `T4 unify-3: seed default ed founder user`.

### Step 4 — Wire marketing "Sign in" buttons

- Walk every marketing page (the converted `app/page.tsx`, any
  `(marketing)` routes, AND the static HC/BOS/Incubator headers in
  `public/`) and point "Sign in" / "Login" CTAs at `/login`. Point
  "Get started" / "Create agency" at `/signup`.
- For the static HC/BOS/Incubator pages, this is just an `<a href>`
  swap — they live on the same origin now, no CORS, no iframe.
- Commit: `T4 unify-4: marketing Sign-in CTAs → real auth`.

### Step 5 — Cleanup + chapter

- Delete the old `04-the-final-portal/portal/` directory once Step 1's
  move is fully verified (should be empty after `git mv` if we caught
  every file). If anything's left, decide WITH ED.
- Kill anything that still references `:3033` in scripts/docs (search
  for `3033` repo-wide; update or delete). Note: orchestrator's
  `01 development/messages/README.md` may reference :3033 — update if
  needed.
- Add a chapter `04-website-portal-unification.md` capturing the new
  tree, the migration steps, and any gotchas for future commander.
- MASTER row.
- Commit: `T4 unify-5: cleanup + chapter`.

## Mesh discipline

- Append a `[ISO] NOTE: unify-step-N <summary>` line per step to your
  outbox `01 development/messages/terminal-4/to-orchestrator.md` so
  commander tracks progress.
- Commit messages all start with `T4 unify-N:` for clean attribution.
- After every commit: `git pull --rebase --autostash && git push`.

## Hard constraints

- **Don't touch `04-the-final-portal/plugins/`** — that's T2/T3, they're
  still shipping. Plugin imports update via tsconfig paths only, NOT by
  moving the plugins folder.
- **Don't touch `04-the-final-portal/clients/`** — T5 territory.
- Don't introduce a build system inside `public/` static apps; they
  stay vanilla HTML/JS.
- Brand-kit CSS-vars only — no hardcoded brand colours.
- Honesty contract chapter #68 still applies.

## Authority

You CAN, in this round only:
- Move files between `portal/` and `milesymedia website/`.
- Edit anything inside `milesymedia website/` (including formerly-T1
  Next.js source after the move).
- Update tsconfig / next.config / package.json at the new root.
- Append to your outbox + add a chapter.

You must NOT:
- Edit `plugins/` source.
- Edit `clients/`.
- Write to `commander.md` or `from-orchestrator.md`.
- Commit straight to a non-main branch.

## When this session ends

- Final `git push`.
- One-line NOTE: `unify session ended — final state: <X>`.
- Ed will paste `T4-router.md` again when he wants T4 back on
  autonomous queue mode, or `T4-manual.md` for general manual website
  work.

Begin now: do Steps 1-5 of "First things to do" above (read + confirm
state), then wait for Ed to greenlight Step 1.
