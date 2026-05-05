# `04` end-customer flow (T1 — Round 5)

R4 wired the static site → portal handoff and made the demo cycle
agency↔client. R5 closes the architecture's three-level recursion
(`Agency → Client → End-customer`): per-client signup + login, a real
variant-driven `/portal/customer`, a customer route family for
plugin-contributed pages, and a third POV in the demo cycle.

> Built by T1 on 2026-05-05, on top of Round 4 chapter 27
> ([04-milesymedia-demo.md](04-milesymedia-demo.md)).

## 1. Per-client uniqueness — scoped user storage key

End-customers are scoped to a single client. Two different clients of
the same agency may both have a customer named `jane@gmail.com` — they
are different humans, identified by the address `(jane@gmail.com,
clientId)` rather than just `jane@gmail.com`. Agency-side and client-
tier users keep the legacy plain-email key (one email is unique within
an agency by convention).

`src/server/users.ts`:

```ts
function userKey(email: string, role: Role, clientId?: string): string {
  const e = email.trim().toLowerCase();
  if (role === "end-customer" && clientId) return `${e}|c:${clientId}`;
  return e;
}
```

The `state.users: Record<string, ServerUser>` map is unchanged in
shape; the key is now derived per-record. `getUser` /
`verifyPassword` / `setUserPassword` / `updateUser` accept an optional
`UserLookupScope = { clientId?, role? }`:

| Caller                    | Scope passed                           | Behaviour |
|---------------------------|----------------------------------------|-----------|
| `/api/auth/login` (legacy) | none                                   | plain key only — agency/client tier |
| `/api/auth/login` (embed)  | `{ clientId, role: "end-customer" }`   | scoped key first, falls through to plain |
| `/api/auth/end-customer/signup` | `{ clientId, role: "end-customer" }` | scoped key only — uniqueness check |
| `seedDemoAgency()` (customer) | `{ clientId, role: "end-customer" }` | scoped key only |

`getUserById` and `listUsersForAgency` already iterate values, so
they're indifferent to the key shape.

## 2. POST `/api/auth/end-customer/signup`

```jsonc
{
  "clientId": "cli_xxx",
  "email": "shopper@example.com",
  "password": "8+ chars",
  "name": "optional"
}
```

Pipeline:

1. Per-IP rate limit (`signup:<ip>`, 10/min).
2. JSON parse + presence + `validatePassword`.
3. Resolve `clientId` → Client; 404 if missing/archived.
4. Refuse if `client.endCustomers?.signupsEnabled === false` (default
   true, opt-out flag added to `Client` in this round).
5. Per-(client, email) rate limit (`signup-email:<clientId>:<email>`,
   5/min) — slows enumeration / mass-signup probes.
6. Uniqueness check via `getUser(email, { clientId, role })` —
   conflicts on the scoped key only, so an agency-owner
   `jane@gmail.com` doesn't collide with a same-name end-customer.
7. `createUser` writes the record under the scoped key.
8. `issueSession({ ..., clientId, role: "end-customer" })` — no
   `isDemo`. Reserved for `/demo`-issued sessions only.
9. Activity entry: `auth / end_customer.signup`.
10. Response: `{ ok, user, returnUrl? }` + Set-Cookie.

`returnUrl` is read from `client.endCustomers?.postLoginReturnUrl`
(optional). The embed form falls back to `?return=<url>` then to
`${origin}/portal/customer`.

## 3. `/api/auth/login` extension

```jsonc
{ "email": "...", "password": "...", "clientId": "<embed-client>?" }
```

When `clientId` is present (embed surface knows its embedding client),
the route tries `verifyPassword(email, password, { clientId, role:
"end-customer" })` first. On miss, falls through to the unscoped call —
preserves agency/client-tier sign-in via the embed surface. The
existing first-run bootstrap branch is unchanged.

Cookie shape unchanged: `lk_session_v1` HMAC payload carries
`{ userId, email, role, agencyId, clientId? }`. End-customer sessions
always include `clientId`.

## 4. Real `/portal/customer` — variant-driven

