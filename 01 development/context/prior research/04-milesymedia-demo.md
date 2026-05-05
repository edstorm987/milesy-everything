# `04` Milesy Media demo flow (T1 — Round 4)

The Milesy Media public marketing site (`04 the final portal/milesymedia website/`)
now hands visitors off to the live Aqua portal in two flavours:

1. **Sign in** → `${portalBase}/login` (the real auth surface — first-run
   bootstrap creates the agency on demand).
2. **Try the demo** → `${portalBase}/demo` — sandboxed agency with a
   header POV toggle (agency owner ↔ client owner), reset-on-demand.

This chapter documents the moving pieces.

> Built by T1 on 2026-05-04, on top of Round 3 chapter 25
> ([04-foundation-round3.md](04-foundation-round3.md)).

## 1. Static-site → portal handoff

`milesymedia website/{index,login,admin}.html` declare a portal base
URL in `<head>`:

```html
<meta name="aqua-portal-base" content="http://localhost:3000" />
```

A small inline `<script>` at the bottom of `<body>` rewrites every
`[data-aqua-action]` element's `href`:

| `data-aqua-action` | Rewritten to                                  |
|--------------------|------------------------------------------------|
| `sign-in`          | `${base}/login`                                |
| `demo`             | `${base}/demo?source=milesymedia`              |

The static deploy (Vercel) ships the HTML unchanged; the meta value is
bumped at deploy time so the static site stays decoupled from the
portal origin. The same pattern doubles for the footer "Last deployed
YYYY-MM-DD" string — both bump together.

`login.html`'s form submit no longer fakes auth against `admin.html`;
it now redirects to `${base}/login?email=<encoded>` so the visitor
finishes sign-in on the real portal with the email pre-filled.

## 2. Cookie shape — `isDemo` on `SessionPayload`

`src/server/types.ts` extends the HMAC-signed `lk_session_v1` payload:

```ts
export interface SessionPayload {
  userId: string;
  email: string;
  role: Role;
  agencyId: string;
  clientId?: string;
  isDemo?: boolean;     // sandboxed marker — only set by /demo
  iat: number;
  exp: number;
}
```

`issueSession()` accepts an optional `isDemo` flag and only writes it
when explicitly true (so a normal `/api/auth/login` cookie never carries
the field). The chrome layer reads `session.isDemo` and conditionally
renders `DemoBanner`.

The flag is per-session, not per-user: when the POV toggle re-issues a
cookie under a different demo user, the new cookie still carries
`isDemo: true`. A real sign-in (Sign-in CTA → `/login`) using the same
demo credentials is allowed but produces a non-demo cookie; the demo
banner does not appear.

## 3. The two top-level routes

```
src/app/demo/
├── route.ts            GET /demo
└── toggle/
    └── route.ts        GET /demo/toggle
```

Both are top-level Route Handlers — **not under `/portal`** — so the
public visitor lands without an active session and the parent
`/portal/layout.tsx` redirect-on-no-session guard is sidestepped.

### `GET /demo?source=…`

1. `await ensureHydrated()` (file-backed state).
2. `seedDemoAgency()` — idempotent (see §4).
3. `issueSession({ ...demoOwner, isDemo: true })`.
4. `Set-Cookie: lk_session_v1=…; HttpOnly; SameSite=lax`.
5. 307 → `/portal/agency`.

`source` is logged on the activity entry so we can later count
referrals.

### `GET /demo/toggle`

1. `getSessionFromRequest(req)` — must exist and be `isDemo: true`.
   Otherwise: 307 → `/demo?source=toggle` (re-seed + re-issue).
2. `getDemoSnapshot()` — must return the demo agency + Felicia + both
   users. Otherwise: 307 → `/demo?source=toggle-foreign`.
3. Defense in depth: `session.agencyId === snapshot.agency.id`.
4. If currently `agency-owner` → re-issue as the client-owner (Felicia
   mirror), redirect to `/portal/clients/<demoClientId>`.
5. If currently `client-owner` → re-issue as the agency-owner, redirect
   to `/portal/agency`.
6. Both new cookies carry `isDemo: true`.

The toggle is GET because the banner uses an `<a>` link — no CSRF
concern since the action is a self-toggle within an isolated agency.
Logout is a POST form (CSRF-relevant) and uses the existing
`/api/auth/logout` endpoint.

## 4. Shared seed module — `src/lib/server/demoSeed.ts`

Round 2's `/api/dev/seed-demo` had its body inlined in the route. R4
factored that body into a shared module so `/demo/route.ts` and the API
route both call the same code path:

