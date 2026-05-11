/loop

# T1 — Round 5: End-customer flow (third audience live)

Round 4 wired the Milesy Media static site to the portal: Sign-in works,
Demo button drops a visitor into a sandboxed agency with an agency↔client
POV toggle. What's still stubbed is the **third audience** — Felicia's
shoppers / members / affiliates — the end-customers. Their `/portal/customer`
page exists but is a placeholder, the embed login surface doesn't issue
end-customer cookies, and there's no signup path. Round 5: make the third
tenancy level real, end-to-end.

This closes the architecture's three-level recursion (Agency → Client →
End-customer) that `eds requirments.md` lists as a hard constraint and
that `04-architecture.md` §1 describes. Same engine, third tier.

## Working environment

- **Repo**: https://github.com/edsworld27/ker-v3
- **Local**: `~/Desktop/ker-v3/`
- **Branch**: `main`. `git pull --rebase --autostash && git push` after each commit.
- Top-level folders contain spaces — quote them.

## Messaging

- **Outbox**: `01 development/messages/terminal-1/to-orchestrator.md`
- **Inbox**: `01 development/messages/terminal-1/from-orchestrator.md`
- Don't stop on questions; log `Q-ASSUMED`. Only stop on `Q-BLOCKED`.

## Mandatory pre-read

1. `01 development/CLAUDE.md` (Mode A — terminal mesh)
2. `01 development/context/prior research/04-architecture.md` — §1 (three-level tenancy), §3 (auth), §11 (URL surface)
3. `01 development/context/prior research/04-foundation.md`, `04-foundation-round2.md`, `04-foundation-round3.md` — your prior chapters
4. `01 development/context/prior research/04-milesymedia-demo.md` — your R4 chapter (read your own prior round)
5. `01 development/context/prior research/04-plugin-website-editor.md` — §"applyStarterVariant" + portal-variant resolution
6. `01 development/context/prior research/aqua-portal-variants.md` — `PortalRole = "login"|"affiliates"|"orders"|"account"` and `isActivePortal` semantics
7. `01 development/eds requirments.md` — §"three audiences" + §"three-level recursion"
8. Current end-customer surface (all stubbed/partial):
   - `04-the-final-portal/portal/src/app/portal/customer/{layout,page}.tsx`
   - `04-the-final-portal/portal/src/app/embed/login/page.tsx`
   - `04-the-final-portal/portal/src/app/api/auth/login/route.ts`
9. `04-the-final-portal/portal/src/server/{tenants,users,types}.ts` — `EndCustomer` shape, `Role` enum incl. `"end-customer"`

## Scope

### Goal A: Per-client end-customer registration + login

End-customers are scoped to a single client (an end-customer of Felicia
is NOT an end-customer of any other Felicia-tier client). The auth surface
must reflect that.

1. **Registration endpoint** — `POST /api/auth/end-customer/signup`:
   - Body: `{ clientId, email, password, name? }`.
   - Resolves `clientId` → client record. 404 if missing.
   - Refuses if signups are disabled for the client (read a new optional
     `client.endCustomers.signupsEnabled` flag — default `true`).
   - Per-IP + per-email rate limit (mirror `/api/auth/login` shape).
   - Creates a `User` with `role: "end-customer"`, `agencyId: client.agencyId`,
     `clientId`. Email uniqueness scoped to the `(agencyId, clientId)` pair —
     two different clients can both have a user `jane@gmail.com`. Adapt
     `users.ts` if needed; add a new helper rather than breaking existing
     `verifyPassword(email)` lookups for agency/client tiers.
   - Issues a session cookie tied to `(agencyId, clientId, role: "end-customer")`.
   - Returns `{ ok: true, user }` and sets cookie.
2. **Login endpoint adjustment** — `POST /api/auth/login` already handles
   email/password sign-in. Extend so end-customers can sign in via the
   embed surface: the LoginForm passes the embedding `clientId` (already
   in `?client=` on `/embed/login`) so the lookup can scope to that
   client's email pool. If the form doesn't provide a `clientId`, default
   to the global agency/client pool — preserves existing agency/client
   sign-in behaviour.
3. **Session payload** — add `clientId` to the cookie when role is
   `end-customer` (already supported; just ensure the issuance path sets
   it). End-customers must not have agency-side power; verify
   `requireRole("end-customer")` rejects all other roles cleanly.

### Goal B: Real `/portal/customer` page powered by the variant flow

The end-customer's home is whichever portal variant the client has
activated for their `account` `PortalRole` (or `login` if no `account`
variant exists yet). T3's `applyStarterVariant` machinery is already
foundation-wired (R3 `portalVariantAdapter`).

