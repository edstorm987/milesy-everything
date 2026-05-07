/loop

# T2 — Round 027: `@aqua/plugin-leads-pipeline` — CSV import + email campaigns + contacts

Hand-in-hand with T1 R034 (Pipelines refactor). Once foundation has
multi-pipeline support, this plugin owns the **leads pipeline**
specifically — CSV upload, contact records, automated email campaigns.

Foundation pre-req: T1 R034 must DONE before T2 R027 can fully wire
up. If T2 reaches this round before T1 R034 archives, log Q-BLOCKED.

## Pre-read

- T1 R034 pipelines refactor (the `Pipeline` + `PipelineCard` types).
- T2 R024 SMTP outbound (email driver — this plugin produces messages
  email-sender drains).
- T2 R021 public-funnel (lead capture path — leads pipeline is the
  hand-off destination from HC + Resources tools).

## Scope

**A** — Manifest `id: "@aqua/plugin-leads-pipeline"`,
`scopePolicy: "agency"`, `core: false`. Auto-binds to the
`leads`-kind pipeline created by T1 R034 default seed.

**B** — Domain `Lead`: `{id, agencyId, email (canonical), name?,
phone?, company?, tags[], source, capturedAt, lastContactedAt?,
notes?}`. `LeadCard` projection for the kanban.

**C** — Domain `Contact` (broader than lead — anyone): same shape +
`type: "lead" | "customer" | "vendor"`. Leads convert to customers
when a Pipeline-card moves to a "Won" column.

**D** — CSV import:
- `POST /api/portal/leads-pipeline/import-csv` — multipart upload.
- Parser tolerates: header row autodetect, common column variants
  (`Email`/`email`/`E-mail`, `Phone`/`Mobile`/`tel`, etc.).
- Returns `{imported: N, skipped: N, errors: [{row, reason}]}`.
- Idempotent on `email` — re-uploading same CSV updates existing
  rows, doesn't duplicate.

**E** — Campaign domain `Campaign`: `{id, agencyId, name, subject,
bodyHtml, bodyText?, status: draft|scheduled|sending|sent, scheduleAt?,
audienceFilter, recipients: number, sentCount: number}`.

**F** — Audience filter: declarative — `{tags?: string[],
sourcedFrom?: string[], notContactedSinceMs?: number, pipelineColumn?:
string}`. Resolves to a `Lead[]` at send time.

**G** — Send pipeline: dispatcher walks audience → enqueues
EmailSender messages (T2 R024) → records `sentCount` per recipient
on the Lead row (`lastEmailedAt` on Contact). Rate-limit via
EmailSender's own queue.

**H** — Admin UI:
- `/portal/agency/pipelines/leads` — board view (pipeline cards).
- `/portal/agency/leads-pipeline/contacts` — CSV import + contact
  list with filter.
- `/portal/agency/leads-pipeline/campaigns` — list + new + send.

**I** — Cross-plugin: subscribes to `public-funnel.lead.captured`
→ creates Lead row + adds to leads-pipeline "New" column.

**J** — Smoke ≥18: CSV parse 5 column-variant cases + idempotent
re-import + Campaign.send happy path + audience filter resolution +
public-funnel subscriber + Lead→Contact promotion on Won column.

**K** — Chapter `04-plugin-leads-pipeline.md` + MASTER row.

## NOT in scope

- Drip-sequence campaigns / multi-step automation (R+1 — v1 is
  single-shot send).
- Tracking pixels / open-rate (R+1 needs SMTP webhook ingest).
- A/B testing campaigns (post-ship).
- Lead scoring (post-ship).

## When done
DONE referencing `027-leads-pipeline-csv-campaigns.md`.