`src/app/portal/customer/page.tsx` replaces the R1 placeholder. Server
component:

```
requireRole("end-customer")
  → resolve session.clientId
  → load Client (brand kit fed to layout one level up)
  → look up website-editor install for (agencyId, clientId)
  → if installed:
      siteId = getOrCreateDefaultSite(...)
      account = getActivePortalVariant(..., "account")  ← T3 export
      login   = getActivePortalVariant(..., "login")    ← T3 export
      variantPage = account ?? login (null otherwise)
  → enabled customer-panel plugin nav items
  → render:
      header (Welcome, brand-aware)
      [variant page blocks via T3's <BlockRenderer>]
      [customer-panel plugin links grid]
      [Fallback "Nothing here yet" card if both empty]
```

The chrome (sidebar, brand-kit injection) is painted by
`/portal/customer/layout.tsx` one layer up — already in place from R1,
verified to use `scope: "customer"` on `buildSidebar`.

### Variant fallback hierarchy

| State                                                    | Render                  |
|----------------------------------------------------------|-------------------------|
| website-editor not installed for client                  | header + plugin links + fallback card |
| installed, no active "account" variant, no "login"       | header + plugin links + fallback card |
| installed, active "login" variant only                   | header + login variant blocks + plugin links |
| installed, active "account" variant                      | header + account variant blocks + plugin links |

The "login" fall-through matters because most demo agencies will have
applied the Round-1 starter login variant via `applyStarterVariant`
but won't have an account variant yet — the customer surface still
shows *something* useful instead of the bare welcome card.

## 5. Customer route family — `/portal/customer/[...rest]`

`src/app/portal/customer/[...rest]/page.tsx` mirrors the
`/portal/clients/[clientId]/[...rest]` catch-all:

- `requireRole("end-customer")` (single role — end-customer URLs are
  not for agency operators previewing).
- Calls `resolveCustomerPluginPage({ agencyId, clientId, rest })`
  added to `_routeResolver.ts`.
- Two match branches, mirroring the client resolver:
  1. Explicit plugin id prefix — `/portal/customer/<pluginId>/<sub>`
     against the plugin's relative-path pages.
  2. Full-URL pages anchored at `/portal/customer/...` against any
     enabled install for `(agencyId, clientId)`.
- Agency-wide installs are eligible too (e.g. an agency-scoped CRM
  plugin contributing a customer-facing surface) thanks to the same
  `pickInstall(pluginId, agencyId, clientId)` precedence used by the
  client resolver.

Relative paths without an explicit plugin prefix do **not** match —
that's the ambiguity guard ("which plugin owns `/portal/customer/orders`?").
Plugins targeting customer surfaces should declare full-URL paths or
the explicit-prefix shape.

## 6. Sidebar + `panelId: "customer"`

`PanelId` extended with `"customer"`. `buildSidebar` adds a panel slot
between `store` and `content`, labelled "Account". The scope filter
gains a customer branch:

```ts
if (input.scope === "customer"
    && navItem.panelId !== "customer"
    && !navItem.href.startsWith("/portal/customer")) continue;
```

A plugin opts into the end-customer chrome by setting
`panelId: "customer"` on its NavItems. The `/portal/customer` page's
fallback link grid uses the same gate (role + feature + customer
panel/href) so the "Things you can do" links match the sidebar.

## 7. Three-state demo POV cycle

`/demo/toggle` cycles through three POVs in order:

```
agency-owner  →  client-owner  →  end-customer  →  agency-owner …
/portal/agency   /portal/clients/<id>   /portal/customer
```

Each step re-issues `lk_session_v1` against the seeded demo user for
the next POV, preserving `isDemo: true`. The redirect target matches
the POV's surface so the visitor lands directly on the chrome that
makes sense for their current role.

`seedDemoAgency` now creates a third user — `demo-shopper@aqua.test`
with password `shopper-demo-2026`, scoped to the Felicia mirror
client. `getDemoSnapshot()` returns all four (agency, client, owner,
client-owner, customer) so toggle and banner can resolve any POV in
one read. `SeedDemoResult` and `DemoTenantSnapshot` both gain
`customerUser`; `bootstrapped` gains `customer: boolean`.

