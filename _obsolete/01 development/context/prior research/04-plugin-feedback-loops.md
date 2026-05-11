# `@aqua/plugin-feedback-loops` — T2 R020

Lightweight customer-feedback collection. NPS-style 1-10 pulses with
optional comment + freeform testimonial requests. Customer-side
prompts, agency-side voice-of-the-client feed, detractor triage events.

## Manifest

- `id: "feedback-loops"`, `version: "0.1.0"`, `status: "alpha"`,
  `category: "ops"`.
- `scopePolicy: "client"`, `core: false`, no required deps.
- ActivityCategory `"feedback"` (vendored union appends; foundation
  `_registry.ts` will append at wire-up).
- Two storefront block descriptors: `pulse-prompt` + `testimonial-prompt`
  (T3 owns rendering).
- Two settings: `defaultPulseCadenceDays` + `detractorCutoff`.
- Four feature flags: `pulse`, `testimonials`, `detractor-events`,
  `customer-blocks`.

## Domain

```ts
Pulse {
  id, agencyId, clientId,
  sentAt, respondent /* email */,
  score?, comment?, respondedAt?,    // undefined while outstanding
  detractorEmittedAt?,               // latched on FIRST response
  createdBy?
}

TestimonialRequest {
  id, agencyId, clientId,
  prompt, respondent /* email */,
  status: "pending" | "replied" | "approved" | "public",
  reply?, repliedAt?, approvedAt?, publishedAt?,
  createdBy?, createdAt, updatedAt
}
```

`TESTIMONIAL_TRANSITIONS`:
- `pending → replied`
- `replied → approved | pending` (re-request collapses back to pending)
- `approved → public | replied` (demote allowed)
- `public → approved` (unpublish, still kept)

Constants: `DETRACTOR_CUTOFF = 6` (strictly below = detractor),
`PROMOTER_CUTOFF = 8` (>= = promoter).

## Honesty contract (chapter #68)

- Scores are stored as-given; later edits do NOT mutate the original.
- The `feedback.pulse.received` activity entry + event are emitted on
  the FIRST response only — re-edits are silent.
- Detractor flag (`detractorEmittedAt`) is one-shot: latched on first
  response; later score changes do NOT clear it and do NOT re-emit.
  Rationale: the moment of truth is the customer's first signal; the
  agency's read of "we had a detractor moment" stays in the record.
- `summary.responseRate` is raw `responded / sent`; no rounding to a
  prettier number.

## Service surface

`PulseService`:

- `list({ responded?, respondent? })` — `responded: true` only closed,
  `false` only outstanding. Sorted by `sentAt` desc.
- `get(id)` — tenant-scoped null.
- `send(actor, { respondent, comment?, sentAt? })` — emits
  `feedback.pulse.sent`. Rejects respondent without `@`.
- `respond(id, { score, comment?, respondedAt? })` — score must be
  integer 1..10. On first response: emits `feedback.pulse.received`,
  and if `score < DETRACTOR_CUTOFF` also latches
  `detractorEmittedAt` + emits `feedback.detractor` (high-severity
  for activity-inbox triage).
- `summary(refNow?)` — computes `totalSent`, `totalResponded`,
  `responseRate`, `avgScore` (undefined when no responses),
  `detractors` / `passives` / `promoters`, and a 12-month trailing
  `byMonth` trendline (descending).

`TestimonialService`:

- `list({ status?, publicOnly? })` — `publicOnly` hides everything
  except `status === "public"`.
- `get(id)`.
- `request(actor, { prompt, respondent })` — stamps `pending`. Emits
  `feedback.testimonial.requested`.
- `reply(id, { reply, repliedAt? })` — pending-only; throws
  `InvalidTestimonialTransitionError` on any other status.
- `transition(actor, id, to)` — generic state-machine guard.
- `approve` / `markPublic` — convenience on top of transition.
- `delete(actor, id)` — hard-removes + de-indexes.

## API surface

9 routes mounted at `/api/portal/feedback-loops/`:

