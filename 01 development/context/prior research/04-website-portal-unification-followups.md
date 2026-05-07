# Chapter 123 — Website + portal unification: follow-up polish + multi-agency vision

T4 manual session, 2026-05-07. Eight follow-up commits after the
five staged unification commits in chapter #122. Where #122 was the
mechanical move (portal/ → milesymedia-website/ + marketing →
public/_marketing/ + auth seed), this chapter is the polish arc that
turned the resulting site into something that actually *feels*
unified — shared chrome, escape hatches, a unified search hub, and
the founder vision for a multi-agency master/satellite architecture.

## What landed (commits, in order)

### `ec0b514` — unify-fix: absolute asset paths in HC/BOS/Incubator

unify-2 moved the static apps into `public/` but their internal
`<link href="styles.css">` and `<script src="…">` references were
relative. With Next.js rewrites (`/health-check` → `/health-check/
index.html`) the browser URL stays at `/health-check`, so relative
paths resolved against `/` and 404'd. UI looked broken.

Sweep across HC + BOS + Incubator (32 files):
```
href="styles.css"           → /<app>/styles.css
src="hc-questions.js"       → /health-check/hc-questions.js
src="bos.js" / "lessons.js" → /business-os/<file>
src="incubator.js"          → /incubator/incubator.js
href="incubator.css"        → /incubator/incubator.css
../incubator/* etc          → absolute /incubator/* etc
```

**Lesson preserved**: any new asset reference inside
`public/<app>/*.html` must be absolute. Relative paths break the
moment Next.js rewrites are involved.

### `1ca40d0` — unify-fix-2: HC route wrapped in shared SiteShell

Introduces the **`<SiteShell>` component** — the durable contribution
of this round. Renders shared marketing chrome (sticky bar + nav +
footer) around any page. First customer: `/health-check` is now a
real Next.js route at `app/health-check/page.tsx` that renders an
iframe of the existing static quiz inside SiteShell.

Why iframe instead of `dangerouslySetInnerHTML`:
- The HC has ~600 lines of inline `<script>` driving the quiz.
- React strips inline scripts from injected HTML.
- iframe preserves every behaviour (sticky search embeds, branching
  skipIf, mental-note, lever-calc) without rewriting.
- Same-origin → no CSP / cookie friction.

Trade-off accepted: the dark HC theme stays inside the iframe; the
light marketing chrome wraps it. Future round: rebuild the quiz as
a real React component sharing brand-kit tokens directly.

`/health-check` rewrite removed from `next.config.ts` (Next route
owns it). Static `/health-check/index.html` still serves directly
(needed by the iframe `src`).

### `e1137d2` — unify-fix-3: auth surfaces in SiteShell + dev bypass + signup role selector

Three threads:

- **`/login` and `/signup/agency` wrapped in SiteShell** so they feel
  native to the site instead of looking like a separate Next.js
  scaffold. New `mm-auth-shell` + `mm-auth-card` styling.
- **Dev bypass** (`/dev/pov`): four persona cards (Founder Ed, demo
  agency-owner, demo client-owner Felicia, demo end-customer
  shopper). Click any, idempotent seed runs, real session cookie
  issued, redirected to that persona's portal home. Lets Ed spot UX
  gaps across audiences without typing creds. Linked from a small
  ⚡ pill on `/login`.
- **`/signup` role chooser**: replaces the old "create your agency"
  default. Four cards:
    - "I run an agency"        → /signup/agency
    - "I'm a business owner"   → /health-check
    - "My agency invited me"   → /login (invite-only)
    - "I'm a customer"         → /login (invite-only)
  Existing form moved to `/signup/agency`.

### `eaf47cf` — unify-perf: lazy-load + defer + code-split

Quick perf pass:
- `<script src="…">` → `<script defer src="…">` across 40 of 49
  static `.html` files. Browser downloads in parallel with HTML
  parse but executes after — first paint isn't script-blocked.
- `loading="lazy"` on the HC iframe so its body + scripts don't
  fetch until scrolled into view.
- `LoginForm` and `SignupForm` are `next/dynamic` — code-split out
  of the initial page bundle. Chrome paints first, form bundle
  hydrates after.

### `8101cf2` — unify-fix-4: `/demo` persona chooser