`DemoBanner` updates:

- POV labels: "Agency view" / "Client view" / "Customer view".
- Description: "You're acting as the {role} of {tenant}".
- Cycle button label: "Next view → {Client|Customer|Agency}".
- "Leave demo" form unchanged.

`/portal/layout.tsx` reads `session.role` and resolves
`"agency" | "client" | "customer"` for the banner prop. Real
(non-demo) sessions render no banner — `session.isDemo` gates it.

## 8. Reset already covers the customer

`resetDemo()` walks `state.users` keyed by `agencyId` regardless of
the storage key shape, so `email|c:<clientId>` records get wiped along
with the rest. The smoke confirmed:

```jsonc
"removed": {
  "agency": 1, "clients": 1, "users": 5,
  "pluginInstalls": 3, "pluginDataKeys": 2,
  "phases": 6, "activityEntries": 12, "endCustomers": 0
}
```

Five users includes the demo agency-owner, the demo client-owner, the
new demo customer, and any additional accounts (smoke test signups
with the seed-demo cookie). `endCustomers` is the legacy
`PortalState.endCustomers` slot — orthogonal to the user records and
unused for the auth path. Not deleted in this round; reserved for a
future memberships/CRM plugin's projection.

## 9. Embed login bridge

`/embed/login?client=<id>` already painted client-branded chrome. R5
gives the embedded `<LoginForm>` two new props:

- `clientId: string` — POSTed in both `/login` and `/signup` bodies so
  the auth lookup hits the per-client end-customer pool.
- `allowSignup: boolean` — read on the server from
  `client.endCustomers?.signupsEnabled !== false` (default true) and
  passed to the form.

The form renders a "Don't have an account? Create one" toggle when
both are present. The toggle flips between `mode: "signin"` and
`"signup"`; signup mode posts to `/api/auth/end-customer/signup` and
collects an optional name field.

Success navigation:

1. If the response payload carries `returnUrl` (server side honours
   `client.endCustomers.postLoginReturnUrl`), use it.
2. Else honour the page-level `?return=<url>` query (when present and
   the form is embedded).
3. Else default to `${origin}/portal/customer`.

Embedded mode (when `window.parent !== window`) drives the parent
frame's navigation so the visitor lands on the embedding site, not
inside the iframe.

## 10. Smoke results (verified 2026-05-05)

```
POST /api/auth/end-customer/signup   → 200 + cookie role=end-customer ✓
GET  /portal/customer (with cookie)  → 200, brand kit applied ✓
POST same email twice                → 200, then 409 (uniqueness) ✓
POST /api/auth/login + clientId      → 200, role=end-customer ✓
GET  /portal/customer body           → "Welcome back, …" + brand vars ✓
                                     → no demo banner (real session) ✓

GET  /demo                           → 307 + isDemo cookie + agency POV ✓
GET  /demo/toggle (a→c)              → /portal/clients/<id>, role=client-owner ✓
GET  /demo/toggle (c→customer)       → /portal/customer, role=end-customer ✓
GET  /demo/toggle (customer→a)       → /portal/agency, role=agency-owner ✓
DemoBanner labels                    → "Agency view" / "Client view" /
                                       "Customer view" + correct "Next view" ✓

POST /api/dev/seed-demo?reset=1      → wipes 1/1/5/3/2/6/12/0,
                                       bootstrapped {agency:T,client:T,customer:T} ✓
GET  /api/dev/seed-demo (no auth)    → 403 (gate intact) ✓
GET  /portal/customer (no auth)      → 307 → /login ✓
```

`npm run build` clean. `npx tsc --noEmit` clean.

## 11. Cross-team handoff notes