| Export                 | Used by                                            |
|------------------------|----------------------------------------------------|
| `seedDemoAgency(actor?)` | `/demo` (no actor) + `/api/dev/seed-demo` (gated) |
| `resetDemo()`          | `/api/dev/seed-demo?reset=1`                       |
| `getDemoSnapshot()`    | `/demo/toggle`, `/portal/layout.tsx`               |
| `DEMO_*` constants     | seed body, toggle, banner, route handlers          |

Idempotency model:

- `getAgencyBySlug("demo-agency")` exists → reuse it; `bootstrapped.agency = false`.
- `getUser("demo@aqua.dev")` exists → reuse it.
- Demo client (slug `luv-and-ker-demo`) exists for the demo agency → reuse it.
- Plugin installs (`website-editor`, `ecommerce`) only run if
  `getInstall(...) === null`. Order matters:
  `website-editor` first because `ecommerce.requires = ["website-editor"]`.
- Checklist progress (half ticks on the onboarding phase) only seeds when
  no progress record exists for `(clientId, phaseId)`.

## 5. Reset semantics — `resetDemo()`

A single `mutate()` call, ordered to leave no dangling FKs after the
agency row is removed:

```ts
mutate(state => {
  // 1. children first
  filter clients     where agencyId === demo.id  → delete
  filter endCustomers where agencyId === demo.id → delete
  filter users       where agencyId === demo.id  → delete
  filter pluginInstalls where agencyId === demo.id → delete
                                + delete state.pluginData[installId]
  filter phases      where agencyId === demo.id  → delete
  state.activity = activity.filter(a => a.agencyId !== demo.id)
  // 2. agency last
  delete state.agencies[demo.id]
});
```

Returns a `ResetDemoResult` with per-collection counts so the API route
echoes them on the JSON response. Smoke run:

```jsonc
"removed": {
  "agency": 1, "clients": 1, "users": 2,
  "pluginInstalls": 3, "pluginDataKeys": 2,
  "phases": 6, "activityEntries": 7, "endCustomers": 0
}
```

The endpoint shape:

| Verb | Query     | Behaviour                                              |
|------|-----------|--------------------------------------------------------|
| GET  | (none)    | List agencies (debug hint)                             |
| GET  | `reset=1` | Reset + re-seed (gated)                                |
| POST | (none)    | Idempotent seed (gated)                                |
| POST | `reset=1` | Reset + re-seed (gated)                                |

Gate (unchanged from R2): `NEXT_PUBLIC_DEV_BYPASS=1` OR an authenticated
agency-owner / agency-manager session. A demo session is gate-eligible
because demo users are themselves agency-owner of the demo agency —
that's intentional, since reset only targets the demo tenant by slug.

No cron is wired in R4. The endpoint is the manual reset path; a Vercel
cron call to `GET /api/dev/seed-demo?reset=1` is a one-line addition
once we're ready (architecture §8 calls for a nightly cycle).

## 6. `DemoBanner` — chrome injection

`src/components/chrome/DemoBanner.tsx` is a server component (no
`"use client"`). It's rendered conditionally at
`src/app/portal/layout.tsx`:

```tsx
const session = await getSession();
let demoSnapshot = null;
if (session.isDemo) {
  demoSnapshot = getDemoSnapshot();
  if (demoSnapshot && demoSnapshot.agency.id !== session.agencyId) {
    demoSnapshot = null;          // tenant wiped under our feet
  }
}
const pov = session.role === "client-owner" ? "client" : "agency";
return <>
  {demoSnapshot && <DemoBanner pov={pov} agencyName={…} clientName={…} />}
  {children}
</>;
```

Visual: sticky amber strip (`bg-amber-100`, `border-amber-300`,
`shadow-sm`) at the top of the viewport. Three actions in the right
group:

- "Switch to <other> view" → `<a href="/demo/toggle">` (POV flip).
- "Leave demo" → `<form action="/api/auth/logout" method="post">` so the
  visitor returns to the marketing site.

Because the banner sits in `/portal/layout.tsx` it spans both
`/portal/agency/*` and `/portal/clients/[clientId]/*`. The agency
layout's own `<Topbar>` keeps its existing Sign out form — both work;
the banner's "Leave demo" is the demo-flavoured path with extra
labelling.

## 7. Why `/demo` is top-level, not `/portal/demo`

The Round-4 prompt named the path `/portal/demo`, but `/portal/layout.tsx`
runs `getSession()` and redirects anonymous visitors to `/login` — a
visitor who's never touched the portal couldn't reach a `/portal/demo`
gate without already having a session. Architecture §11 lists
`milesymedia.com/demo` at the top level, and that lines up with the
Route Handler approach: handle the GET, set the cookie, redirect into
`/portal/agency` after the session exists.