`/demo` was a route handler that auto-signed-in as the demo
agency-owner and redirected. Now it's a chooser page (matching the
`/signup` and `/dev/pov` pattern) where visitors pick which seat to
try. Three personas — agency / client / customer. Each card hits
`/demo/start?as=<persona>` (the renamed route handler) which
performs the seed + cookie issuance + redirect, preserving the
existing `?embed=1` iframe support.

Marketing nav + niche pages: existing "Try the demo" CTAs swept
from `/login` → `/demo` so the chooser is the canonical entry.

### `6c7d572` — unify-fix-5: HC chrome dedup + Resources mega-menu

Two threads:

- **HC chrome dedup**: `/health-check` was rendering the marketing
  nav + footer (from SiteShell) AND the HC's own nav + footer (from
  inside the iframe) — duplicate chrome. Stripped HC's own
  `<header class="nav">` and `<footer>` from
  `public/health-check/index.html`. Inside the iframe is just the
  quiz now.
- **Resources mega-menu** in SiteShell: 3-column dropdown with
  Audits & diagnostics / Operating tools / Reading & playbooks. New
  `/resources` hub page lists every tool with status badges.
  Generic catch-all at `/resources/[slug]` renders themed
  "coming soon" stubs (7 stubs wired today: seo-audit, site-speed,
  accessibility-audit, ux-orchestration, copy-clinic, playbooks,
  case-studies).

### `b4bbc22` — unify-fix-6: portal escape hatches + Incubator + BOS

Three threads:

- **Portal Topbar "← Back to website" pill** — the original
  Marketing ↗ link was visually demoted (`text-black/40`, easy to
  miss). Promoted to a real bordered pill matching the Sign out
  button. Affects every portal layout (agency / client / customer)
  via the shared Topbar.
- **`/incubator` SiteShell-wrapped** — same iframe pattern as HC.
  Stripped `.inc-toprail` (the duplicate top chrome) and added
  `app/incubator/page.tsx`. `/incubator` rewrite removed.
- **BOS gets a "← Back to website" link** in its sidebar (29 BOS
  pages). Per Ed's call, BOS keeps its own chrome — it's a separate
  app — and just gets an explicit escape, not a SiteShell wrap.
  New `.bos-back-to-site` CSS in BOS's own stylesheet.

### `61a1d80` — unify-fix-7: Resources mega-menu in marketing nav + Resource Finder

The static marketing index.html had its OWN nav (no Resources
dropdown). That's why `/`'s nav looked different from
SiteShell-wrapped routes. Injected the same Resources mega-menu
into the static nav so all pages share one nav structure. Mega-menu
now leads with a **"Quick access"** column (BOS / Incubator / HC)
per Ed's request for immediate access.

`/resources` is now a real **Resource Finder** — single search
input filtering across tools / blogs / videos / FAQs in real time:

- `src/lib/resources/catalog.ts` — unified `Resource[]` catalog,
  tagged by type (`tool` | `blog` | `video` | `faq`), `tags[]`,
  and `live` | `soon` status.
- `src/components/ResourceFinder.tsx` — client component, multi-
  token AND-match across title + excerpt + tags, type-chip filtering
  with counts, empty-state copy, grouped result rendering.
- `src/app/resources/page.tsx` — hero + finder.

Catalog ships with: 8 tools (3 live, 5 soon), 3 blog stubs, 2 video
stubs, 5 FAQs (live). Search is plain substring AND-match — fast
for hundreds of entries; revisit (Fuse / Lunr) when catalog passes
~300.

**Adding new content is one append** in
`src/lib/resources/catalog.ts`. Finder, hub, type counts, mega-menu
all pick it up automatically.

## Architecture established this round

1. **`<SiteShell>` is the canonical chrome.** Any new top-level
   route should render inside it unless explicitly designed to
   stand alone (BOS being the only exception today). Located at
   `src/components/SiteShell.tsx`.

2. **iframe-inside-SiteShell** is the pragmatic pattern for
   wrapping rich existing static apps. Used by `/health-check` and
   `/incubator`. Trade-off: dark theme stays inside the frame. Cure:
   future React rewrite per app.

3. **Resource catalog** at `src/lib/resources/catalog.ts` is the
   single source of truth for everything searchable. Designed for
   massive expansion — blogs, videos, FAQs, more tools all share
   the same shape, the same finder, the same SEO juice.

