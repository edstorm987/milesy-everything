/loop

# T7 — Round 005: 3 additional niche-agency packs (fitness · coaches · creators)

Repeat R004's pattern for 3 more niches. Each gets: branded marketing
copy, HC pack, brand kit seed, demo agency seed. Proves the
master/satellite pattern scales to N tenants.

## Pre-read

- T7 R001 + R002 + R003 + R004 (everything that made AquaOasis-web work).

## Scope per niche

For each of `fitness-edge`, `coach-rise`, `creator-stack`:
- Demo agency seeded via the spawner plugin (R003) OR via a small
  static seed similar to AquaOasis (whichever is cleaner — pick
  spawner if it's reliable by now).
- Distinct brand kit: fitness-edge (red / black / power), coach-rise
  (warm gold / sage / studio), creator-stack (electric blue /
  charcoal / pop).
- Marketing pages — Home / About / Services / FAQ / Contact —
  niche-appropriate language. Honesty contract per chapter #68.
- HC pack at `public/agencies/<slug>/health-check/questions.json` —
  4-7 niche questions each.
- Local-dev `/etc/hosts` entries documented in chapter (operator
  action).

## Smoke

`§ Multi-niche packs` (≥10 — each agency resolves by host; brand
kits distinct; HC packs distinct; marketing copy doesn't leak across
niches; spawner OR seed produces all 3 idempotently).

## Chapter

`04-three-niche-packs.md` + MASTER row.

## NOT in scope

- Real product positioning beyond "demo placeholder copy" (operator
  refines later when targeting actual clients).
- Per-niche bespoke plugins (post-ship — niche-specific tools live
  inside the existing plugin set, configured per-agency).
- Fifth+ niche (if Ed wants more, queue separately).

## When done
DONE referencing `005-additional-niches.md`.
