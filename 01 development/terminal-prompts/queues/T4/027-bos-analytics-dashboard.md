/loop

# T4 — Round 027: Per-business analytics dashboard

In-BOS analytics surface — own data only. Lessons-completed %, time-
in-Incubator per phase, HC delta over time, marketplace clicks,
notification engagement. All from localStorage aggregation. Honesty
contract: "small n" badges when <7 days of data.

## Mandatory pre-read

1. T4 R013 activity timeline.
2. T4 R009 founder admin polish (admin has aggregate view).

## Scope

**A** — `business-os app/analytics.html` new page. Tab in BOS.

**B** — KPIs: Lessons complete (N/22) · Phase progress timeline
(Epic Intro→Mastery dots) · HC trend (latest score vs last completion)
· Activity events / 7d · Notifications read-rate / 7d.

**C** — Each KPI honest about sample size (small-n badge if <7 events
or <7d). No fabrication.

**D** — Period selector (7d / 30d / all-time).

**E** — Chapter R027 + MASTER delta.

## NOT in scope

- Cross-business comparison.
- External analytics integration.

## When done
DONE referencing `027-bos-analytics-dashboard.md`.
