# Chapter 147 — BOS auth-gate middleware integration (T1 R031)

T2 R022 (chapter #137) shipped a pure decision engine for the BOS
auth gate — `evaluate(ctx, opts) → {outcome, redirect?, banner?}` —
and explicitly flagged middleware integration as foundation-pending.
R031 closes that loop: `middleware.ts` imports the helpers, extends
its matcher, and translates engine outcomes into `NextResponse`.

## Goal A — Matcher extension

`middleware.ts config.matcher` now carries three patterns:

```ts
matcher: [
  "/embed/:slug/:variant",
  "/business-os/:path*",
  "/api/portal/business-os/:path*",
],
runtime: "nodejs",
```

Existing R16 embed CSP arm preserved. Two new patterns cover the
plugin's `BOS_PATH_PREFIXES` (`/business-os` + `/api/portal/business-os`).

## Goal B — Decision dispatch

`middleware()` reads pathname; if `matchesBosPath(pathname)` it routes
to `handleBosGate`, otherwise to the existing `handleEmbedCsp` arm.

```ts
const decision = evaluateBosGate(
  { pathname, signedIn: session !== null, role: session?.role },
  { loginPath: "/login", devBypass: process.env.NEXT_PUBLIC_DEV_BYPASS === "1" },
);
switch (decision.outcome) {
  case "allow":      return NextResponse.next();
  case "redirect":   return NextResponse.redirect(new URL(decision.redirect ?? "/login", req.url));
  case "dev-bypass": return next() + Set-Cookie bos_dev_banner=1;
}
```

The plugin's helpers + service are pure (no `server-only` shim) so the
middleware imports them via relative path:

```ts
import { matchesBosPath, isBosAsset } from "../plugins/bos-auth-gate/src/lib/domain";
import { evaluate as evaluateBosGate } from "../plugins/bos-auth-gate/src/server/services";
```

Same pattern `effectiveRole.ts` uses for `agency-hr`'s `DEFAULT_ROLES`
— bypasses the workspace-deps + `transpilePackages` ceremony for
helpers that are pure POJOs.

## Goal C — Session resolution

`getSessionFromRequest(req)` decodes the HMAC cookie without a DB
hit — same hot-path verifier `auth.ts` exposes for route handlers.
Middleware runs on every BOS request; a DB read here would be a
material cost on every page transition.

The decoded session's `role` is the only field the engine reads;
`signedIn` is `session !== null`.

## Goal D — Static asset short-circuit

`if (isBosAsset(pathname)) return NextResponse.next()` runs BEFORE the
session decode. Two reasons:

1. The engine returns `allow` for these too — no behaviour change.
2. Avoids the cookie decode for high-volume asset paths
   (CSS/JS/images on every page-load).

## Goal E — Dev-bypass cookie

When `NEXT_PUBLIC_DEV_BYPASS === "1"` and the request would otherwise
redirect, the engine returns `dev-bypass` + a banner string. Middleware
sets `bos_dev_banner=1` (lax + secure-in-prod, HttpOnly off so BOS
client JS can read it without a server roundtrip). The plugin's BOS
surface reads this cookie and renders the "DEV MODE — BOS is open"
banner per the T2 R022 contract.

## Goal F — Smoke

NEW `scripts/smoke-bos-middleware-integration.test.ts` (run via
`npm run smoke:bos-middleware-integration`, 15/15 pass, ~2.5s).

Three suites:

- **Matcher** (3) — config.matcher includes new patterns + preserves
  embed; `matchesBosPath` excludes `/business-os-other` false-positive;
  `isBosAsset` detects asset suffixes.
- **Decision branches** (7 runtime) — anonymous → redirect; signed
  lead → allow; signed agency-staff → allow; signed end-customer →
  redirect (`role_not_allowed`); static asset → allow regardless of
  auth; devBypass → dev-bypass + banner; out-of-scope path → allow.
- **Wire-up source-markers** (5) — relative import paths; outcome
  switch translates to NextResponse; getSessionFromRequest used
  (no DB hit); `NEXT_PUBLIC_DEV_BYPASS === "1"` read; static asset
  short-circuits BEFORE session decode.

## NOT in scope

- BOS data persistence migration (post-ship — chapter #137 R+1).
- Lead-to-customer upgrade UX (post-ship).
- Workspace-deps + `transpilePackages` registration for the plugin —
  middleware uses relative imports per the existing `effectiveRole.ts`
  pattern. R+1 flips to `@aqua/plugin-bos-auth-gate` via npm-style
  imports if/when the plugin gets a runtime container the foundation
  needs to wire (today: zero runtime; pure decision engine).

## Q-ASSUMED

- **Relative imports over workspace deps**: matches the precedent set
  by `effectiveRole.ts` reading `agency-hr` `DEFAULT_ROLES`. The
  plugin's `domain.ts` + `services.ts` are pure POJOs — no runtime
  side-effects, no storage. Adding the plugin to `package.json` +
  `transpilePackages` would force a re-install + a build re-do for a
  zero-byte payload.
- **BOS gate runs first; embed CSP second**: explicit ordering in
  `middleware()` so `/business-os/...` paths never fall through to the
  embed arm.
- **`bos_dev_banner` cookie HttpOnly off + secure-in-prod**: the cookie
  carries no secret, just a flag. Plugin's BOS-side JS reads it without
  a server roundtrip. SameSite=Lax + Secure-in-prod close most vectors.
- **Lightweight session decode over DB hit**: middleware runs on every
  BOS request. `getSessionFromRequest` is a stateless HMAC verify —
  no Postgres. Freshness checks (R021 `sessionRev`) only fire on
  `getCurrentUser` paths, which BOS routes invoke separately when they
  need the user record. Stale sessions reach BOS at most until cookie
  expiry — an acceptable trade for the latency win.
- **Static asset short-circuit before session decode**: redundant
  with the engine's same branch but saves the cookie verify on every
  asset load. Net win on `/business-os/styles.css` / image traffic.
- **`runtime: "nodejs"`**: same as existing R16 arm. Required for
  the session decode + (future) any storage reads from the gate. Edge
  runtime would be smaller but blocks future expansions.
- **Default `redirect` fallback to `/login`**: `decision.redirect` is
  always set when outcome is `redirect`, but TypeScript can't prove
  it. The `?? "/login"` fallback is a defensive no-op.