4. **Persona chooser pattern** unified across `/signup`, `/demo`,
   `/dev/pov`. Same "card grid, click → sign in / route" UX. Sets
   the visual + behavioural template for any future role-disambig
   surface.

5. **Founder seed pattern** at `src/lib/server/founderSeed.ts`. On
   first server boot, the founder user (`edwardhallam07@gmail.com`,
   password `123`, `agency-owner` of "Milesy Media") is provisioned
   idempotently. Bypasses `validatePassword` via direct mutate.
   **Change `FOUNDER_PASSWORD` before any public deploy.**

6. **Escape hatches everywhere.** Portal Topbar, BOS sidebar,
   marketing nav — every surface has a clear "back to website" path.
   Visitors never feel stuck.

## Multi-agency master/satellite vision (Ed's stated intent)

Captured here for chapter authority. **Not yet built.**

Milesy Media is the **master**. Niche-targeted agencies (e.g.
"AquaOasis-web" for therapists) are **tenants** of the same backend.
Each:

- Has its own marketing front (different domain, branding, copy).
- Has its own portal (same code, agency-branded via the existing
  brand kit).
- Has its own lead magnet pack (`public/agencies/<slug>/health-check/`
  vs. today's single `public/health-check/`).
- Selectively installs plugins (MM gets HR + finance; AquaOasis
  doesn't need HR — already supported by `pluginInstalls` per agency).
- Has its own employee pool, scoped to that agency at the session
  cookie layer.

**Ed-as-master** logs into MM, sees a switcher in the Topbar,
flips between any of his agencies. Employees only see the agency
they belong to.

### Architectural fit (what already supports it)

- **Agencies are first-class tenants.** Every user has `agencyId`,
  every plugin install is agency-scoped, every brand kit lives on
  the agency record. AquaOasis is just another row.
- **Plugins toggleable per agency** — already the model.
- **End-customer / client / staff scoping** is per-agency at the
  session-cookie layer.

### Gaps to close (in proposed order)

1. **Multi-agency users.** Today `ServerUser.agencyId` is one
   value. Need `agencyIds[]` (or a memberships join). ~1 round.
2. **Agency switcher in the Topbar.** Dropdown listing the user's
   agencies; click re-issues the session cookie scoped to chosen
   agency. Reuses the demo POV-toggle pattern. ~½ round.
3. **Per-agency marketing front.** Two paths:
   - *Lazy*: same Next host, host-header routing — `aquaoasis-web.com`
     → server reads agency by domain → renders the same `app/page.tsx`
     with that agency's brand kit + tagline + lead magnet.
   - *Eager*: separate Next deploys, shared portal API.
   Lazy path = ~1 round.
4. **Per-agency lead magnet folder.** `public/agencies/<slug>/
   health-check/` instead of one global. Existing
   `bos.hcQuestions` localStorage override pattern becomes
   "load questions from the agency's pack." ~½ round, depends on #3.
5. **Prompt-driven agency spawning.** A "generate me an aquaoasis-web
   brand pack" CLI / admin button that fills agency + brand kit +
   lead-magnet folder + starting copy. Pure scaffold. ~½ round.

### Suggested staging

- **Round 1 (multi-agency core)**: items #1 + #2. Ed-as-master can
  flip between MM and a seeded "AquaOasis demo" agency inside the
  portal. Proves the concept end-to-end.
- **Round 2 (domain-aware marketing)**: item #3. Visit
  `aquaoasis-web.local` → AquaOasis brand on the same code.
- **Round 3 (per-agency packs + spawner)**: items #4 + #5.

None of this requires undoing what landed in #122 + #123. SiteShell,
the resource finder, the dev/POV picker, the founder seed — all
stay as-is. Multi-agency just lights up parts of the existing
multi-tenant model that were dormant.

## Open follow-ups + known gaps (carry forward)

- **`app/page.tsx` orphaned** by the `/` rewrite to
  `/_marketing/index.html`. Decide its fate when marketing → JSX
  conversion happens. (The whole marketing static surface is a
  candidate for JSX rewrite, which would let SiteShell manage it
  natively instead of via injected HTML.)
- **For-* niche pages** (`/for-skincare`, `/for-coaching`,
  `/for-fitness`, `/for-agencies`) still use the OLD static nav
  (no Resources dropdown). Only `/_marketing/index.html` got the
  injection in `unify-fix-7`. Niche pages need the same patch — or
  better, a JSX rewrite via SiteShell.
- **Role-aware post-login redirect.** `/login` always lands on
  `/portal/agency` today. Wire role-based: client-owner →
  `/portal/clients/<slug>`, end-customer → `/portal/customer`,
  future `lead` role → `/business-os`.
- **`lead` role doesn't exist yet.** Needed for the lead → BOS
  funnel hinted at in chapter #121 (Unified vision).
- **Resource sub-pages (`/resources/seo-audit` etc.) are stubs.**
  Each one is a placeholder rendering the generic "coming soon"
  via `app/resources/[slug]/page.tsx`. Replace with real
  implementations as built.
- **HC + Incubator iframes.** Quick win pattern; replace with React
  rewrites that share brand-kit tokens directly when there's time.

## Gotchas to preserve (from 123 + 122)

1. **No spaces in project root.** Folder is `milesymedia-website`,
   not `milesymedia website`. Turbopack chokes on the latter when
   resolving relative imports.
2. **Turbopack root one level up.** `turbopack.root` and
   `outputFileTracingRoot` point at `04-the-final-portal/` so the
   sibling `plugins/` is in the traced workspace. Don't drop these.
3. **Asset paths in `public/<app>/*.html` must be absolute.**
   Rewrites mean the browser URL doesn't match the file path; any
   relative `href` / `src` will 404.
4. **HC has a schema-version migration.** `HC_SCHEMA_VERSION` in
   `lead magnet app` (now `public/health-check/`) — bump when
   default question shape gets new fields, so stale localStorage
   overrides get discarded. `?fresh=1` forces a clean slate.
5. **Founder seed bypasses `validatePassword`.** Documented dev
   login `edwardhallam07@gmail.com / 123` is intentional. Change
   `FOUNDER_PASSWORD` and re-introduce validation before any public
   deploy.
6. **Marketing static index has a Resources mega-menu inline.**
   Until JSX rewrite, edits to `SiteShell`'s mega-menu structure
   need to be mirrored in `public/_marketing/index.html` so
   `/` matches `/login`'s nav.
7. **Iframe-wrapped apps need their own internal nav stripped**
   (HC: lines 16-27 of `public/health-check/index.html`;
   Incubator: `.inc-toprail`). Without strip, duplicate chrome.
8. **`@plugins/*` TS path alias is unused.** Plugin imports stayed
   relative (`../../../../plugins/...`) because Turbopack rejected
   the alias when it resolved outside the project root. The alias
   declaration in `tsconfig.json` is harmless but dead.

## Files of interest (this round)

```
src/components/SiteShell.tsx                       NEW (#122)
src/components/ResourceFinder.tsx                  NEW (#123, fix-7)
src/components/chrome/Topbar.tsx                   modified (fix-6)

src/lib/resources/catalog.ts                       NEW (#123, fix-7)
src/lib/server/founderSeed.ts                      NEW (#122, unify-3)

src/app/health-check/page.tsx                      NEW (fix-2)
src/app/incubator/page.tsx                         NEW (fix-6)
src/app/resources/page.tsx                         NEW (fix-5, finder fix-7)
src/app/resources/[slug]/page.tsx                  NEW (fix-5)
src/app/dev/pov/page.tsx                           NEW (fix-3)

src/app/login/page.tsx                             SiteShell-wrapped (fix-3)
src/app/signup/page.tsx                            replaced with chooser (fix-3)
src/app/signup/agency/page.tsx                     moved + wrapped (fix-3)
src/app/demo/page.tsx                              NEW chooser (fix-4)
src/app/demo/start/route.ts                        moved from /demo + persona param (fix-4)

public/_marketing/styles.css                       major appends (fix-2,3,5,7)
public/_marketing/index.html                       Resources mega injected (fix-7)
public/health-check/                               chrome stripped (fix-5), assets absolute (fix)
public/business-os/                                back-link injected 29 pages (fix-6)
public/incubator/                                  toprail stripped (fix-6), assets absolute (fix)
next.config.ts                                     rewrites + dropped HC/Incubator (fix-2,6)
```
