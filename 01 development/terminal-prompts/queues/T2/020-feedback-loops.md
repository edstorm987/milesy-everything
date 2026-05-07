/loop

# T2 — Round 020: `@aqua/plugin-feedback-loops`

Lightweight customer-feedback collection — NPS-style pulse + freeform
testimonial requests. Surfaces in customer portal; aggregates on agency
side as a "voice of the client" feed.

## Mandatory pre-read

1. T2 forms plugin (form-submission shape).
2. T2 activity-inbox (emit pattern).
3. Honesty contract chapter #68 (no fabricated scores).

## Scope

**A** — Manifest `scopePolicy: "client"`, ActivityCategory `"feedback"`.

**B** — Domains:
- `Pulse`: id, clientId, sentAt, score (1-10), comment?, respondedAt?,
  respondent (customerEmail).
- `TestimonialRequest`: id, clientId, prompt, status (pending / replied
  / approved / public), reply?, repliedAt?, approvedAt?.

**C** — Services: PulseService (send, list, summary — avg, response
rate, per-month trendline), TestimonialService (request, reply, approve,
markPublic).

**D** — Routes: pulses CRUD + responses · testimonials CRUD + approve.

**E** — Admin pages: Pulse dashboard (per-client + agency-wide
roll-up) · Testimonial inbox · Settings (default pulse cadence).

**F** — Customer-side blocks: `pulse-prompt` (1-10 slider + comment box)
+ `testimonial-prompt` (single textarea + reply button).

**G** — Emits `feedback.pulse.received` / `.testimonial.replied`
activity events; pulse score < 6 emits `feedback.detractor` (high
severity for activity-inbox triage).

**H** — Smoke + chapter `04-plugin-feedback-loops.md` + MASTER row.

## NOT in scope

- Public testimonial wall (R+1).
- Sentiment analysis (R+1).

## When done
DONE referencing `020-feedback-loops.md`.
