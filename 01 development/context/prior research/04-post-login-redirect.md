# Chapter 125 — Role-aware post-login redirect (T1 R022, WS-A)

Before this round every successful sign-in landed on `/portal/agency`
regardless of role. That was acceptable while the only callers were
agency owners; once the unified site (#121–#123) put `client-owner`,
`end-customer` and the upcoming `lead` role behind the same `/login`,
the hardcode became a UX bug — clients hit a blank "no agency" surface,
end-customers hit a 403, and there was nowhere for leads to land.

## Goal A — Resolver

NEW `src/lib/server/postLoginRedirect.ts` exports
`resolvePostLoginPath(session, user, opts?)` returning a same-origin
path. Routing table:

| role                                          | landing                       |
| --------------------------------------------- | ----------------------------- |
| `agency-owner` / `agency-manager` / `agency-staff` | `/portal/agency`         |
| `client-owner` / `client-staff` / `freelancer`     | `/portal/clients/<slug>` |
| `end-customer`                                | `/portal/customer`            |
| `lead` (R023, defensive — role doesn't exist yet) | `/business-os`            |
| neither session nor user                      | `/login`                      |

Source preference: `user` first (fresher, survives session staleness),
session payload second.

**Client-scoped fallback**: when a `client-*` user has no `clientId`
or the referenced client has been deleted, we drop to `/portal/agency`
rather than constructing `/portal/clients/undefined`. Login's
defense-in-depth check (route.ts) refuses sign-in earlier in the
deleted-client case for password auth, but POV bypass + magic-link
flows can still exercise this branch.

**Lead role**: not in the `Role` union today. We accept a permissive
`RoleLike = SessionPayload["role"] | "lead"` and check for it via
string match. R023 lands the union extension; this resolver is ready.

**`ResolveOptions.clientLookup`**: defaults to `getClient` from
`@/server/tenants`, but can be injected for tests. Production callers
never pass it.

## Goal B — Wire-up

Three route handlers swap their hardcoded `/portal/agency` for the
resolver:

- `/api/auth/login` — both the first-run **bootstrap** branch (returns
  `redirect` alongside `bootstrap: true`) and the standard sign-in
  response. Two call-sites in one file.
- `/api/auth/signup` — replaces the literal
  `redirect: "/portal/agency"` with `redirect: resolvePostLoginPath(null, user)`.
  Signup always creates an `agency-owner`, so this resolves to
  `/portal/agency` in practice — but routing through the resolver keeps
  the codebase grep-clean and lets future signup variants (lead-magnet,
  end-customer self-serve) route correctly.
- `/api/auth/magic/verify` — when the magic link was minted without a
  `?return=…` (or with a non-same-origin one), we now compute the
  fallback via the resolver instead of defaulting to `/portal/customer`.
  Same-origin `?return=` paths still win.

## Goal C — LoginForm

`LoginForm.tsx` already accepted `data.returnUrl` (from the embed
`postLoginReturnUrl` config). It now also accepts `data.redirect`,
chained behind `returnUrl`:

```ts
navigate(data.returnUrl ?? data.redirect ?? success);
```

The page-level `success` default (`/portal` non-embed,
`/portal/customer` embed) remains as last-resort fallback.

## Goal D — Dev POV bypass

`/dev/pov`'s server action used to hardcode `landing` per persona.
Now it calls the resolver against the seeded user:

```ts
const landing = resolvePostLoginPath(null, user);
```

So the four personas — Founder, demo-owner, demo-client (Felicia),
demo-customer — exercise the exact same routing real users will see.
The POV button labels keep their static `→ /portal/...` strings; those
are documentation, not runtime.

## Goal E — Smoke

NEW `scripts/smoke-post-login-redirect.test.ts` (run via
`npm run smoke:post-login-redirect`, ~1.8s, 11/11 pass).

Two suites:

- **Resolver source markers** (6 tests) — verifies all five role arms
  + the deleted-client fallback + the null fallback. Doesn't import the
  resolver directly because `@/server/tenants` carries `server-only`
  which throws under `tsx --test`. Source-marker checks suit a small
  pure-routing module like this one fine.
- **Call-site wire-up** (5 tests) — `/api/auth/login` (≥2 call-sites,
  no remaining hardcoded `/portal/agency`), `/api/auth/signup`,
  `/api/auth/magic/verify` (still honors `?return=`),
  `/dev/pov` (calls resolver), `LoginForm` (chained navigate).

## NOT in scope

- Adding the `lead` role to the `Role` union — R023.
- Cross-tab sign-in propagation — R+1.
- Real client-portal redirect for non-agency-owner signup variants —
  signup-flow expansion lives in WS-B / WS-F.

## Q-ASSUMED

- **Lead → /business-os**: chapter #121 + #124 specify this; resolver
  is defensive ahead of R023.
- **Client-deleted fallback to /portal/agency**: prompt's instruction
  is "fallback to /portal/agency". Login route still refuses sign-in
  via existing defense-in-depth — fallback only fires for non-password
  auth flows.
- **Source-marker smoke over runtime smoke**: tenants.ts has
  `server-only` which throws under tsx — same pattern session-security
  smoke uses for rateLimit.ts.
- **Magic-link `?return=` precedence**: when caller minted a
  same-origin `return` URL, that wins over the resolver. Magic link
  is end-customer-scoped and the original returnUrl was usually the
  embedding storefront — preserving it matches existing behavior.
- **Signup signs in as `agency-owner`**: resolver still routes through
  but resolves to `/portal/agency` — consistent with the existing
  route's literal default, just no longer hardcoded.