Logged as Q-ASSUMED on 2026-05-04T20:25:00Z; no commander correction.

## 8. Smoke results (verified 2026-05-04)

```
GET  /demo?source=milesymedia       → 307 → /portal/agency
                                      Set-Cookie isDemo:true ✓
GET  /portal/agency  (demo cookie)  → 200 + DemoBanner ✓
GET  /portal         (demo cookie)  → 307 → /portal/agency
GET  /demo/toggle  (agency POV)     → 307 → /portal/clients/<id>
                                      Set-Cookie role=client-owner,
                                                  clientId=<id>,
                                                  isDemo:true ✓
GET  /portal/clients/<id>           → 200 + banner ("Switch to agency") ✓
GET  /demo/toggle  (client POV)     → 307 → /portal/agency
                                      Set-Cookie role=agency-owner,
                                                  isDemo:true ✓
POST /api/dev/seed-demo             → ok, idempotent (bootstrapped:false) ✓
POST /api/dev/seed-demo?reset=1     → ok, removed: {1,1,2,3,2,6,7,0},
                                      bootstrapped: {agency:true,client:true} ✓
GET  /demo/toggle  (no cookie)      → 307 → /demo?source=toggle ✓
GET  /demo/toggle  (real cookie)    → 307 → /demo?source=toggle ✓
POST /api/auth/login (demo creds)   → real session, NO isDemo,
                                      no banner rendered ✓
```

`npm run build` clean. `npx tsc --noEmit` clean.

## 9. R4 deviations from the prompt

| Topic                  | Prompt                          | Shipped                                           | Why |
|------------------------|---------------------------------|---------------------------------------------------|-----|
| Demo route path        | `/portal/demo/page.tsx`         | `src/app/demo/route.ts` (URL `/demo`)             | Avoid the `/portal/layout.tsx` no-session redirect; matches arch §11 |
| Page vs Route Handler  | `page.tsx` server component      | `route.ts` GET                                    | Server components can't `Set-Cookie`; route handlers can |
| Toggle path            | "demo/toggle route"             | `src/app/demo/toggle/route.ts`                    | Same Route-Handler reason |
| Static-site Demo CTA   | unspecified                     | Added to navbar + hero (was missing)              | Public site had no Demo button before R4 |
| Reset gate             | unspecified for ?reset=1        | Same gate as POST seed (agency-owner/manager or DEV_BYPASS) | Reset is destructive; reuse seed's gate |

## 10. Cross-team handoff notes

- The `isDemo` flag is part of the locked session shape now. Any future
  cookie-payload addition (e.g. impersonation, MFA proof) should follow
  the same "optional, only-set-when-true" pattern so older sessions
  remain forward-compatible.
- Plugin authors don't need to do anything for the demo flow. Plugins
  live under `agencyId = "demo-agency"` and are scoped exactly as
  real installs — there's no "demo-aware" branch in any plugin code.
- `getDemoSnapshot()` + the `DEMO_*` constants are exported so any
  later surface (e.g. a "reset demo from the banner" button) can call
  them without re-deriving the slug or email lookups.
- A future Vercel cron entry that hits `GET /api/dev/seed-demo?reset=1`
  will need either `NEXT_PUBLIC_DEV_BYPASS=1` for that environment or a
  service token. Out of scope for R4.

---

## Round 8 update — same-origin stitch (chapter 49)

R8 stitches milesymedia and the Aqua portal as one origin (chapter
`04-milesymedia-portal-stitch.md`). Two implications for the demo
flow:

- **Demo button now hits same-origin `/demo`.** The static site's
  `data-portal-base` meta defaults to `""` (empty) since R8, so the
  inline rewriter produces `'/demo?source=milesymedia'` (root-relative)
  instead of `'http://localhost:3000/demo?...'`. Visiting
  `localhost:3030/` and clicking Demo lands at `localhost:3030/demo`;
  visiting `milesymedia.com/` and clicking Demo lands at
  `milesymedia.com/demo`. No cross-origin cookie dance.
- **`?portalBase=` query override** still lets standalone-preview
  workflows point Demo at a separately-hosted portal (e.g. `python3 -m
  http.server` in `milesymedia website/` for design review against a
  staging portal).

The `isDemo` cookie payload, the POV cycle, and the reset endpoint
are unchanged. The `/demo` route handler is unchanged. R8 is purely
a URL-surface change.
