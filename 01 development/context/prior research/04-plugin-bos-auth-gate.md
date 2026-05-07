# `@aqua/plugin-bos-auth-gate` — T2 R022 (WS-B)

Pairs with `@aqua/plugin-public-funnel`. The funnel captures the lead;
this plugin makes sure only signed-in users hit `/business-os/*` and
feeds the lead's HC slot to BOS for personalisation. Pure decision
engine + a `me` endpoint — foundation wires the actual middleware
match (HARD BOUNDARY: this plugin does NOT edit the website source
or the static `public/business-os/`).

## Manifest

- `id: "bos-auth-gate"`, `version: "0.1.0"`, `status: "alpha"`,
  `category: "core"`.
- `core: true` (auto-installs on bootstrap).
- `scopePolicy: "agency"` gated to the master Milesy agency for now
  (mirrors public-funnel's scope assumption).
- ActivityCategory `"bos-auth-gate"` (vendored union appends).
- No nav items, no admin pages — gate is invisible UI.
- Two settings: `loginPath` (display-only; runtime reads it via the
  `evaluate` opts) + `devBypass` (display-only; actual bypass is
  read from `NEXT_PUBLIC_DEV_BYPASS` at request time).

## Pure helpers (foundation imports these)

```ts
matchesBosPath(pathname): boolean         // /business-os + /api/portal/business-os subtrees
isBosAsset(pathname): boolean             // .css/.js/.svg/etc — never redirect mid-asset
buildLoginRedirect({loginPath?, nextPath}): string
                                          // returns "/login?from=bos&next=<encoded>"
```

`BOS_PATH_PREFIXES` + `BOS_SOFT_ALLOW_SUFFIXES` exported as
`readonly string[]` so the foundation middleware can swap to a
`config.matcher` array without re-importing.

## Decision engine

```ts
evaluate(ctx: AuthGateContext, opts?: AuthGateOptions): AuthGateDecision
```

`AuthGateContext`: `{ pathname, signedIn, role?, allowedRoles? }`.
`AuthGateOptions`: `{ loginPath?, devBypass? }`.
`AuthGateDecision`: `{ outcome: "allow" | "redirect" | "dev-bypass",
redirect?, reason?, banner? }`.

Decision rules in order:
1. `!matchesBosPath(pathname)` → `allow` reason `out_of_scope`.
2. `isBosAsset(pathname)` → `allow` reason `static_asset` (browser
   can't follow a 302 mid-asset-load).
3. `opts.devBypass` → `dev-bypass` with banner
   `"DEV MODE — BOS is open. Set NEXT_PUBLIC_DEV_BYPASS=0 to gate."`.
4. `!signedIn` → `redirect` with `?from=bos&next=<original>`.
5. `role` not in `allowedRoles ?? ["lead", "agency-owner",
   "agency-manager", "agency-staff"]` → `redirect` reason
   `role_not_allowed`.
6. else `allow` reason `ok`.

Default-allowed roles include `lead` (funnel target audience) AND
agency operators (so staff can inspect BOS as the customer view).
End-customers and client-* roles are NOT default-allowed — BOS is
agency / lead surface, not client portal.

## `me` endpoint

`GET /api/portal/business-os/me` (visibleToRoles: lead + agency-staff)

Response:
```json
{ "ok": true, "me": {
    "user": { "id": "user_lead_a", "email": "ed@example.com",
              "name": "Ed", "role": "lead" },
    "hcSlot": { "slot": 3, "scores": {...}, ... },
    "capturedAt": 1746619200000,
    "agencyless": true
}}
```

`agencyless` is `true` when role === `"lead"` (lead users live in the
`LEAD_AGENCY_ID` sentinel tenant — chapter #127). `false` for agency
operators so BOS can offer the operator's agency view without leaking
tenant boundaries.

`hcSlot` + `capturedAt` come from the optional `FunnelMePort`. When
the public-funnel plugin is absent (or no capture for this user),
both are omitted and BOS falls back to its localStorage shape.

The handler reads `?role=` as a fallback hint until foundation passes
role through `PluginCtx`. Foundation already gates the route on
session presence; the handler trusts `ctx.actor`.

## Foundation port — `FunnelMePort`

```ts
FunnelMePort {
  getMeContextByUserId(userId): {
    leadUserId, email, hcSlot?, capturedAt?
  } | null
}
```

Foundation injects this when public-funnel is registered; absent →
me payload still works minus the personalisation fields. Smoke #14
pins this — agency-manager me payload returns without `hcSlot`.

## Foundation pending (standard 5-step + extras)

1. Workspace dep `@aqua/plugin-bos-auth-gate`.
2. `transpilePackages` += `@aqua/plugin-bos-auth-gate`.
3. Side-effect import calling `registerGateFoundation` at boot.
4. `_registry.ts` append.
5. `ActivityCategory` += `"bos-auth-gate"` in foundation.
6. **NEW**: `milesymedia-website/middleware.ts` matcher extended to
   include `/business-os/:path*` + `/api/portal/business-os/:path*`,
   then `evaluate({ pathname: req.nextUrl.pathname, signedIn,
   role }, { loginPath: "/login", devBypass: process.env.NEXT_PUBLIC_DEV_BYPASS === "1" })`
   gives the decision; translate `outcome === "redirect"` to
   `NextResponse.redirect(new URL(decision.redirect, req.url))`,
   `dev-bypass` to a pass-through with a `Set-Cookie: bos_dev_banner=1; SameSite=Lax`
   header (BOS reads it client-side to render the banner), `allow`
   to `NextResponse.next()`. **This file is T1 territory** — T2
   does NOT edit it.
7. **NEW**: `FunnelMePort` adapter wrapping the public-funnel
   plugin's `meContext(leadUserId)` service so the `me` endpoint
   can return personalisation. T1 wires both plugins together at
   the foundation layer.

## NOT in scope (R+1)

- BOS data persistence migration (localStorage → Postgres) — leave
  for post-ship.
- Lead → paying-customer upgrade UX inside BOS — post-ship.
- Editing `public/business-os/` to consume the `me` payload — T4
  territory; this plugin reserves the endpoint shape only.
- Editing `milesymedia-website/middleware.ts` — T1 territory; the
  plugin exports `evaluate` so T1 wires it.

## Smoke

`src/__smoke__/gate.test.ts` — 16/16 pass via `tsx --test`. The
suite splits into pure helpers (1-3), the decision engine (4-11),
and the `me` resolver (12-16).

1. `matchesBosPath` true for both BOS prefixes; rejects
   `/business-os-other` (prefix-only false-positive guard).
2. `isBosAsset` flags `.css/.js/.svg`, leaves dashboard / API paths.
3. `buildLoginRedirect` → `/login?from=bos&next=<encoded>`.
4. `evaluate` out-of-scope path → `allow` reason `out_of_scope`.
5. Static asset under `/business-os/` → `allow` regardless of auth.
6. Anon → `redirect` with proper `?from=bos&next=` query string.
7. Signed-in `lead` → allow.
8. Signed-in `agency-manager` → allow (operator inspection).
9. Signed-in `client-owner` → `redirect` reason `role_not_allowed`.
10. `devBypass: true` → `dev-bypass` with banner; anon allowed
    through.
11. Custom `loginPath` flows through to the redirect URL.
12. `me("user_unknown")` → null.
13. Lead with HC slot → returns `hcSlot` + `capturedAt` +
    `agencyless: true` + `user.role: "lead"`.
14. Agency-manager + no funnel port wired → `agencyless: false`,
    `hcSlot` undefined (graceful degradation).
15. `me` without explicit role passes through `agencyless: false`
    (role defaults to undefined; non-`"lead"` → false).
16. `me` logs category `"bos-auth-gate"` + emits `me_read` event.

`tsc --noEmit` clean.

## R1 commit

T2 R022 single commit. After R022 T2 has shipped 18 plugins. WS-B
work for Sprint 1 is now complete (R021 funnel + R022 gate).
