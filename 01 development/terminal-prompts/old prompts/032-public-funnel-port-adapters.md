/loop

# T1 — Round 032: public-funnel + BOS port adapters + dispatcher public:true

T2 R021 (chapter #132) public-funnel and R022 (chapter #137) BOS gate
both flagged foundation pending: LeadUserPort + SessionPort + FunnelMePort
adapters + plugin dispatcher honouring `public:true` route flag. This
round wires all three.

## Pre-read

- Chapter #132 (T2 R021) §"E TWO NEW foundation ports" — exact
  port shapes.
- Chapter #137 (T2 R022) §"E NEW FunnelMePort port" — third port.
- T1 R023 lead role + `createUser` path that LeadUserPort wraps.
- Plugin dispatcher / route-handler middleware.

## Scope

**A** — `LeadUserPort.upsertLeadByEmail({email, sourceMeta?})`
adapter: idempotent on email; calls `createUser({role:"lead", email,
agencyIds: [LEAD_AGENCY_ID]})` first time, returns existing user
otherwise. Registered into the public-funnel plugin's port registry.

**B** — `SessionPort.issueSession({user})` adapter: wraps T1's
existing session-issue path; returns the cookie payload + value the
plugin sets on its response.

**C** — `FunnelMePort.getMeContext({userId})` adapter: the BOS gate
plugin (R022) calls this to populate `hcSlot` + `capturedAt` for
its `me` endpoint. Adapter routes to public-funnel plugin's
`meContext` service.

**D** — Plugin route dispatcher: routes flagged `public: true` skip
the session-required pre-check. (T2 R021 chose this flag explicitly
since HC submits as anonymous visitor.) Default behaviour unchanged
for non-flagged routes.

**E** — `PluginRoleVisibility` extends to include `"lead"` (T2 R021
locally extended; promote to foundation for global use).

**F** — ActivityCategory enum gains `"public-funnel"` (T2 R021),
`"bos-auth-gate"` (T2 R022). Other R+1-flagged categories from prior
plugins (`payroll`, `integrations`, `feedback`, `reports`,
`onboarding`, `team-resources`, `files`, `resources`, `support`) get
batched in R033.

**G** — Smoke `§ Foundation public-funnel adapters` (≥10 — port
registry resolves; LeadUserPort idempotent; SessionPort issues
cookie; FunnelMePort returns context; public:true bypasses session;
non-public route still requires session; lead role visible to
plugin-route gates).

**H** — Chapter `04-public-funnel-port-adapters.md` + MASTER row.

## NOT in scope

- Promoting `scopePolicy: "global"` (T2 R021 noted this isn't in
  the foundation contract yet — separate larger round if/when needed).
- Lead-to-paying-customer upgrade flow (post-ship).

## When done
DONE referencing `032-public-funnel-port-adapters.md`.
