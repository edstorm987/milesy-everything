/loop

# T6 — Round 004: Custom domain attachment — activate `@aqua/plugin-domains`

`@aqua/plugin-domains` is scaffolded but not wired (chapter #50 +
T2 R011 skeleton). T6 activates it: real Vercel REST API calls,
DNS-record viewer, status state machine wiring. Required for first
real client (Felicia at luvandker.com) and future niche-agency
satellites.

## Pre-read

- T2 R011 agency-domains chapter (skeleton state).
- `runbooks/deploy.md` §6 custom-domain runbook (T6 R001 rewrote).
- Vercel REST API docs (`POST /v9/projects/<id>/domains`).
- `scripts/attach-domain.mjs` if exists (existing CLI path).

## Scope

**A** — Wire VercelDomainPort adapter inside the domains plugin
(reads `VERCEL_TOKEN` + optional `VERCEL_TEAM_ID` from env via
secrets.ts from R029): create / list / verify / remove.

**B** — Status state machine (already in skeleton):
intent → configured → verified | failed. Verify polling: 30s
intervals up to 5min, then stop + show "Re-check verify" button.

**C** — Per-client portal projects: when T5 ships per-client portal
at `clients/<slug>/`, that's a SEPARATE Vercel project. Domains
plugin operates against the project ID stored on the
`pluginInstalls[*].config`.

**D** — Without `VERCEL_TOKEN`: plugin records hostname locally + UI
shows "Operator action needed: vercel domains add <hostname>"
manual-DNS path (existing pattern from runbook §6d).

**E** — Smoke `§ Domain attach` (≥10 — token-present happy path
mocked + token-missing manual path + verify polling shape + state
machine transitions + DNS records returned + remove path).

**F** — Chapter `04-domain-attachment-activated.md` + MASTER row.

## NOT in scope

- Cloudflare / Namecheap DNS automation (post-ship).
- Wildcard / multi-level subdomains (post-ship).
- Domain transfers / registrar integration (post-ship).

## When done
DONE referencing `004-domain-attachment.md`.
