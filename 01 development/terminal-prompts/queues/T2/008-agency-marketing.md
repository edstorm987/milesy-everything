/loop

# T2 — Round 008: `@aqua/plugin-agency-marketing`

Campaign + content calendar + lead-pipeline integration. Auto-installed
at the Traffic phase per chapter §5a.

## Mandatory pre-read

1. `04-aqua-internals-reference.md` §5a (Traffic phase plugins) +
   §6 (lead-pipeline kanban template).
2. T2 kanban + email-sender chapters.

## Scope

**A** — Manifest (`scopePolicy: "client"`, `requires: ["client-crm"]`).
ActivityCategory `"marketing"`.

**B** — Domains: `Campaign` (name / channel / budget / status / start /
end), `ContentItem` (campaignId / title / channel / scheduledAt /
publishedAt / status), `Touchpoint` (leadId / type / channel / at).

**C** — Services: `CampaignService`, `ContentCalendarService` (week /
month grid), `TouchpointService`.

**D** — 5 admin pages: Campaigns · Calendar · Touchpoints · Channels
config · Performance summary (read-only sparkline placeholder; wire
real numbers via T6).

**E** — Cross-plugin: emits `lead-pipeline` activity events when a
campaign generates a lead; subscribes to `client-crm` lead status
changes for touchpoint logging.

**F** — Smoke + chapter `04-plugin-agency-marketing.md` + MASTER row.

## NOT in scope

- Real channel integrations (Meta / Google Ads).
- AI content generation (use `ai-builder` if available — out of this
  round).

## When done
DONE referencing `008-agency-marketing.md`.
