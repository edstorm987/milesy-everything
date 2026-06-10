/loop

# T1 — Round 022: Role-aware post-login redirect (WS-A R022)

Today every successful `/login` lands on `/portal/agency` regardless of
role. Wire the redirect to read `effectiveRole(session)` and route per
audience.

Plan reference: chapter #124 `04-ship-plan-v1.md` WS-A.

## Mandatory pre-read

- Chapter #121 unified vision (single-host architecture).
- Chapter #117 signup flow + R009 magic-link login routing.
- Existing `effectiveRole` resolver + R007 role grid.

## Scope

**A** — Post-login redirect resolver. NEW
`src/lib/server/postLoginRedirect.ts` exports
`resolvePostLoginPath(session, user): string` returning:
- `agency-owner` / `agency-team` → `/portal/agency`
- `client-owner` / `client-staff` → `/portal/clients/<their-slug>`
  (resolve from the user's `clientId`, fallback to `/portal/agency` if
  the client has been deleted)
- `end-customer` → `/portal/customer`
- `lead` → `/business-os` (R023 lands the role; this resolver returns
  the path before the role exists — defensive ok)

**B** — Wire `/api/auth/login` (POST) + `/api/auth/magic-link/verify`
+ `/api/auth/signup` (POST) responses to use the resolver. Today they
hardcode `/portal/agency`.

**C** — `LoginForm.tsx` accepts the resolved redirect from the API
response body (already does for some paths) and routes the browser.

**D** — `/dev/pov` route handler (chapter #123) already issues
per-persona session cookies; ensure each persona's redirect uses the
same resolver so the four personas land where production users would.

**E** — Smoke `§ Post-login redirect` (≥6 cases — each role's path +
client-owner with deleted client fallback + lead before role exists).

**F** — Chapter `04-post-login-redirect.md` + MASTER row.

## NOT in scope

- Adding the `lead` role itself (R023).
- Cross-tab sign-in propagation (R+1).

## When done
DONE referencing `022-role-aware-redirect.md`.
