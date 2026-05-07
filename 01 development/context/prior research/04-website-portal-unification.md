# Chapter 122 — Website + portal unification

T4 manual round. Collapses the two-host setup (`:3030` Aqua portal +
`:3033` Python-served Milesy marketing) into a single Next.js host
rooted at `04-the-final-portal/milesymedia-website/`.

## Why

Pre-unification:

- `portal/` (Next.js, port 3030) — auth, agency / client / end-customer
  portals, plugin runtime, API routes.
- `milesymedia website/` (static HTML, served by ad-hoc `python -m
  http.server` on port 3033) — marketing front door, Health Check
  lead-magnet, Business OS, Incubator portal.
- `scripts/prepare-milesy.mjs` ran as `predev` / `prebuild` and copied
  selected static files from `milesymedia website/` into
  `portal/public/_milesy/` so Vercel could surface them at root paths
  via `next.config.ts` rewrites.

The split-origin model meant: two cookies, two CSPs, two dev servers,
no shared session, the marketing "Sign in" CTA pointing at a static
mock instead of real auth, the prepare-milesy stitch as a permanent
fragile workaround.

Ed's vision (chapter #76 unified-vision et al.): one origin
(`:3030`), one cookie domain. Marketing → /login → role-based portal
landing (lead → Business OS, client → client portal, employee →
agency surface). Health Check funnels into Business OS. Future
"Resources" nav for bespoke tools (rank-my-website etc.).

## Final shape

```
04-the-final-portal/
├── milesymedia-website/                    ← Next.js project root, :3030
│   ├── package.json, next.config.ts, tsconfig.json
│   ├── middleware.ts, .npmrc, .env.example
│   ├── src/
│   │   ├── app/                            (auth + portal + api)
│   │   │   ├── page.tsx                    (orphaned by / rewrite — see Step 5)
│   │   │   ├── login/, signup/
│   │   │   ├── portal/{agency,client,customer}
│   │   │   ├── embed/[clientSlug]/[variant]
│   │   │   ├── api/{auth,tenants,…}
│   │   │   └── healthz/
│   │   ├── components/, lib/, plugins/, server/
│   │   └── proxy.ts
│   ├── scripts/                            (smoke + migrate, no prepare-milesy)
│   └── public/
│       ├── _marketing/                     (legacy marketing HTML)
│       │   ├── index.html
│       │   ├── for-{skincare,coaching,fitness,agencies}.html
│       │   ├── styles.css
│       │   ├── login-legacy.html / admin-legacy.html (parked, unused)
│       │   └── health-check.html (now a redirect → /health-check)
│       ├── health-check/                   (was "lead magnet app/")
│       ├── business-os/                    (was "business-os app/")
│       ├── incubator/                      (was "incubator app/")
│       └── favicon-default*.{png,ico}
└── plugins/                                ← UNCHANGED — T2/T3 territory
```

`clients/` (T5) untouched.

## Migration steps (5 commits)

### Step 1 — `T4 unify-1`

`git mv portal/* milesymedia-website/`. Stale `predev` /
`prebuild` invocations of `prepare-milesy.mjs` removed from
`package.json`. `MILESYMEDIA_REWRITES` removed from `next.config.ts`.

**Folder rename** — `milesymedia website/` → `milesymedia-website/`
(no space). Turbopack / Next.js can't resolve relative imports
across spaces in the project root (`../plugins/...` errors with
"Module not found" even though the literal filesystem path is valid).
This was the blocker after the initial `git mv`; renaming was the
clean fix.

`turbopack.root` and `outputFileTracingRoot` set to
`new URL("..", import.meta.url).pathname` — anchors the workspace
one level up at `04-the-final-portal/` so the sibling `plugins/`
folder is reachable by Turbopack's filesystem resolver. Without this,
several existing relative imports (`from "../../../../plugins/..."`)
fail.

`@plugins/*` TS path alias added but currently unused — relative
paths are still the convention.

### Step 2 — `T4 unify-2`

Three static apps moved into `public/`:

```
lead magnet app/  → public/health-check/
business-os app/  → public/business-os/
incubator app/    → public/incubator/
```

Cross-app references (`../incubator app/lib/storage.js` etc.)
sed-replaced to new sibling names.

`next.config.ts` rewrites added so directory paths resolve to their
`index.html` (Next.js doesn't auto-resolve directory paths in
`public/`):

```
/health-check → /health-check/index.html
/business-os  → /business-os/index.html
/incubator    → /incubator/index.html
```

### Step 3 — `T4 unify-3`

