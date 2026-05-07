# Chapter 144 — Basic observability (T1 R030, WS-E)

Final WS-E ship-gate item. Combines:
- Sentry wire-up (already lazy-loaded; chapter just verifies + documents).
- Request log helper (JSON-line stdout, opt-in via `withRequestLog`).
- `/healthz/full` deep probe (DB + plugins + uptime + sha).
- Top-level `app/error.tsx` reporting to Sentry.

## Goal A — Sentry wire-up

Already in place from earlier work — `lib/server/observability.ts`
lazy-imports `@sentry/nextjs` (so dev without the dep + DSN unset
both work cleanly). Public API:

- `captureError(err, breadcrumb?)` — fire-and-forget. Always
  `console.error`s (Vercel Function logs see the trace) and
  best-effort routes through Sentry on next microtask.
- `recordBreadcrumb(message, data?)` — drop on the active scope.
- `withApiObservability(handler, {route, resolveBreadcrumb})` —
  HOF for API routes; tags Sentry scope, captures + re-throws,
  records duration + status breadcrumb.

`SENTRY_DSN` (server) + `NEXT_PUBLIC_SENTRY_DSN` (browser) +
`SENTRY_TRACES_SAMPLE_RATE` (default 0 dev / 0.1 prod) wire through
the lazy-loaded module. Filtering + sample-rate tuning belong to
`@sentry/nextjs`'s own init layer (R+1 wires `sentry.server.config.ts`
+ `sentry.client.config.ts` once we install the dep).

## Goal B — Request log helper

NEW `src/lib/server/requestLog.ts` (no `server-only` shim — smoke
drives every branch).

```
{"t":"req","ts":1715079600000,"method":"GET","path":"/portal/agency",
 "status":200,"durationMs":42,"userId":"usr_…","agencyId":"agency_…"}
```

API:

- `formatRequestLog(entry, now?)` — pure. Returns one JSON line
  with the canonical shape (`t/ts/method/path/status/durationMs`)
  + optional tenancy fields (`userId/agencyId/clientId`) + flat
  `extra` keys. Method auto-uppercased. Undefined tenancy keys
  are dropped — no `null` leakage.
- `shouldSkipRequestLog(path)` — true for `/healthz`, `/healthz/...`,
  `/_next`, `/favicon`, and asset suffixes (`.css/.js/.mjs/.map/
  .png/.jpg/.jpeg/.webp/.svg/.ico/.woff/.woff2/.ttf`).
- `logRequest(entry)` — emits to stdout via `console.log`. Skips
  when `NODE_ENV === "test"` so smokes run quiet. Respects
  `shouldSkipRequestLog`.
