# `04` milesymedia ↔ Aqua portal stitch (T1 — Round 8)

The architecture extension (chapter 19b) names milesymedia.com the
front door and the Aqua portal "the inside of the milesymedia
building." R8 makes that real — visiting the deployed site (or
`localhost:3030` in dev) shows the milesymedia marketing pages at the
root, and every Aqua portal handler keeps its native route. One
origin, one cookie, one set of links.

> Built by T1 on 2026-05-05, on top of T6 R1 Phase A's Vercel monorepo
> wiring (commit `359b476`) and chapter 19b's design.

## 1. The stitch — one origin, two folders

Files stay separate in the repo (Ed's "puzzle piece" requirement):

```
04 the final portal/
├── milesymedia website/        ← static front-door files
│   ├── index.html              edited as static HTML
│   ├── login.html
│   ├── admin.html
│   ├── styles.css
│   └── README.md
└── portal/                     ← Aqua portal Next.js app
    ├── src/...
    ├── public/_milesy/         ← *copy* of the static site,
    │                              materialised at build/dev time
    └── ...
```

The end-user sees one site. URL surface (architecture §11):

| URL                       | Served by               | Notes                                   |
|---------------------------|-------------------------|-----------------------------------------|
| `/`                       | static milesymedia      | rewritten to `/_milesy/index.html`      |
| `/index.html`             | static milesymedia      | same                                    |
| `/login.html`             | static milesymedia mock | same — design preview                   |
| `/admin.html`             | static milesymedia mock | same                                    |
| `/styles.css`             | static milesymedia      | resolves the static site's relative ref |
| `/login`                  | Next.js handler         | the real auth surface                   |
| `/embed/login`            | Next.js handler         | iframe-able login (R5)                  |
| `/demo`, `/demo/toggle`   | Next.js Route Handlers  | sandbox flow (R4 / R5)                  |
| `/portal/*`               | Next.js                 | the portal proper                       |
| `/api/*`                  | Next.js                 | API routes                              |
| `/_next/*`, `/_milesy/*`  | Next.js static          | bundle assets + the static-site copy    |

## 2. Local dev — `npm run dev`

Two pieces:

1. **`portal/scripts/prepare-milesy.mjs`** — copies `04 the final portal/
   milesymedia website/*` → `04 the final portal/portal/public/_milesy/*`.
   Idempotent (delete + re-copy). Wired as `predev` so every
   `npm run dev` runs it first; cheap enough not to slow the loop.
2. **`portal/next.config.ts.rewrites().beforeFiles`** — the same path
   table the production `vercel.json` declares, mirrored in dev so
   the surface is identical. `beforeFiles` (vs `afterFiles`) lets the
   marketing landing win even when an `app/page.tsx` exists.

```ts
// next.config.ts
async rewrites() {
  return {
    beforeFiles: [
      { source: "/",            destination: "/_milesy/index.html" },
      { source: "/index.html",  destination: "/_milesy/index.html" },
      { source: "/login.html",  destination: "/_milesy/login.html" },
      { source: "/admin.html",  destination: "/_milesy/admin.html" },
      { source: "/styles.css",  destination: "/_milesy/styles.css" },
    ],
    afterFiles: [],
    fallback: [],
  };
}
```

`npm run dev:all` is an alias for `npm run dev` — there's only one
server now (no concurrently / no dev-proxy). Q-ASSUMED: same-port
single-server stitch over the prompt's "two-server with
concurrently" pattern. Justification: Next.js's `predev` hook
+ `rewrites().beforeFiles` give the same surface with one process
to babysit, and Vercel's production stitch is identical so no
config drift.

## 3. Production — root `vercel.json`

T6 R1 Phase A (commit `359b476`) shipped the production wiring:

- `framework: "nextjs"`, `buildCommand: "node scripts/build-portal.mjs"`,
  `outputDirectory: "04 the final portal/portal/.next"`.
- `scripts/build-portal.mjs` runs the same `prepare-milesy` copy step
  (inline), then `npm install` + `next build` inside the portal
  folder.
- `rewrites` mirror dev:
  ```jsonc
  [
    { "source": "/",           "destination": "/_milesy/index.html" },
    { "source": "/index.html", "destination": "/_milesy/index.html" },
    { "source": "/login.html", "destination": "/_milesy/login.html" },
    { "source": "/admin.html", "destination": "/_milesy/admin.html" },
    { "source": "/styles.css", "destination": "/_milesy/styles.css" }
  ]
  ```
- `.vercelignore` excludes reference codebases + per-client portal
  folders (those deploy as separate Vercel projects per chapter 19b).

R8 doesn't touch root `vercel.json` — T6's wiring was already correct.

## 4. Same-origin cookie surface

The R4 demo cookie (`lk_session_v1`, `isDemo: true`) and R5 end-customer
cookie are both scoped to the portal's origin. Pre-R8 the portal lived
at `localhost:3030` and the static site at file:// or `localhost:3030/login.html`
which… happened to share an origin too, but only by accident of the
existing single-port dev. The R8 stitch makes that the canonical
shape:

| Surface                  | Origin (dev)        | Origin (prod)         |
|--------------------------|---------------------|------------------------|
| Marketing landing        | `localhost:3030`    | `milesymedia.com`     |
| Static login/admin mocks | `localhost:3030`    | `milesymedia.com`     |
| Aqua portal handlers     | `localhost:3030`    | `milesymedia.com`     |
| `/embed/login` iframe    | (loaded inside a client domain) — **cross-origin from the embedding site** |

So:
- Sign-in / Demo CTAs use **same-origin paths** by default
  (`data-portal-base=""` since R8). Visiting `localhost:3030/` and
  clicking Sign-in lands at `localhost:3030/login`; visiting
  `milesymedia.com/` and clicking Sign-in lands at
  `milesymedia.com/login`. No cookie-cross-origin gymnastics.
- The static site can still be previewed standalone (e.g. `python3 -m
  http.server` in `milesymedia website/`); pass `?portalBase=https://staging.milesymedia.com`
  to override the empty default. Documented in the static site's
  README.
- `/embed/login` remains cross-origin from the embedding client's
  website (luvandker.com etc.) — same as before. Cookies are still
  scoped to the portal origin, so `iframe → milesymedia.com/embed/login → set-cookie → milesymedia.com session`.
  The end-customer flow (R5) is unaffected.

## 5. Static site — `data-portal-base` default switched

Pre-R8 the static site shipped with `<meta name="aqua-portal-base"
content="http://localhost:3000">` (the dev portal's port). Post-R8:

```html
<meta name="aqua-portal-base" content="" />
```

Empty content = same-origin paths. The inline rewriter falls through
to `''` and produces `'/login'` / `'/demo?source=milesymedia'` (root-
relative). Override via:
- `?portalBase=https://example.com` query (added in R8 — useful for
  standalone-preview workflows)
- explicit non-empty meta value at deploy time

Same rewrite logic in all three pages (`index.html` / `login.html` /
`admin.html`).

## 6. Files-separate discipline (puzzle pieces)

Per Ed's directive: nothing about R8 changes the editing model.

- Static-site copy edits live in `04 the final portal/milesymedia website/*`.
- Portal code edits live in `04 the final portal/portal/src/*`.
- The `portal/public/_milesy/` directory is **a build artefact** —
  treat it like `.next/` or `node_modules/`. Do NOT edit in place; the
  next `npm run dev` will overwrite. (Add a `.gitignore` entry for
  `public/_milesy/` — done in this round.)
- `prepare-milesy.mjs` is the single canonical copy step, shared
  between `predev` (local) and `build-portal.mjs` (Vercel build).

## 7. Smoke (verified)

`npm run dev` against `localhost:3050`:

```
GET  /                  → 200  body: "Milesy Media — Marketing", "Try the live demo"  ✓
GET  /styles.css        → 200  content-type=text/css                                  ✓
GET  /login             → 200  Next.js login page ("Welcome back")                    ✓
GET  /login.html        → 200  static login mock ("Sign in · Milesy Media")           ✓
GET  /admin.html        → 200  static admin mock ("Admin · Milesy Media")             ✓
GET  /demo?source=…     → 307  → /portal/agency  +  Set-Cookie isDemo:true            ✓
```

`npx tsc --noEmit` clean. `next build` not re-run this round (the
rewrite addition doesn't change the build output shape).

## 8. R8 deviations + open follow-ups

| Topic                              | R8 ship                                      | Future round |
|------------------------------------|----------------------------------------------|--------------|
| Two-server `concurrently` pattern  | Replaced with `predev` copy + `next.config` rewrites — single port, single server | Could revisit if the static site grows non-trivial JS that benefits from a separate watcher |
| `vercel dev` smoke                 | Skipped — root `vercel.json` already validated by T6's R1; identical rewrites in dev (next.config) cover the surface | Run on first prod deploy |
| `data-portal-base="dev-fallback"`  | Dropped the `localhost:3000` default — empty + optional `?portalBase=` query | If a future prod deploy splits portal off-origin, set the meta explicitly per page or document an env-substitution |
| `public/_milesy/` in git           | Ignored (build artefact)                     | n/a |

## 9. Cross-team handoff notes

- **T6 R2** (deployment hardening) — your monorepo Vercel config is
  the foundation R8 builds on. Any Phase A changes to root
  `vercel.json` rewrites/build need to mirror in
  `portal/next.config.ts` `beforeFiles` so dev keeps parity.
  Recommend a single source-of-truth file (`scripts/stitch-rewrites.json`)
  that both consume — defer to R3.
- **T2** (export-to-repo) — per-client portals at `clients/<slug>/`
  are SEPARATE Vercel projects (`.vercelignore` excludes them). Each
  needs its own root-level rewrites if it bundles a static front-door,
  but most likely each client portal is portal-only (no static
  marketing surface — the milesymedia front door belongs to the
  agency, not the client).
- **T3** (editor) — when the editor saves to per-client repos
  (R6+), the save target is `clients/<slug>/`, not the shared
  portal. The R8 stitch concerns the SHARED portal's surface only.
- **Demo cron** (still pending from R4) — `?reset=1` continues to
  hit `/api/dev/seed-demo`. With same-origin in prod the URL becomes
  `https://milesymedia.com/api/dev/seed-demo?reset=1` — Vercel cron
  config gets that exact target.
