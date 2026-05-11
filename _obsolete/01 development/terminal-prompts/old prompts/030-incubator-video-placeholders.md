/loop

# T4 — Round 030: Per-niche Incubator video placeholders

Each Incubator phase page has a `videoEmbed` slot — currently
placeholder Vimeo. Drop in 4 per-niche playlist recommendations
(public Vimeo/YouTube) so the surface feels alive immediately.

## Mandatory pre-read

1. T4 R002 per-phase Incubator pages.
2. T4 R004 niche copy packs.

## Scope

**A** — Each niche pack gets a `videos` field — array of 4 entries
`{phase, url, title, description}` covering Epic Intro / Blueprint /
Diagnostics / Brand Builder.

**B** — Curate 4 public videos per niche (public Vimeo / YouTube
talks, free educational content). Skincare = botanical brand talks,
Coaching = clarity/positioning, Agency = systems/scaling, Fitness =
authority building.

**C** — Each phase page reads `niche.videos[phase]` and renders the
video + title + 1-line description. Honest fallback if no curated
pick: gradient placeholder with "Coming soon — recommend a video".

**D** — Default `agency` pack ships with 4; other niches start with
2 placeholders flagged "Curate your own".

**E** — Chapter R030 + MASTER delta. tasks.md row notes operator
should curate proper videos as a future operator task.

## NOT in scope

- Hosting videos.
- Per-business uploaded videos (out of scope).

## When done
DONE referencing `030-incubator-video-placeholders.md`.
