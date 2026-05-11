# 04 — Page routing — rename + redirect (T3 R025)

T3 Round 025. Operator can rename / move / delete pages with
automatic redirect handling so old URLs don't 404. Per-site
redirect registry that the storefront route handler consults
before serving 404.

## 1. State on entry

`server/pages.ts` already supports rename (`updatePage` accepts
`slug`) + delete (`deletePage`) + portal-variant change
(`portalRole` patch). R025 ships the redirect tracker that the
host page wires into rename/delete callbacks.

## 2. Redirect registry

NEW `server/redirects.ts` — pure, per-site list of `RedirectEntry
{ from, to, ts, reason: "rename" | "delete" | "manual" }`. Storage
key: `t/<a>/<c>/website-editor/redirects/<siteId>`. Capped at
`REDIRECTS_CAP = 100`; oldest pruned on overflow.

Helpers:

- `listRedirects(storage, a, c, siteId)` — newest-first.
- `addRedirect(storage, input)` returns `{ entry, pruned,
  rewroteChain }`. Three guarantees:
  1. Self-loop (`from === to`) throws `RedirectLoopError`.
  2. **Chain shortening** — every existing entry whose `to` was
     this rename's `from` gets rewritten to the new `to`. Keeps
     the chain shallow (one hop max for any current alias).
  3. Same-`from` collapse — re-adding a `/old → /x` after a
     `/old → /y` drops the first so we never accumulate duplicate
     `from`s.
- `removeRedirect(storage, a, c, siteId, from)` — boolean.
- `resolveRedirect(entries, slug)` — walks the chain (max 5
  hops) for the final destination; returns null when no
  redirect matches.

Slug normalisation: strings get a leading `/` if missing. Inputs
to all helpers accept either form.

## 3. API endpoints

`api/handlers/redirects.ts` mounts 4 routes at
`/api/portal/website-editor/`:

- `GET /redirects?siteId=…` → `{ redirects[] }`. 400 missing.
- `POST /redirects` body `{ siteId, from, to, reason? }` → 201
  with `{ entry, pruned, rewroteChain }`. 400 missing args. 409
  on self-loop (`RedirectLoopError`).
- `DELETE /redirects?siteId=…&from=…` → 200 / 404.
- `GET /redirects/resolve?siteId=…&slug=…` → `{ target: <slug>
  | null }`. Storefront helper — host runtime calls this on a
  404 lookup before serving 404.

All `requireClientScope`-gated.

## 4. Editor wiring (host-side)

Pure server primitives — host page wires:

- **Rename**: when operator changes a page's slug, host PATCHes
  the page (existing endpoint) AND POSTs `/redirects` with
  `{ from: oldSlug, to: newSlug, reason: "rename" }`. R025
  doesn't change the page CRUD itself.
- **Move-to-variant**: same as rename — slug changes via
  `updatePage` patch on `portalRole`. R025 unchanged.
- **Delete with redirect**: confirm modal asks operator for
  fallback target (variant root or `/`). On confirm: DELETE the
  page + POST `/redirects` with `reason: "delete"`.

Storefront 404 path: middleware GET `/redirects/resolve?slug=…`
on 404; if `target` non-null, emit 301 to the new slug; otherwise
serve the 404 page.

## 5. Smoke

NEW `__smoke__/r025-redirects.test.ts` 28/28 pass:

- `REDIRECTS_CAP = 100`.
- `addRedirect` normalises leading slash + sets reason; missing
  slash prepended.
- `listRedirects` newest-first.
- Self-loop throws `RedirectLoopError`.
- Chain shortening: 2 existing entries pointing to `/new` get
  rewritten to `/newer` after rename.
- Same-`from` collapse: re-adding `/old → /finalest` leaves
  exactly one entry with `from: "/old"`.
- `resolveRedirect`: unknown → null, known → target, normalises
  input slug (no leading slash); walks 4-hop chain to final
  target.
- Capacity trim: 105 adds → 100 retained, newest at head, oldest
  pruned.
- `removeRedirect`: hit/miss bool.
- HTTP shape: POST 201 / 400 missing siteId / 409 self-loop;
  GET list 200; GET resolve hit/miss; DELETE 200/404.

`@aqua/plugin-website-editor` package.json test chain extended.
website-editor tsc-clean.

## 6. Files

- `plugins/website-editor/src/server/redirects.ts` (NEW —
  registry + addRedirect + listRedirects + removeRedirect +
  resolveRedirect + RedirectLoopError + REDIRECTS_CAP).
- `plugins/website-editor/src/api/handlers/redirects.ts` (NEW
  — 4 handlers).
- `plugins/website-editor/src/api/routes.ts` patch (4 new routes).
- `plugins/website-editor/src/__smoke__/r025-redirects.test.ts`
  (NEW).
- `plugins/website-editor/package.json` (test chain).

## 7. Q-ASSUMED / deviations

- Rename / delete UI affordances + the slug-edit field in
  page-settings are existing host-page concerns; R025 ships
  the registry + endpoints. The host wires the PATCH + POST
  pair atomically.
- "Atomic transaction across pages PATCH + redirect POST" is
  best-effort (host fires both; partial failure = page renamed
  without redirect, recoverable manually). Foundation
  transaction endpoint is R+1.
- Storefront 301 emission lives in foundation routing — R025
  ships the `/resolve` endpoint that returns `{ target }`;
  middleware composes the 301.
- Wildcard / regex redirects out of scope per prompt.
- 410 Gone explicitly out of scope per prompt — every entry is
  a 301.
- Chain hop cap (5) protects against cycles — typical chains
  resolve in 1-2 hops; 5 is conservative.

## 8. R+1 candidates

- Editor "Page settings → Rename" UI mounting the slug edit +
  auto-POSTing the redirect on save (R+1 host wire-up).
- Delete-confirm modal with fallback-target picker (`/` or
  variant root or operator-chosen page).
- Foundation atomic transaction so rename + redirect either
  both succeed or both rollback.
- Wildcard / pattern redirects (`/blog/*` → `/journal/$1`).
- 410 Gone semantics for permanently-deleted pages.
- Rename history visible in `pageVersions` (R022) so operator
  can track the slug history alongside the BlockTree history.
- `removeRedirect` admin UI inside a dedicated redirects page
  (today operator deletes via API only).
