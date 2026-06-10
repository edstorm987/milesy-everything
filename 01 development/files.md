# files.md — repo reorg plan

> Status: **shipped** (2026-05-14).
> Direction picked: **Option 1** — one Next.js app, route groups. Archives stay as cold archive.
> Goal: organise `ker-v3/` so the four surfaces (website, health-check, demo, portal) live in clearly named folders, with `milesymedia` as the first portal plugin tenant.

---

## A · Current state (today)

```
ker-v3/
├── 01 development/            ← docs, prompts, runbooks (this file lives here)
├── _obsolete/                 ← 02 + 03 archived monorepos
├── memory/                    ← session summaries
├── scripts/                   ← Vercel build + deploy
├── 04-milesymedia-portal/
│   ├── milesymedia-website/   ← single Next.js app (THE codebase)
│   │   ├── src/app/           ← all routes (/, /portal, /demo, /health-check, /api, …)
│   │   ├── src/components/    ← chrome/, ui/, SiteShell, ResourceFinder
│   │   ├── src/server/        ← tenants, users, storage, phases, eventBus, …
│   │   ├── src/lib/           ← server/, chrome/, healthCheck/, resources/, a11y/
│   │   ├── src/plugins/       ← 42 plugin folders + _registry/_types/_runtime
│   │   └── public/            ← _marketing/, business-os/, health-check/
│   ├── clients/               ← reference snapshots (felicias perfect portal/)
│   ├── demo portals/          ← demo sandbox folders
│   └── plugins/               ← duplicate plugin registry copies (legacy?)
├── CLAUDE.md
├── README.md
├── package.json               ← root manifest, Vercel build shim
└── vercel.json
```

**Reality:** there is **ONE Next.js app** (`milesymedia-website`). Everything else inside `04-milesymedia-portal/` is supporting / legacy material.

---

## B · Target state (where we're going)

Ed's stated layout for `04-milesymedia-portal/`:

```
04-milesymedia-portal/
├── website/                   ← public marketing site (milesy media)
├── health-check/              ← Health Check app
├── demo/                      ← demo portal sandboxes
└── portal/                    ← the portal (agency + clients + customers)
    └── plugins/
        └── milesymedia/       ← Milesy Media's plugin pack
```

Two ways to interpret this — we need to pick one before moving anything:

### Option 1 · **Logical reorg inside one Next.js app** (recommended)

Keep `milesymedia-website/` as the single Next.js app (Vercel deploys cleanly, no monorepo plumbing). Mirror Ed's structure with route groups + plugin folders.

```
04-milesymedia-portal/milesymedia-website/
├── src/app/
│   ├── (website)/             ← /, /for-skincare, /for-coaching, /projects, /resources, /signup, /login
│   ├── (health-check)/        ← /health-check/**
│   ├── (demo)/                ← /demo/**, /dev/pov
│   └── portal/                ← /portal/agency/**, /portal/clients/**, /portal/customer/**, /portal/account/**
├── src/plugins/
│   ├── _registry.ts, _types.ts, …
│   └── milesymedia/           ← the agency's plugin pack — Aqua HQ, Finance, Marketing, Ops modules
└── public/
    ├── website/               ← was _marketing/
    ├── health-check/
    └── business-os/
```

✅ Zero deploy plumbing changes · ✅ Vercel build script untouched · ✅ Cmd-K navigation matches Ed's mental model.

### Option 2 · **Four separate Next.js apps** (more work)

```
04-milesymedia-portal/
├── website/        ← own package.json, own next build
├── health-check/   ← own package.json
├── demo/           ← own package.json
└── portal/         ← own package.json + plugins/milesymedia/
```

Requires a monorepo tool (pnpm workspaces or Turborepo), four Vercel projects or path-based routing on one domain, and shared component re-extraction. **Don't do this unless we have a deploy-level reason.**

→ **Decision needed from Ed before any moves happen.** Default = Option 1 unless told otherwise.

