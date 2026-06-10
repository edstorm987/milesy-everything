# Chapter 148 — public-funnel + BOS port adapters + dispatcher public:true (T1 R032)

T2 R021 (chapter #132) public-funnel and R022 (chapter #137) BOS gate
both flagged foundation pending. This round wires the three foundation
ports + the dispatcher's `public: true` route flag + promotes
ActivityCategory entries.

## Goal A — `LeadUserPort.upsertLeadByEmail`

NEW `src/plugins/foundation-adapters/leadFunnelPorts.ts` exports
`leadUserPort`:

```ts
async upsertLeadByEmail(email): Promise<{user, created}>
```

Idempotent on email (case-insensitive normalisation). Calls
`getUser(norm)` first; on existing returns `{user, created: false}`.
On miss: random scrypt-validated password (24 random bytes
base64url; long enough for `validatePassword`) + `createUser({role:
"lead", agencyId: LEAD_AGENCY_ID, name: <email-local>})` per chapter
#127's lead contract. Returns `{user, created: true}`.

The plugin caller layers its own activity log entry via the
`ActivityLogPort` — this adapter stays focused on user creation.

## Goal B — `SessionPort.issueSession`

`sessionPort.issueSession(userId)` looks up the user by id (walks
`state.users` — fine for low lead volume; R+1 wires a proper
users-by-id index) and calls foundation `issueSession({userId,
email, role, agencyId, sessionRev})`. Returns the opaque token
string the plugin sets on its response.

## Goal C — `FunnelMePort.getMeContextByUserId`

`funnelMePort.getMeContextByUserId(userId)` — BOS gate's `me` endpoint
calls this to populate `hcSlot` + `capturedAt`. Today the
public-funnel plugin doesn't expose a container service from the
foundation, so v1 returns:

```ts
{ leadUserId, email, hcSlot: undefined, capturedAt: u.createdAt }
```

Honest skeleton — chapter #137 §me payload tolerates undefined
`hcSlot` (BOS falls back to localStorage shape). Returns `null` when
the user is missing or not a `lead`. R+1 reads from the public-funnel
plugin's storage rows once the foundation gets a container resolver
for plugin storage.

## Goal D — Dispatcher `public: true`

`PluginApiRoute` (in `src/plugins/_types.ts`) now carries optional
`public?: boolean`. Use cases documented in the type comment:
public-funnel HC submit, rank-my-website diagnostic run + capture,
memberships webhooks, Stripe webhooks, forms public-submit, support
form submissions.

Dispatcher (`src/app/api/portal/[plugin]/[...rest]/route.ts`) flow:

1. Peek the route at the URL/header-supplied agencyId (no session).
2. If `peeked.route.public === true`, skip `requireSession`.
3. Otherwise call `requireSession` + the existing role/scope checks.
4. Build `PluginCtx` with `actor: session?.userId ?? "anonymous"`.
5. Public routes get the same install + storage + foundation
   services container; the route handler is responsible for any
   HMAC / capture / per-tenant verification.

For client-* role validation (preventing cross-tenant reads), the
check only fires when a session exists — public routes can't
attempt cross-tenant access since they don't carry a session.

The non-public route flow is unchanged in behaviour: existing
sessioned plugin routes continue to require a session and pass
their role/feature gates.

## Goal E — `PluginRoleVisibility` covers `lead`

T2 R021 locally extended its `Role[]` to include `"lead"`. R023 (T1)
landed `lead` in the foundation `Role` union. `PluginApiRoute.visibleToRoles?: Role[]`
inherits this — no manifest change needed. Plugins that want to
explicitly include lead-visible routes just list `"lead"` in their
`visibleToRoles`. Today only public-funnel + bos-auth-gate do.

## Goal F — ActivityCategory promotion

`types.ts ActivityCategory` union extended with:

- `"public-funnel"` (T2 R021)
- `"bos-auth-gate"` (T2 R022)

Other R+1-flagged categories from prior plugins (`payroll`,
`integrations`, `feedback`, `reports`, `onboarding`, `team-resources`,
`files`, `resources`, `support`) deferred to R033 batch.

## Goal G — Smoke

NEW `scripts/smoke-public-funnel-port-adapters.test.ts` (run via
`npm run smoke:public-funnel-port-adapters`, 11/11 pass, ~0.8s).

Four suites, source-marker style (server-only ripples through):

- **`public: true` route flag** (5) — PluginApiRoute carries
  optional `public?: boolean`; dispatcher peeks route + skips
  `requireSession` when public; reads agencyId from URL/headers;
  PluginCtx actor falls back to `"anonymous"`; non-public route
  still requires session.
- **leadFunnelPorts.ts** (4) — file exists + 3 port exports;
  upsertLeadByEmail idempotent (`getUser` check + `created` flag);
  SessionPort wraps foundationIssueSession; FunnelMePort returns
  null for non-lead.
- **ActivityCategory** (1) — union includes public-funnel +
  bos-auth-gate.
- **Role union** (1) — Role already includes `"lead"`;
  PluginApiRoute.visibleToRoles is `Role[]`.

## NOT in scope

- Promoting `scopePolicy: "global"` (T2 R021 noted this isn't in
  the foundation contract yet — separate larger round if/when needed).
- Lead-to-paying-customer upgrade flow (post-ship).
- Wiring the three port adapters into the plugin runtime container
  (foundation has no container resolver for plugin-injected ports
  today; the adapters are exported from `foundation-adapters/` and
  the plugin runtime can consume them once the container layer
  lands — R+1 / R033).
- Reading the public-funnel plugin's storage rows for `hcSlot` /
  `capturedAt` (R+1; v1 returns honest skeleton).

## Q-ASSUMED

- **`public: true` peek-then-resolve pattern**: dispatcher needs to
  know whether session is required before requiring it; peeking
  early without a session means agency must come from URL/headers.
  Plugins flagging routes `public: true` MUST accept `?agencyId=`
  or `x-aqua-agency-id` header (or default to a known sentinel).
- **`actor: "anonymous"` for public routes**: PluginCtx requires
  an actor; anonymous public submitters get the literal string. The
  plugin route handler can resolve the real actor (post-capture)
  via its own session-issue path.
- **LeadUserPort uses random password**: leads authenticate via
  magic-link / session re-issue, not password. createUser still
  validates password length, so we generate a random secret.
  Password path stays effectively closed.
- **SessionPort walks state.users for id lookup**: low lead volume.
  R+1 wires a proper users-by-id index across the foundation.
- **FunnelMePort returns honest skeleton for hcSlot**: chapter #137
  §me payload tolerates undefined. R+1 reads from public-funnel
  plugin storage once the foundation has a container resolver for
  plugin-injected services.
- **Adapters export but don't auto-wire**: foundation has no
  container resolver for plugin-injected ports. Plugin runtime
  R+1 will consume `leadUserPort` / `sessionPort` / `funnelMePort`
  via that future layer. Today the exports are ready — the code
  compiles, smoke pins the contract, wire-up is a one-line change
  per port at the plugin runtime layer.
- **ActivityCategory batched promotion deferred to R033**: only the
  two ports' categories land here. R033 sweeps the rest.
- **Role union already covers lead**: R023 landed it; this round
  doesn't re-extend.
