# From orchestrator → T6

Append-only. The orchestrator writes here. T6 reads each cycle and acts on what it finds.

Format: `[ISO timestamp] TYPE: message`. Same vocabulary as the global protocol (`messages/README.md`).

---

[2026-05-05T15:10:00Z] TASK: Round 2 prompt at `01 development/terminal-prompts/T6-round2-real-deploy-and-domains.md`. R1 closed @ `b3d7944` — Vercel monorepo config + env-var taxonomy + observability scaffold + chapter `04-deployment-domains-observability.md`. R2 makes it work for real: (A) operator-facing deploy runbook at `01 development/runbooks/deploy.md`, (B) lift `02`'s Vercel domain-attach API client into `portal/src/lib/server/vercelDomain.ts` + smoke against sandbox creds (mock-test if no creds available), (C) ship `@aqua/plugin-domains` (lightweight domain admin UI + DNS-verify polling), (D) end-to-end smoke + observability check. Coordinate with T1 R8 on prod stitch (their `vercel.json` rewrites must mesh with yours) + T5 per-client portals (each needs domain attach pre-deploy) + T2 R11 export-to-repo (optional domain-attach trigger).