---

## C · What gets parked / killed

While we're tidying:

### Park into `_obsolete/` (or a new `_attic/`)

- `04-milesymedia-portal/plugins/` — the duplicate plugin registry at this level (separate from the canonical one inside `milesymedia-website/src/plugins/`). Confirm it's not wired into the build before parking.
- `04-milesymedia-portal/clients/` — reference snapshots (e.g. felicias perfect portal). Move to a `_reference/` folder; not part of the live build.
- `src/app/portal/agency/workspaces/people/` and `…/growth/` — workspace dashboards I built for People + Growth workspaces. **Ed has now scoped down to 4 workspaces (Aqua HQ · Finance · Marketing · Operations)**, so these are orphan pages.
- Anything inside `src/plugins/foundation-adapters/` we know isn't being used by the 4 active workspaces. List to confirm before parking.

### Keep / consolidate

- `01 development/` — already in place, just keep adding docs.
- `memory/` — fine where it is.
- `scripts/` — fine.
- `_obsolete/02 …/` and `_obsolete/03 old portal/` — leave archived; don't restore anything.

---

## D · Workspace scope (active set)

Ed's confirmed current workspaces (2026-05-14):

| Workspace | Color | Panels (sidebar) | Dashboard route |
|-----------|-------|------------------|-----------------|
| **Aqua HQ** | #0EA5A4 teal | main, fulfillment | `/portal/agency` |
| **Finance** | #16A34A green | agency-finance | `/portal/agency/workspaces/finance` |
| **Marketing** | #DB2777 magenta | marketing, agency-marketing | `/portal/agency/workspaces/marketing` |
| **Operations** | #F59E0B amber | ops, agency-ops, tools, agency-hr | `/portal/agency/workspaces/ops` |

Dropped (parked): People, Growth.

---

## E · Migration checklist (in execution order)

1. [x] **Confirm 4-workspace scope** — Aqua HQ · Finance · Marketing · Operations (`workspaces.ts` trimmed)
2. [x] **Park orphan workspace dashboards** — People + Growth moved to `_attic/workspace-dashboards/`
3. [x] **Decide Option 1 vs 2** — Option 1 picked
4. [x] **Inventory duplicate plugins registry** — outer `04/plugins/` is partially load-bearing (`effectiveRole.ts` + `embedAllowResolver.ts` import from `agency-hr/` and `website-editor/`). **Kept in place.** Note: 4 imports total — fold these source files into `milesymedia-website/src/plugins/foundation-adapters/` in a follow-up to retire the outer folder cleanly.
5. [x] **Create route groups** — `(website)/`, `(health-check)/`, `(demo)/` created in `src/app/`
6. [x] **Move marketing routes** — `/`, `for-*`, `projects`, `resources`, `signup`, `login` moved into `(website)/`
7. [x] **Move `/health-check/**`** — into `(health-check)/health-check/` (URL unchanged, route group is transparent)
8. [x] **Move `/demo/**`, `/dev/**`** — into `(demo)/`
9. [x] **Create `src/plugins/milesymedia/`** — README stub documenting the agency's plugin pack + migration roadmap (actual nav-item extraction from `sidebarLayout.ts` is a follow-up)
10. [x] **Rename `public/_marketing/` → `public/website/`** — done; updated SiteShell href + internal HTML/CSS refs (`sed -i 's|/_marketing|/website|g'`)
11. [x] **Update `vercel.json` + `scripts/build-portal.mjs`** — no changes needed (folder names inside `milesymedia-website/` unchanged)
12. [x] **Smoke test** — `/` 200, `/portal/agency` 307→/login (auth gate), `/portal/agency/workspaces/finance|marketing|ops` 307, `/health-check` 200, `/demo` 200, `/login` 200, `/portal/agency/settings` 307
13. [x] **Update `01 development/files.md`** — this section + final tree below

---

## F · Open questions (Ed answer before step 5)

