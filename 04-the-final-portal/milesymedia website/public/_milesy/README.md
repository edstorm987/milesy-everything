# The Final Portal — Milesy Media (public site)

A standalone, no-build agency marketing site for **Milesy Media**. Three
pages + one CSS file, no dependencies, no install step. The Sign-in and
Demo CTAs hand the visitor off to the live Aqua portal (running on a
separate origin during dev — see "Portal base" below).

## Pages

| File         | Purpose                                                     |
|--------------|-------------------------------------------------------------|
| `index.html` | Marketing landing page — hero, services, stats, testimonials, CTA. Sign in + Demo buttons. |
| `login.html` | Branded login surface. Submit hands off to the live portal at `${portalBase}/login`. |
| `admin.html` | Placeholder admin dashboard — sidebar, KPI strip, activity feed. |
| `styles.css` | Shared design tokens + component CSS                         |

## Portal base — `<meta name="aqua-portal-base">`

The static site is decoupled from the portal at deploy time. Each HTML
file declares the portal's origin in `<head>`:

```html
<meta name="aqua-portal-base" content="http://localhost:3000" />
```

A small inline script at the bottom of each page reads that value and
rewrites every `[data-aqua-action]` element's `href`:

| `data-aqua-action` | Rewrites to                              |
|--------------------|-------------------------------------------|
| `sign-in`          | `${base}/login`                           |
| `demo`             | `${base}/demo?source=milesymedia`         |

To point the live site at a deployed portal:

1. Update `<meta name="aqua-portal-base" content="…">` in each HTML page.
2. Bump the footer's "Last deployed YYYY-MM-DD" string at the same time
   so the marketing page advertises the freshness.
3. Re-deploy. (Vercel ships the static folder unchanged.)

The portal currently runs on `http://localhost:3000` during development
(`cd ../portal && npm run dev`). It is **not** yet deployed via this
Vercel project — `vercel.json` at the repo root pins this folder as the
sole static output. The portal will move to its own deploy in a later
round.

## How to view

Just open `index.html` in a browser:

```bash
open "the final portal/index.html"
```

Or serve it on a local port (handy if you want clean URLs):

```bash
cd "the final portal"
python3 -m http.server 4321
# → http://localhost:4321
```

## Flow

```
index.html  ──▶ Sign in  ──▶  ${portalBase}/login         (real auth)
            ──▶ Demo     ──▶  ${portalBase}/demo          (sandboxed agency)
```

`login.html` is still served (deep links + design preview), but the
form's submit handler now redirects to `${portalBase}/login` — the
static page no longer fakes its own auth.

## Why this folder exists

It's the public marketing surface for Milesy Media. The Sign-in and Demo
CTAs are the only entry points into the live Aqua portal — that's how
visitors actually see the product. Treat the design as production
(brand-correct typography, colour, copy) and treat the portal hand-off
as the real thing.