| Path | Method | Roles |
|---|---|---|
| `pulses` | GET | admins |
| `pulses/send` | POST | admins |
| `pulses/respond` | POST | viewers (incl. end-customer) |
| `testimonials` | GET | admins |
| `testimonials/request` | POST | admins |
| `testimonials/reply` | POST | viewers |
| `testimonials/approve` | POST | admins |
| `testimonials/public` | POST | admins |
| `testimonials/delete` | DELETE | admins |

Customer-facing routes (`pulses/respond` + `testimonials/reply`) are
viewer-scoped so end-customers can submit without an admin role.

## Pages

- `PulseDashboardPage` (`""`) — stat strip (sent / responded% / avg /
  detractors with red flag) + recent pulses list. data-* hooks per row.
- `TestimonialInboxPage` (`"testimonials"`) — four-status grouped
  inbox.
- `PulsePromptCustomerPage` (`"pulse"`) — `data-block="pulse-prompt"`
  surface; surfaces the most recent outstanding pulse for the viewer
  with a 1-10 slider + comment textarea, or an empty state.
- `TestimonialPromptCustomerPage` (`"testimonial"`) —
  `data-block="testimonial-prompt"` surface; most recent pending
  testimonial request with a textarea + reply button, or empty state.

## Events

```
feedback.pulse.sent
feedback.pulse.received          (first response only)
feedback.detractor               (first response, score < 6, severity high)
feedback.testimonial.requested
feedback.testimonial.replied
feedback.testimonial.approved
feedback.testimonial.public
feedback.testimonial.deleted
```

Activity-inbox should give `feedback.detractor` high-severity styling
(emit metadata `{ severity: "high" }`).

## Smoke

`src/__smoke__/feedback.test.ts` — 18/18 pass via `tsx --test`.

1. send pulse stores outstanding + emits `feedback.pulse.sent`.
2. send rejects respondent without `@`.
3. respond stamps score + respondedAt + emits `feedback.pulse.received`.
4. respond rejects 0 + 11; accepts 1 + 10.
5. detractor (score < 6) emits `feedback.detractor` + latches
   `detractorEmittedAt`; later edit upward does NOT re-emit and the
   latch stays (honesty contract).
6. promoter (score >= 8) does NOT emit detractor.
7. summary computes avg (7) / responseRate (0.8) / detractor / promoter
   / passive bands; `byMonth` length = 12.
8. summary with zero responses → `avgScore: undefined`, `responseRate: 0`.
9. `list({responded})` filters open vs closed.
10. testimonial request stores pending + emits requested event.
11. reply moves pending → replied + stamps reply/repliedAt.
12. reply on non-pending throws `InvalidTestimonialTransitionError`.
13. approve → public path stamps both timestamps + emits status events.
14. invalid transition pending → public throws.
15. `list({publicOnly})` hides pending/replied/approved.
16. delete removes + de-indexes; re-delete throws `FeedbackNotFoundError`.
17. Activity entries use category `"feedback"` with `feedback.*` prefix.
18. Tenant isolation — `client_other` sees nothing on shared storage.

`tsc --noEmit` clean.

## Foundation pending (standard 5-step + extras)

1. Workspace dep `@aqua/plugin-feedback-loops`.
2. `transpilePackages` += `@aqua/plugin-feedback-loops`.
3. Side-effect import calling `registerFeedbackFoundation`.
4. `_registry.ts` append.
5. `ActivityCategory` += `"feedback"` in foundation.
6. Activity-inbox triage rule: `feedback.detractor` shown with the
   high-severity styling (red border + bell).
7. T3: register renderers for storefront block ids `pulse-prompt` +
   `testimonial-prompt`.

## NOT in scope (R+1)

- Public testimonial wall surface (status `public` is tracked here so
  the wall ships nothing structural later).
- Sentiment analysis on comments.
- Auto-send pulse cadence — operator triggers manually in v1; cron
  job comes later.

## R1 commit

T2 R020 single commit. After R020 T2 has shipped 16 plugins.
