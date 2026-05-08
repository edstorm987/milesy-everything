/loop

# T4 — perf-followup: CDN image resizer adoption (per-block)

Chapter #38 documents the image helper (`?w=<width>` resizer
contract). Adoption is incomplete — many block components still
emit raw `<img src=…>` against full-size assets. Phones download
2000-px hero JPGs.

## Pre-read

- Chapter #38 (image resize helper).
- Chapter #168 (perf audit context).
- `public/_marketing/styles.css` — hero / niche-page hero stripes.
- `src/components/ResourceFinder.tsx` — card thumbnails.
- Plugin block components in `04-the-final-portal/plugins/website-editor/`
  (Image / Hero / Gallery blocks).

## Scope

**A** — Audit every `<img>` that's authored content (not a static
asset checked-in at the right size).

**B** — Wrap with the chapter #38 helper so each `<img>` emits the
right `?w=<width>` based on the layout slot.

**C** — Add `srcset` for retina + tablet variants on the heroes.

## HARD BOUNDARY

T4 owns marketing chrome, ResourceFinder, niche pages. Plugin
block changes belong to T3 (website-editor). Coordinate or queue
a T3 sub-prompt.

## Q-ASSUMED at queue time

- The chapter #38 helper exists and has the production transform
  endpoint wired (verify before scoping).
- Skip the four `for-<niche>` hero stripes if they're CSS-art — only
  bitmap content needs the resizer.