- **`Client.endCustomers: ClientEndCustomerConfig`** is new. Plugins
  interested in customer-side billing or domain config can extend it
  alongside `signupsEnabled` / `postLoginReturnUrl` — but T1 is the
  authority on the field shape (it's foundation territory, not plugin).
- **`PanelId += "customer"`** is a foundation contract change. Plugins
  contributing customer-facing nav items should use this panelId from
  R5 onward. Plugins authored before this change keep working — the
  customer scope filter also accepts hrefs starting with
  `/portal/customer`.
- **`getActivePortalVariant`** import path — T3 exposes it from
  `@aqua/plugin-website-editor/server`. The customer page calls it
  through the workspace dep, NOT through `FOUNDATION_SERVICES.variants`
  (that port only owns `applyStarterVariant`). When T1 needs a generic
  variant accessor on the foundation port (e.g. for memberships'
  paywall variant), extending `PortalVariantPort` is the right move;
  for now the direct import is scoped to the customer home page only.
- **Install-link refresh**: hit the same Turbopack dev quirk T2 R3
  documented — workspace-dep updates need
  `rm -rf node_modules/@aqua/plugin-X && npm install` on the portal
  side. Otherwise stale R1 surfaces (e.g. `BlockRenderer` with the
  Round-1 `{block}` shape) survive in node_modules. Worked around for
  this round; longer-term fix is an npm postinstall hook or a
  documented `npm run refresh-deps` script.
- **First-request hydrate quirk** (R1's `chronic dev-server cache-bug`)
  also bites the embed page. After the seed runs in worker A, the
  embed worker B can be a stale process whose first request hydrated
  before the seed. Restart `npm run dev` to refresh — production has
  no equivalent because every request shares the same cache.

## 12. R5 deviations from the prompt

| Topic                       | Prompt                                  | Shipped                                                | Why |
|-----------------------------|-----------------------------------------|--------------------------------------------------------|-----|
| User store                  | "Adapt users.ts if needed; add a new helper rather than breaking existing" | Added `UserLookupScope`; legacy `getUser(email)` unchanged when scope omitted | Spec |
| Variant render              | "powered by T3's variant flow"          | Direct import of T3's `getActivePortalVariant` + render via `<BlockRenderer>` | T3 doesn't yet expose a one-call host-side renderer; minimal surface needed |
| Customer route prefix match | "mirror existing /portal/clients/[clientId]/[...rest] resolver pattern" | Added `resolveCustomerPluginPage` next to it; relative-path branch requires explicit plugin prefix | Avoid ambiguity when multiple plugins have a top-level relative-path page |
| EndCustomer demo wipe       | "?reset=1 must wipe the demo end-customer too" | Already covered — users loop walks all keys by `agencyId` | No code change needed beyond seeding the customer |

---

## Round 8 update — same-origin stitch (chapter 49)

R8 makes milesymedia + Aqua portal one origin (chapter
`04-milesymedia-portal-stitch.md`). Two notes for the end-customer
flow:

- **`/embed/login` is also same-origin under the stitch.** The portal
  origin (`milesymedia.com` in prod, `localhost:3030` in dev) hosts
  both the marketing landing and the iframe-able login surface. The
  iframe is still cross-origin from the embedding client's website
  (e.g. `luvandker.com`), so the existing R5 contract is unchanged:
  the iframe loads `https://milesymedia.com/embed/login?client=<id>`,
  the form submits cross-origin to `/api/auth/end-customer/signup` or
  `/api/auth/login`, the `lk_session_v1` cookie scopes to the portal
  origin, and `window.parent.location.href = returnUrl` drives the
  parent frame post-login.
- **`?return=<url>`** on the embed form still routes to wherever the
  embedding site wants the visitor to land. Default behaviour
  (`${origin}/portal/customer`) now uses the portal origin —
  `milesymedia.com/portal/customer` in prod — which is the exact
  surface end-customers are meant to land on. No code change in
  `LoginForm.tsx` for R8; the `${origin}` expression already resolves
  to the same-origin host.

The R5 cookie shape (`isDemo` flag, scoped per-client `email|c:<clientId>`
key), the variant-driven `/portal/customer` resolution, and the customer
route family at `/portal/customer/[...rest]` are unchanged.
