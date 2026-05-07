/loop

# T1 — Round 037: Leads-pipeline foundation glue (closes T2 R027 hooks)

T2 R027 (chapter #157) shipped `@aqua/plugin-leads-pipeline` end-to-
end, but flagged 5 foundation-side hooks that need T1 to wire so the
plugin actually mounts + receives events at boot. This round closes
all five.

## Pre-read

- Chapter #157 (T2 R027) §"Foundation pending (5-step)".
- Chapter #156 (T1 R034) — Pipeline + PipelineCard shape.
- Chapter #144 (T2 R024) — `@aqua/plugin-email-sender` `EmailService.enqueue` signature.
- T2 R027's exported adapter shape at
  `04-the-final-portal/plugins/leads-pipeline/src/server/foundationAdapter.ts`.
- Foundation `_registry.ts` + plugin runtime patterns.

## Scope

**A** — `ActivityCategory` enum extension: add `"leads"` to the union.
Single-line change in `src/server/types.ts`. Update activity chip
styling map (chapter #153 R033 helper).

**B** — Workspace dep + transpilePackages registration:
- Add `@aqua/plugin-leads-pipeline` to `milesymedia-website/package.json`
  workspace dependencies (or transpilePackages in next.config.ts —
  match T2 R024 / R025 / R026 pattern).
- Side-effect import in `_registry.ts`:
  `import { registerLeadsPipelineFoundation } from "@aqua/plugin-leads-pipeline/foundationAdapter"`.
- Append manifest to `_registry.ts` plugins array.

**C** — `EmailEnqueuePort` adapter onto email-sender:
- New foundation port `src/lib/server/leadsPipelinePorts.ts` exports
  `emailEnqueuePort`. Implements `EmailEnqueuePort.enqueue` by
  calling `email-sender` plugin's `EmailService.enqueue` via the
  plugin runtime container. Forwards `triggeredByPlugin` +
  `externalRef` verbatim. Default identity from email-sender.
- Wire into `registerLeadsPipelineFoundation({emailEnqueuePort, ...})`.

**D** — `PipelinePort` adapter onto R034 pipelines.ts:
- Same `leadsPipelinePorts.ts` exports `pipelinePort`. Implements:
  - `addLeadCard(agencyId, leadSnapshot)` → calls
    `getPipelineBySlug(agencyId, "leads")?.id` then `addCard({pipelineId,
    kind:"lead", snapshot})`.
  - `leadIdsInColumn(agencyId, columnLabel)` → walks
    `listCardsByAgency` filtering by column label, projects
    `.snapshot.leadId` (or however T2 stamped it).
  - `columnLabelForLead(agencyId, leadId)` → reverse lookup.
- Wire into `registerLeadsPipelineFoundation({pipelinePort, ...})`.

**E** — Event-bus subscription wiring:
- Foundation reads
  `import { EVENT_SUBSCRIPTIONS, handleFunnelLeadCaptured,
   handlePipelineCardMoved } from "@aqua/plugin-leads-pipeline"`.
- At boot (or first plugin install), bind `events.on(name, handler)`
  for each entry in `EVENT_SUBSCRIPTIONS`.
- Ensure T1 R034 `pipelines.ts` emits `pipelines.card.moved` with
  payload `{cardKind, cardId, fromColumn, toColumn, agencyId}` per
  card-move mutation. Add the emit if missing — single-line in the
  card-move helper.

**F** — Smoke `§ Leads-pipeline foundation glue` (≥10):
- ActivityCategory union includes "leads".
- Chip styling map resolves "leads" without throwing.
- `_registry.ts` lists `@aqua/plugin-leads-pipeline`.
- `emailEnqueuePort.enqueue` forwards triggeredByPlugin + externalRef.
- `pipelinePort.addLeadCard` lands on the leads pipeline's first
  column (default "New").
- Event-bus subscription from EVENT_SUBSCRIPTIONS array fires
  registered handler.
- `pipelines.card.moved` emits on a card move.

**G** — Chapter `04-leads-pipeline-foundation-glue.md` + MASTER row +
tasks.md tick.

## NOT in scope

- Real GA4 / SMTP transport beyond what's already wired in R024/R026.
- Editor UI for campaign composer (R+1 plugin work).
- Drip sequence campaigns (R+1).

## When done
DONE referencing `037-leads-pipeline-foundation-glue.md`. After this
round the leads pipeline is fully alive end-to-end (plugin + foundation
wires + pipeline-card flow + email-send queue).