`src/lib/server/founderSeed.ts`. On first server boot (when the
founder user doesn't exist), provisions `Milesy Media` agency +
`agency-owner` user keyed off Ed's address.

```
email     edwardhallam07@gmail.com
password  123
role      agency-owner
agency    Milesy Media (slug: milesymedia)
```

Idempotent (caches a module-level promise; subsequent calls noop).
Bypasses `validatePassword` (which rejects < 8 chars) via direct
`mutate()` so the doc'd `123` works without a longer dev ceremony.
Change `FOUNDER_PASSWORD` before any public deploy.

Wired into two warm paths so it fires regardless of first
interaction order:

- `GET /login` — server component awaits `seedFounder()` before
  render.
- `POST /api/auth/login` — handler awaits `seedFounder()` before
  rate-limit + `verifyPassword`.

### Step 4 — `T4 unify-4`

Marketing files move from project root into `public/_marketing/`.
`beforeFiles` rewrites in `next.config.ts` expose them at clean
routes:

```
/             → /_marketing/index.html
/for-skincare → /_marketing/for-skincare.html
/for-coaching → /_marketing/for-coaching.html
/for-fitness  → /_marketing/for-fitness.html
/for-agencies → /_marketing/for-agencies.html
```

`beforeFiles` placement is required so `/` wins over the legacy
`app/page.tsx` (Aqua landing — orphaned by this rewrite).

CTA sweep across marketing + HC + BOS + Incubator HTML:

- `href="login.html"` → `href="/login"`
- `href="admin.html"` → `href="/portal/agency"`
- `href="signup.html"` → `href="/signup"`
- `href="for-X.html"` → `href="/for-X"`
- inter-page `index.html` refs → `href="/"`
- `styles.css` (relative) → `/_marketing/styles.css` (absolute, so
  rewrites don't break asset paths)

`login.html` and `admin.html` parked at `public/_marketing/*-legacy.html`.
Neither is reachable now; Next.js owns those routes.

### Step 5 — `T4 unify-5`

Cleanup:

- `public/_milesy/` deleted (obsolete static-stitch copies populated
  by `prepare-milesy.mjs`; everything has a canonical home elsewhere).
- `public/aqua-incubator/` deleted (single stub README leftover from
  an earlier round).
- `scripts/prepare-milesy.mjs` deleted (the stitch script; package.json
  invocations were removed in Step 1).

This chapter authored. MASTER row added.

`app/page.tsx` (Aqua portal landing) deliberately kept — orphaned by
the `/` rewrite but harmless, and useful as a non-marketing fallback
if someone unwinds the rewrite later.

## Hard constraints honoured

- `plugins/` source untouched. Imports stayed relative; only the
  workspace root anchored upward to make them resolvable.
- `clients/` untouched.
- Honesty contract still applies to HC content.
- Brand-kit CSS-vars only.

## Live smoke after Step 5 (all 200)

```
GET /                 → marketing index (rewritten from /_marketing/index.html)
GET /for-{skincare,coaching,fitness,agencies}
GET /health-check     → public/health-check/index.html (rewritten)
GET /business-os      → public/business-os/index.html (rewritten)
GET /incubator        → public/incubator/index.html (rewritten)
GET /_marketing/styles.css
GET /login            → Next.js auth surface (server component)
GET /signup
GET /portal/agency    (compiles cleanly; auth-gated)
GET /healthz

POST /api/auth/login  edwardhallam07@gmail.com / 123
                      → 200 { user: { role:"agency-owner", agencyId:"milesymedia" } }
```

## Gotchas for future commander / future-me

1. **No spaces in the project root.** Folder is `milesymedia-website`,
   not `milesymedia website`. Turbopack chokes on the latter.
2. **Turbopack root is one level up.** `turbopack.root` and
   `outputFileTracingRoot` point at `04-the-final-portal/` so the
   sibling `plugins/` folder is in the traced workspace. Don't drop
   these.
3. **Marketing pages are static HTML in `public/_marketing/`** — they
   are not Next.js routes. Edit the `.html` directly. CTAs use
   absolute paths (`/login`, `/health-check`) so the `beforeFiles`
   rewrites don't break them.
4. **`app/page.tsx` is orphaned.** Reachable only if you remove the
   `/` rewrite. Decide its fate when conversion of marketing →
   Next.js components happens (future round).
5. **Founder seed bypasses `validatePassword`.** The dev login
   `edwardhallam07@gmail.com / 123` is documented and intentional.
   Replace with a longer password before any public deploy and
   re-introduce validation.
6. **Asset paths in static apps are sandbox-fragile.** When adding
   new marketing rewrites, audit asset references — anything
   relative needs absolute-izing or a matching rewrite for the
   asset dir.