1. Replace `04-the-final-portal/portal/src/app/portal/customer/page.tsx`
   with a server component that:
   - Calls `requireRole("end-customer")`.
   - Resolves the active `account` portal variant for `(agencyId, clientId)`
     via the website-editor plugin's `getActivePortalVariant` (call through
     foundation's plugin runtime by `pluginId: "website-editor"`).
   - Falls back to a sensible default render if no variant is active
     (small "Welcome, $name" card with a list of links to whatever
     plugins the client has installed that target the customer surface).
2. The layout (`portal/customer/layout.tsx`) already does brand-kit
   injection + sidebar building. Keep that. Make sure `buildSidebar`'s
   `scope: "customer"` correctly filters plugin nav items by their
   `panelId` (only `"customer"`-scoped panels show).
3. End-customer route family — `/portal/customer/[...rest]` catch-all
   that resolves to plugin pages declared with `panelId: "customer"`.
   Mirror the existing `/portal/clients/[clientId]/[...rest]` resolver
   pattern — share `_routeResolver.ts`.

### Goal C: Demo extension — third POV

Currently `/demo/toggle` flips between agency-owner and client-owner
POVs. Add a third: end-customer.

1. The demo seed (`/api/dev/seed-demo`) already creates a Felicia mirror
   client. Extend it to also create one demo end-customer
   (e.g. `demo-shopper@aqua.test` / generated password) tied to that
   client. Document the credentials in the response payload.
2. Extend `/demo/toggle` to cycle through three POVs in order
   (agency → client → end-customer → agency). Re-issues cookie each time;
   the end-customer cookie carries `(agencyId, clientId, role)` of the
   seeded shopper.
3. The `DemoBanner` should show the current POV label and a "Next view"
   button. Three labels: "Agency view" / "Client view" / "Customer view".
4. `?reset=1` on seed-demo must wipe the demo end-customer too (you
   already wipe agency + clients + plugin installs).

### Goal D: Embed login → end-customer-aware

`/embed/login?client=<id>` currently shows a branded login form but the
form's POST handler (`/api/auth/login`) doesn't know it's an embed
context. Wire the embed form to:

1. Pass the embedding `clientId` in the POST body so the auth lookup
   scopes to that client's end-customer pool first, then falls back to
   the agency/client pool.
2. Show a "Don't have an account? Create one" toggle that flips the form
   to the new `POST /api/auth/end-customer/signup` endpoint (only when a
   `clientId` is provided and `client.endCustomers.signupsEnabled !== false`).
3. On success, navigate the *parent* frame to a configurable
   `?return=<url>` query param (default: `<portal>/portal/customer`) so
   the visitor lands on their account page on the embedding site, not
   inside the iframe.

## NOT in scope

- Don't build memberships / orders / affiliates plugins — those land in
  later rounds (likely T2).
- Don't touch fulfillment / ecommerce / website-editor plugin source —
  T2 + T3 own those. If you find one of T3's variant helpers needs an
  extra export to wire `getActivePortalVariant` correctly, log a `WARN`
  in T3's inbox, don't edit T3's source.
- Don't build a magic-link or password-reset flow — pure email+password
  is fine for v1.
- Don't deploy the portal to Vercel — same constraint as R4.
- Don't add a separate end-customer admin surface for clients to manage
  their customer pool — that's a future plugin (probably `client-crm`).

## Loop discipline

Each cycle: pull → read inbox + outbox → progress → commit → push →
append `COMMIT` → `ScheduleWakeup` with `<<autonomous-loop-dynamic>>`.
Mid-task 600–900s, fully DONE 1500s, 3 empty wakes → omit ScheduleWakeup
to end.

## When done

1. `npm run build` + `npx tsc --noEmit` clean inside `04-the-final-portal/portal/`.
2. Smoke flow:
   - Visit `/embed/login?client=<felicia-id>` → branded form → "Create
     one" → submit → `/portal/customer` 200 with brand-kit applied.
   - `/api/dev/seed-demo` → seed includes a demo end-customer; credentials
     in response.
   - Demo POV cycle: agency view → client view → customer view → agency
     view, each with the right brand + sidebar.
3. Chapter: `04-end-customer-flow.md` (auth shape, route resolver
   extension, variant-fallback semantics, demo POV cycle, embed-login
   bridge, deviations from R4 cookie shape).
4. MASTER.md row.
5. `tasks.md` — mark T1 R5 done.
6. Append `DONE` + final `COMMIT` to outbox.
