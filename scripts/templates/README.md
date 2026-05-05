# Templates

One-off file templates the deploy + plugin tooling pulls from.

## `client-vercel.json`

Drop into `04 the final portal/clients/<slug>/vercel.json` when T2 R11's
"Export to repo" generator materializes a new per-Live-client portal.
Each per-client portal is a SEPARATE Vercel project — its rootDirectory
should be set to `04 the final portal/clients/<slug>/` in the Vercel
dashboard (one-time setup per client).

The template assumes:

- The client folder is itself a Next.js app (already true for
  `clients/felicias perfect portal/` reference).
- Workspace plugin deps (`@aqua/plugin-*`) resolve via `file:..` — the
  `installCommand: echo …` + `buildCommand: npm install && npm run build`
  pattern runs install AT cwd so file: paths are relative to the client
  folder, NOT Vercel's auto-inferred install dir.
- Custom domain attached via the @aqua/plugin-domains runbook
  (chapter `04-deployment-domains-observability.md` §"Custom domain
  runbook"), against the per-client Vercel project.

Env vars required at the per-client project — see
`04 the final portal/clients/_TEMPLATE.env.example` (also produced by
T2 R11).