1. **Option 1 or Option 2** — one Next.js app with route groups, or four separate apps?
2. **"Milesymedia plugin"** — is this a *folder of nav items + dashboards specific to your agency* (i.e. the Aqua HQ + Finance + Marketing + Ops bundle becomes `plugins/milesymedia/`), or something else?
3. **Public marketing pages (`/for-skincare`, `/for-coaching`, etc)** — keep on the same Next app, or split into `website/` and only the portal lives in the portal app?
4. **`_obsolete/02 …` + `_obsolete/03 old portal/`** — can these be deleted entirely, or kept as cold archive?

---

## G · Final tree (post-ship 2026-05-14)

```
ker-v3/
├── 01 development/
│   └── files.md                          ← this doc
├── _obsolete/                            ← cold archive (kept)
│   ├── 02 felicias aqua portal work/
│   └── 03 old portal/
├── memory/                               ← session summaries (unchanged)
├── scripts/                              ← Vercel build + deploy (paths updated to 04-milesymedia-portal/)
├── 05-aqua-portal/                       ← reserved for the wider Aqua Portal product (empty for now)
├── 04-milesymedia-portal/                ← the Milesy Media product (this is what we're building now)
│   ├── clients/                          ← reference snapshots (kept; flag for future move into _reference/)
│   ├── demo portals/                     ← demo sandbox files (kept)
│   ├── plugins/                          ← partially live (4 imports); fold into src/plugins/foundation-adapters/ in a follow-up
│   └── milesymedia-website/              ← THE Next.js app
│       ├── _attic/
│       │   └── workspace-dashboards/     ← orphan People + Growth dashboards (parked 2026-05-14)
│       ├── src/
│       │   ├── app/
│       │   │   ├── (website)/            ← /, /for-skincare, /for-coaching, /for-fitness, /for-agencies, /projects, /resources, /signup, /login
│       │   │   ├── (health-check)/health-check/
│       │   │   ├── (demo)/demo/, (demo)/dev/
│       │   │   ├── (seeds)/              ← pre-existing route group
│       │   │   ├── portal/               ← /portal/agency, /portal/clients, /portal/customer, /portal/account
│       │   │   ├── api/, embed/, healthz/, _home/, _niches/
│       │   │   ├── error.tsx, globals.css, layout.tsx, not-found.tsx
│       │   ├── components/               ← chrome/, ui/, SiteShell, ResourceFinder
│       │   ├── lib/                      ← a11y/, chrome/, healthCheck/, resources/, server/
│       │   ├── server/                   ← types, tenants, users, storage, phases, …
│       │   └── plugins/
│       │       ├── _registry.ts, _types.ts, _runtime.ts, _routeResolver.ts, …
│       │       ├── foundation-adapters/  ← 25 plugin adapters
│       │       └── milesymedia/          ← agency's own plugin pack (stub + README)
│       └── public/
│           ├── website/                  ← was _marketing/
│           ├── business-os/, health-check/
│           └── favicons + manifest
├── CLAUDE.md, README.md, package.json, vercel.json
```

## H · Follow-ups (not part of this ship)

- Migrate `agency-hr/` + `website-editor/` source files from `04-milesymedia-portal/plugins/` into `src/plugins/foundation-adapters/`, retire the outer folder.
- Extract Aqua HQ nav items from `sidebarLayout.ts` into `src/plugins/milesymedia/` once the plugin manifest contract supports workspace-aware items.
- Move `04-milesymedia-portal/clients/` reference snapshots into a top-level `_reference/` folder.
- Decide whether `_home/`, `_niches/` are still needed (underscore-prefixed routes Next ignores).

## I · Working agreement

- This doc is the single source of truth for the reorg. Update it as we go.
- Don't move folders until the corresponding checklist item is checked.
- For each move: `git mv` (preserve history), then run a build to confirm nothing broke before moving the next.
- After the reorg ships, every "id like this to go here" / "add xyz feature" conversation references this tree, not the legacy one.
