# `@aqua/plugin-public-funnel` — T2 R021 (WS-B)

The critical link in the public funnel: Health Check completion → real
`lead` user → auto-signin → drop into Business OS. Same path will
serve future Resources tools (rank-my-website, …) via
`tool-complete`.

Plan reference: chapter #124 ship-plan-v1 WS-B. Depends on T1 R023
(`lead` role landed at chapter #127).

## Manifest

- `id: "public-funnel"`, `version: "0.1.0"`, `status: "alpha"`,
  `category: "growth"`.
- `core: true` — auto-installs on bootstrap.
- `scopePolicy: "agency"` — round prompt suggested `"global"` but
  that scope-policy value isn't in the foundation contract yet; we
  ship gated to the master "Milesy Media" agency for now. The plugin
  is scope-tolerant: captures live in install storage and emit the
  install's `agencyId` in events.
- ActivityCategory `"public-funnel"` (vendored union appends;
  foundation `_registry.ts` will append at wire-up).
- `PluginRoleVisibility` is locally extended with `"lead"` so route
  gates compile; foundation will need the same union extension when
  `lead` lands in `Role` properly (T1 R023 already did this for
  the foundation side — chapter #127).
- No nav items, no admin pages — funnel is invisible UI; activity-
  inbox surfaces captures via events, BOS reads `me-context`.

## Domain

```ts
LeadCapture {
  id, source: "hc" | "tool" | "signup-card",
  leadUserId, email, capturedAt,
  sourceMeta: Record<string, unknown>,
  hcSlot?
}

HCSlot {
  slot?: number,                   // overall placement
  scores?: Record<string, number>, // per-axis
  answers?: Record<string, ...>,
  hcSchemaVersion?: string,
  [key: string]: unknown           // forward-compat tolerant
}

bucketHcSlot(slot): "early" | "growing" | "scaling" | undefined
  (1-2 → early · 3-4 → growing · 5+ → scaling)

canonEmail(raw): trim + lowercase    — idempotency key
isPlausibleEmail(raw): tolerant validator (has @, dot in domain, etc)
```

## Service surface

`FunnelService`:

- `captureHcCompletion({ email, slot, sourceMeta? })` — validates
  email, upserts lead via `LeadUserPort`, persists capture,
  emits `public-funnel.lead.captured` (ONLY when the lead is newly
  created), emits `public-funnel.hc.completed` (every time, with
  `bucket` derived from `slot.slot`), issues session via
  `SessionPort` if registered. Returns `{ capture, leadUserId,
  session?, created }`.
- `captureToolCompletion({ email, toolId, input?, output?, sourceMeta? })`
  — same shape, source `"tool"`. Emits `public-funnel.tool.completed`.
- `listByEmail(email)` — canonical-keyed lookup; case-insensitive +
  trimmed.
- `list({ source? })` — full index.
- `meContext(leadUserId)` — returns `{ leadUserId, email, hcSlot?,
  captures }` with `hcSlot` set to the MOST RECENT HC capture's slot
  and `captures` newest-first. Null when the lead has no captures.

## Idempotency contract

- Email is the idempotency key. `canonEmail` (trim + lowercase) is
  used both for the storage `captures/by-email/<email>` index and as
  the key handed to `LeadUserPort.upsertLeadByEmail`.
- A second HC submit from the same email REUSES the existing lead
  (no duplicate user), but persists a SECOND capture row — the
  journey is kept, not just the latest snapshot. Smoke #3 pins this.
- `public-funnel.lead.captured` fires ONLY on the first capture for
  a given email. `public-funnel.hc.completed` fires EVERY time
  (downstream consumers may dedupe by `captureId`). Smoke #4 + #5.

## Foundation ports

Two NEW ports beyond the standard `ActivityLogPort` + `EventBusPort`:

```ts
LeadUserPort {
  upsertLeadByEmail(email): { user: UserProfile; created: boolean }
}

SessionPort {
  issueSession(userId): string         // opaque token
}
```

Foundation wires these from T1 R023's lead path + T1's session
module. Both honoured async (Promise-or-direct return).

`SessionPort` is OPTIONAL — captures work without it (smoke #11), the
`session` field is just `undefined` and the response handler skips
the `Set-Cookie` header. Useful for testing or for environments
where BOS handles its own auth bridge.

## API surface

3 routes mounted at `/api/portal/public-funnel/`:

| Path | Method | Auth |
|---|---|---|
| `hc-complete` | POST | **public** (HC fetch from static page) |
| `tool-complete` | POST | **public** (Resources tools) |
| `me-context` | GET | signed-in (lead + agency staff) |

Public routes flagged `public: true` so the foundation route
dispatcher skips the session check. The handlers issue a
`Set-Cookie: aqua_session=...; Path=/; HttpOnly; SameSite=Lax`
header when `SessionPort` is wired so the browser is signed in
before it follows the `redirect: "/business-os"` JSON.

`me-context` is for BOS personalisation — it returns the most-recent
HC slot + capture history for `ctx.actor`. Out-of-scope viewers see
`{ context: null }`.

## Cookie + Set-Cookie shape

`aqua_session=<urlencoded session>; Path=/; HttpOnly; SameSite=Lax`

Foundation may upgrade to `Secure` + `Domain=…` at production
deploy. Cookie name mirrors T1's session module. The Set-Cookie is
emitted from the plugin handler (not the service), so the service
remains transport-agnostic.

## Smoke

`src/__smoke__/funnel.test.ts` — 13/13 pass via `tsx --test`. World
mocks all four ports (storage, activity, events, leadUsers, sessions);
`leadStore` is a `Map<email, UserProfile>` so the upsert returns the
same user on second call.

1. captureHcCompletion creates lead + capture + issues session.
2. invalid email shapes (`"nope"`, `"x@y"`, `"@example.com"`)
   rejected with `FunnelInputError`.
3. Idempotent on canonical email — second HC submit reuses lead;
   second capture row persisted; `created: false`.
4. `public-funnel.lead.captured` fires ONLY on first capture for
   a given email.
5. `public-funnel.hc.completed` fires EVERY time and carries the
   score bucket (`early`/`growing`/`scaling`).
6. captureToolCompletion stores `source: "tool"` + emits
   `public-funnel.tool.completed`.
7. tool capture rejects empty `toolId`.
8. `listByEmail` is canonical (case-insensitive + trimmed).
9. `meContext` returns most-recent HC slot + ALL captures
   newest-first.
10. `meContext` returns `null` for unknown lead user id.
11. Without SessionPort, capture still succeeds; `session: undefined`.
12. Activity entries use category `"public-funnel"` with
    `public-funnel.*` prefix.
13. Canonical email keys are case-insensitive + trimmed.

`tsc --noEmit` clean.

## HC integration (T4 territory — read-only here)

The static `public/health-check/` already POSTs to a configurable
endpoint on completion. T4's responsibility on wire-up day:

1. Point the HC config at `POST /api/portal/public-funnel/hc-complete`.
2. HC body shape: `{ email, slot: HCSlot }` — the `slot` payload is
   passed through whole, so HC can keep its existing `slot` shape
   without coordination.
3. On success the JSON body is `{ ok: true, redirect: "/business-os",
   leadUserId, created }` and a `Set-Cookie` is set; HC redirects
   client-side to `redirect`.

This plugin does NOT touch HC source. HARD BOUNDARY honoured.

## Foundation pending (standard 5-step + extras)

1. Workspace dep `@aqua/plugin-public-funnel`.
2. `transpilePackages` += `@aqua/plugin-public-funnel`.
3. Side-effect import calling `registerFunnelFoundation` at boot.
4. `_registry.ts` append.
5. `ActivityCategory` += `"public-funnel"` in foundation.
6. **NEW** `LeadUserPort` adapter wrapping T1 R023's `createUser`
   path (lead-role aware; idempotent on email).
7. **NEW** `SessionPort` adapter wrapping T1's session-issue path.
8. **NEW** `Role` union → add `"lead"` to `PluginRoleVisibility` in
   the foundation contract (the plugin already vendors it locally).
9. Catch-all dispatcher honours `public: true` for the two completion
   routes (shared item with memberships R4 webhook + forms R9).

## NOT in scope (R+1)

- BOS auth gate (R022 next — wraps `/business-os/*` with a
  signed-in-only check that reads from this plugin's lead state).
- rank-my-website tool (R023 / Sprint 2).
- Lead → paying-customer upgrade flow (post-ship).
- Admin lead-board UI (Sprint 2 once leads start arriving).

## R1 commit

T2 R021 single commit. After R021 T2 has shipped 17 plugins.
