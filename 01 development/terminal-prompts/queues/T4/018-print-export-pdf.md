/loop

# T4 — Round 018: Print/export — HC results + Incubator progress as PDF

Browser print-to-PDF stylesheet for HC results page + Incubator phase
overview. Print-only CSS. Branded layout. Honest watermarks if data
is partial.

## Mandatory pre-read

1. T4 chapter #68 HC honesty contract — what to show on print.
2. T4 R001+R002 Incubator anatomy.
3. R009 admin polish (admin can print weekly snapshot).

## Scope

**A** — `print.css` shared across HC results + Incubator root.
Hides: nav, sticky bars, AI launcher, dev affordances. Shows:
brand logo header, results / phase chips, footnote with date + URL.

**B** — HC results: prints with the leak strip, transparency block,
"How we got this number" expander auto-expanded. Watermark "Self-
reported snapshot — {date}" footer.

**C** — Incubator root: phase strip + checklist + recommendations
(if HC complete). Watermark "Onboarding snapshot — {date}".

**D** — "Print this page" button on both surfaces, calls
`window.print()`. iOS Safari Save-to-PDF flow tested.

**E** — Admin "Weekly snapshot" report (R009) gains print stylesheet
too.

**F** — Chapter R018 + MASTER delta.

## NOT in scope

- Server-side PDF generation (no API).
- Multi-page reports.

## When done
DONE referencing `018-print-export-pdf.md`.