- `withRequestLog(handler, {route?, tag?})` — HOF that wraps a
  Web-API `Request → Response` handler. Records duration; calls
  `tag(req, ctx)` to derive tenancy (errors swallowed via `safeTag`
  so a broken tagger doesn't break the route).

Why a helper, not a Next.js middleware: the existing `middleware.ts`
is matcher-scoped to `/embed/:slug/:variant` for CSP work. Broadening
it to `:path*` would log every static asset + healthcheck. Mass
adoption is incremental — high-traffic API routes wrap their export
in `withRequestLog`; static + chrome routes opt in as needed.

## Goal C — `/healthz/full` deep probe

NEW `src/app/healthz/full/route.ts`. Deliberately separate from
`/healthz` (existing — ships SHA + env + ts; never touches DB per
its module comment "a healthz that depends on Postgres is a
false-positive when the app is up but Postgres is paged").

`/healthz/full` is the deep probe the prompt's ship-gate calls for:

```ts
{
  ok, db: "connected"|"down"|"untested", error?,
  plugins: <count>, uptime: <sec>,
  service: "aqua-portal", env, sha, ts,
}
```

Returns **503** when `db: "down"`, **200** otherwise. The DB probe
runs `SELECT 1` against `getPool()`; gated on `PORTAL_BACKEND ===
"postgres" || DATABASE_URL set` (file-backend deploys report
`db: "untested"` rather than fabricating a green light — chapter
#68 honesty).

`uptime` is `now - BOOT_AT` (module-load timestamp). `plugins`
counts `state.pluginInstalls` rows after `ensureHydrated`. SHA reads
`VERCEL_GIT_COMMIT_SHA` then `GITHUB_SHA` then `null`.

Both probes are non-fatal: a hydrate failure produces `plugins:
null` rather than throwing (the route still returns).

## Goal D — Top-level `app/error.tsx`

NEW. Catches render errors anywhere in the App Router tree. Reports
to Sentry via `captureError` (lazy-imported in a `useEffect` so the
client bundle stays small + safe when Sentry isn't loaded). Renders
a fallback UI with `reset` button + "Back to homepage" link. Surface
metadata (`digest`, `app/error.tsx`) sent as `extra` so traces are
groupable in Sentry.

## Goal E — Smoke

NEW `scripts/smoke-observability.test.ts` (run via
`npm run smoke:observability`, 13/13 pass, ~25s — slower because
the route source-marker reads compile heavy paths).

Five suites:

- **Request log formatter** (4) — flat JSON shape; method
  uppercased; tenancy fields included when set; undefined fields
  dropped (no nulls); extras flattened to top level.
- **Skip rules** (3) — `/healthz` + `/healthz/full` skipped;
  `/_next` + `.css/.js/.webp/.woff2` skipped; portal/api routes
  not skipped.
- **`/healthz/full` route** (3 source-marker) — file exists +
  GET returns 200/503 from DB probe; untested branch when not
  Postgres; plugins/uptime/sha reported.
- **`app/error.tsx`** (1) — `"use client"` + `captureError` +
  `digest` + `reset`.
- **Sentry lazy-load** (2) — observability.ts imports
  `@sentry/nextjs` lazily + warns when missing; requestLog skips
  emit when `NODE_ENV === "test"`.

## NOT in scope

- Custom metrics dashboards (post-ship).
- Distributed tracing across plugins (post-ship).
- Mass adoption of `withRequestLog` across every route (incremental;
  helper available — high-traffic routes opt in).
- `sentry.server.config.ts` / `sentry.client.config.ts` (R+1 once
  `@sentry/nextjs` is installed in deps; today the lazy import
  warns + no-ops).
- Removing the existing `/healthz` (kept lightweight per its module
  comment; `/healthz/full` is the deep probe).

## Q-ASSUMED

- **`/healthz/full` separate from `/healthz`**: existing module
  comment explicitly warns against making liveness depend on
  Postgres ("false-positive when the app is up but Postgres is
  paged"). The deep probe gets its own route per the deferred plan
  documented there. Ship-gate's "503 if DB down" lands at
  `/healthz/full`.
- **`db: "untested"` over `db: "connected"` for file-backend**:
  honesty over a false-green-light. Operators on file-backend get
  a clear "this deploy isn't talking to Postgres" signal.
- **Mass adoption deferred**: 50+ route handlers exist. Wrapping
  every one in `withRequestLog` would create a sprawling diff.
  Helper available; per-route adoption follows the `withApiObservability`
  pattern (incremental).
- **Request log via helper not middleware**: existing middleware is
  matcher-scoped; broadening to `:path*` would log every static
  asset. Helper-based opt-in keeps the channel clean.
- **`uptime` from module-load timestamp**: serverless deploys cycle
  workers frequently — uptime is "this worker's age", not "this
  deploy's age". For a deploy-age signal use SHA/env diff.
- **Smoke source-marker for routes**: `/healthz/full` imports
  `server-only` storage; can't drive runtime under tsx. Source-
  marker covers the documented branches.
- **`error.tsx` lazy-imports observability**: keeps the client
  bundle from pulling Sentry on every page; the dynamic import
  resolves on-error.
- **Test-mode silencing for `logRequest`**: keeps `NODE_ENV=test`
  smokes from polluting the test runner output.
