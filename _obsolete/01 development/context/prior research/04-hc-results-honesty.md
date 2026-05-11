# 04 · HC results honesty contract

Author: T4
Triggering prompt (Ed, 2026-05-07): *"make the results not be bs in the form if i havent answered any questions … youve not pulled from google trends or search console so how do you know anything? the data must be real btw."*

## The ruling

Every number on the HC results page is either:
1. **Derived honestly from the user's actual answers**, or
2. **Marked as unknown (`—`)** with an explicit hint about how to fill it.

There is no fallback to fabricated averages. Range > point estimate. Confidence is shown.

## What the page does in each state

### No-data (skip-to-results with zero answers)

- Headline: *"We don't know enough about you yet."*
- Sub: *"Skip-to-results without answering anything is honest — but useless. Pick a topic and answer at least one question, even if just the easy one. Your numbers will be your numbers — not made-up averages."*
- Leak cards: all `—`.
- Quick wins: empty state — *"Quick wins are computed from your answers."*
- Section nav: every topic shown as a "Start →" card.
- Transparency block: hidden.

### Partial / full coverage

Money headline is a **range, not a point**:

```
headroom    = (100 - overall_score) / 100        // 0 .. 1
confidence  = topics_answered / 5                 // 0.2 .. 1.0
low monthly  = round(headroom × confidence × 1500 / 100) × 100   // £100 step
high monthly = round(headroom × confidence × 5000 / 100) × 100
```

Sub-line: *"Range based on N/5 topics answered (confidence: ~X%). These are **self-reported answers**, not pulled from your live data. To make this real, see 'How we got this' below."*

If both bounds are 0 (perfect scores), headline switches to *"You're ahead of most of the businesses we audit."*

### Per-topic leak cards

Three cards on the page (visibility / website score / channel concentration). Each only renders a real number when the corresponding topic was answered (`seo`, `site`, `flow`). Otherwise `—` with a *"Answer the X topic to fill this."* hint and the label re-purposed to describe what's missing.

### Transparency block (always present when there's any data)

Two expandable details, collapsed by default:

1. **🧮 How we got this number** — plain-English breakdown of the three inputs (headroom, confidence, sector benchmark).
2. **🔌 What we'd verify against — for the real version** — six connector cards naming the real-data sources for a Pro audit:
   - Google Search Console (impressions, clicks, ranks, queries)
   - Google Business Profile Insights (direction requests, calls, map vs search)
   - Lighthouse / PageSpeed (perf/SEO/a11y, LCP/CLS/INP)
   - GA4 / server-side events (conversion rates, attribution, drop-offs)
   - Stripe / QuickBooks (real revenue, MRR, refunds, LTV)
   - SERP rank tracker — DataForSEO / Ahrefs

Footer: *"Free tier: self-report only. Pro/audit tier: we run these connectors against your real accounts and replace every estimate with a measurement."* Links to `/business-os app/marketplace.html`.

## Not done yet (parking)

- Real connectors are not wired. The transparency block names them; bringing one in requires a Vercel Edge function (Lighthouse via PageSpeed Insights API is the cheapest entry — free, no OAuth).
- Quick wins still come from the in-source `quickwins(slot)` lookups per area in `lead magnet app/hc-questions.js`. They tag-fire on specific answers — they're not fabricated — but blog URLs they link to are placeholder slugs (`milesymedia.co/blog/...`). Either ship those posts or repoint at BOS modules.

## Files touched

- `04-the-final-portal/milesymedia website/lead magnet app/index.html` — `buildResults()` rewrite
- `04-the-final-portal/milesymedia website/lead magnet app/styles.css` — transparency block styling
