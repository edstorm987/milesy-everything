# Email-sender plugin foundation registration (T1)

Closes Gap #3 from chapter #161 — `@aqua/plugin-email-sender` was
shipped by T2 R024 (chapter #144) with `EmailService.enqueue` driving
Postmark/SMTP/Sendgrid/no-op drivers, but it was never registered into
the foundation runtime in `milesymedia-website/src/plugins/_registry.ts`.
Two consumers depended on it:

- chapter #157 leads-pipeline campaign sender (via
  `emailEnqueuePort` in `src/lib/server/leadsPipelinePorts.ts`).
- chapter #160 forgotten-password route
  (`/api/auth/password/request-reset`) — same port, used opportunistically.

Both throw `[leads-pipeline.emailEnqueuePort] email-sender foundation
not registered (foundation-pending)` until this round lands. After this
round the throw is gone and real driver send is gated only by per-agency
provider configuration (Postmark API key, SMTP creds — operator action).

## Files shipped

- `milesymedia-website/package.json` — workspace dep
  `@aqua/plugin-email-sender: file:../plugins/email-sender` between
  `@aqua/plugin-ecommerce` and `@aqua/plugin-fulfillment`. New
  `smoke:email-sender-foundation` script.
- `milesymedia-website/next.config.ts` — `transpilePackages` adds
  `"@aqua/plugin-email-sender"` (alphabetical between ecommerce and
  fulfillment).
- NEW `milesymedia-website/src/plugins/foundation-adapters/emailSenderFoundation.ts`
  — mirrors the publicFunnel + leadsPipeline shape: `let registered`
  flag + `ensureEmailSenderFoundationRegistered()` exported function +
  boot side-effect call at module bottom. Wraps `getAgency` from
  `@/server/tenants` to satisfy the plugin's narrower TenantPort shape
  (the plugin uses `{ getAgency }`, the shared `_foundationPorts.tenantPort`
  uses `{ getClient, getClientForAgency }`). Passes `activityPort`,
  `eventBusPort`, `pluginInstallStorePort` from `_foundationPorts.ts`
  unchanged. `marketingTemplates` intentionally omitted — agency-marketing's
  template store will land in a future cross-plugin wiring round.
  `drivers` not injected — the plugin's `defaultDriverRegistry()` ships
  Postmark + no-op + sendgrid/resend/smtp stubs, which is the correct
  default; production providers are configured per-agency via the
  plugin's Settings page.
- `milesymedia-website/src/plugins/_registry.ts` — manifest import
  `import emailSenderManifest from "@aqua/plugin-email-sender"` +
  PLUGINS array entry + side-effect import of the new adapter file
  placed BEFORE `leadsPipelineFoundation` so leads-pipeline's
  `emailEnqueuePort` lookup of `isFoundationRegistered()` returns true
  by the time its own adapter binds. Comment in registry calls out the
  ordering constraint.
- NEW `milesymedia-website/scripts/smoke-email-sender-foundation.test.ts`
  — 8/8 pass via `npm run smoke:email-sender-foundation` (~1.2s, tsx
  --test). 6 source-marker tests + 2 runtime tests:
  - manifest import + PLUGINS entry in `_registry.ts`
  - side-effect import is BEFORE `leadsPipelineFoundation` (string-index
    comparison)
  - `next.config.ts` transpilePackages contains the package
  - `package.json` workspace dep `file:../plugins/email-sender`
  - adapter source calls `registerEmailSenderFoundation` with all four
    shared ports
  - runtime: `isFoundationRegistered()` true after side-effect import
    (createRequire, CJS graph — same as leads-pipeline smoke)
  - runtime: `emailEnqueuePort.enqueue` against a non-existent agency
    no longer surfaces "foundation pending" — it now reaches the
    `not installed for agency` guard (=== progress; fixture-free, no
    real Postmark dependency).

## tsx ESM/CJS dual-graph (revisit of chapter #158 gotcha)

`emailSenderFoundation.ts` carries `import "server-only"` so tsx routes
it through CJS. The CJS-graph copy of `@aqua/plugin-email-sender/server`
is registered. But `leadsPipelinePorts.ts` invokes
`await import("@aqua/plugin-email-sender/server" as any)` which under
tsx resolves on the ESM graph — a separate module instance whose
`registered` symbol is `null`. The smoke handles this by registering
the foundation a second time on the ESM graph in the `before()` hook;
production Next.js is single-graph so this is smoke-only plumbing
(same pattern documented in chapter #158).

## Q-ASSUMED

- Drivers not injected — the plugin's `defaultDriverRegistry()` is the
  correct production default. Real Postmark/SMTP/Sendgrid credentials
  are operator action, configured per-agency on the plugin's Settings
  page; until configured the agency runs against the no-op driver.
- `marketingTemplates` left undefined — agency-marketing exposes its
  own template store via its plugin foundation; cross-plugin wiring
  to email-sender lands in a future round (foundation R6 router).
  Without it, `enqueue` with a `templateId` throws cleanly; templateless
  enqueues (the password-reset + leads-pipeline cases today) work.
- Tenant port wraps just `{ getAgency }` — the plugin doesn't need
  client-scoped tenant lookups. Cast bridges TypeScript variance.
- Side-effect import order: email-sender BEFORE leads-pipeline. The
  registry comment documents the dependency.

## NOT in scope (R+1)

- Wiring `marketingTemplates` from agency-marketing into email-sender
  (cross-plugin port glue).
- Per-agency Postmark webhook secret bootstrap during install
  (operator-set today).
- Operator runbook entry for "real Postmark setup" — covered by the
  plugin's Settings page text already.
- Closing chapter #161 Gap #2 (leads-pipeline manifest id rename) and
  Gap #4 (funnelMePort hcSlot resolver). Separate rounds.

## What now works that didn't before

- `/api/auth/password/request-reset` (chapter #160) attempts a real
  email send when an agency has a Postmark/SMTP provider configured;
  in dev-without-creds it still falls through to the
  `devResetUrl` console log (same UX as before).
- Leads-pipeline campaign sender (chapter #157) calls
  `EmailService.enqueue` and gets a queued message id back instead of
  the foundation-pending throw + `failed` outbox row.
- Any future foundation route can call into email-sender via
  `containerFor({ agencyId, storage, install })` without registration
  drift.
