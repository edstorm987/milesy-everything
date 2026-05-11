/loop

# T4 — Round 005: Final marketing copy pass + content QA

Sweep across every marketing-side page and tighten copy to ship-grade.
Ed flagged this earlier as "things I can really improve" — this round
is the systematic pass. Do not wait for Ed to flag specifics; use the
content judgement you've already shown across chapters #122 + #123.

This is the **last polish round before ship gate** for T4.

## Pre-read

- Chapter #123 (you've already polished a lot of this; see what
  shipped, look for the rough edges).
- The 4 niche pages (after R001 sync), `_marketing/index.html`,
  `/login`, `/signup`, `/demo`, `/dev/pov`, `/health-check`,
  `/business-os`, `/incubator`, `/resources`.

## Scope

**A** — Sweep every marketing surface for: weak verbs, marketing-ese
("solutions" / "leverage" / "synergy"), claims with no number behind
them (chapter #68 honesty contract), CTAs that aren't action-clear,
overlong paragraphs.

**B** — H1 / H2 audit — every page should have ONE H1 that names the
thing. Sub-heads should be promises, not section labels.

**C** — Footer audit — every footer should carry the same set of
links + copyright + legal stub (Privacy / Terms = stub pages OK,
just consistent).

**D** — Image alt audit — every `<img>` has descriptive alt; chapter
#123 fix asset paths absolute.

**E** — One pass across `dev/pov` persona-card copy. Each persona
card should say what they actually see in 1 line, not in marketing
language.

**F** — Document changes in chapter
`04-final-copy-pass-pre-ship.md` — list pages touched + before/after
samples for the most significant rewrites. Don't write a wall; 6-8
bullets.

**G** — MASTER row. Tasks row.

## NOT in scope

- New pages (post-ship).
- Visual redesign (this round is text only — no styles.css edits
  unless purely font-size or spacing fixes flagged by the copy
  audit).
- iframe→React rewrites (post-ship).

## When done
DONE referencing `005-final-copy-pass.md`. After this round T4 hits
WAKE-EMPTY — Ed's call whether to stage more T4 work or let T4 idle
until first real client onboarding (Sprint 3 WS-F).
