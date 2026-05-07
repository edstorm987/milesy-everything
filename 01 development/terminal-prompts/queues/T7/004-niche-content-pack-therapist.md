/loop

# T7 — Round 004: AquaOasis-web (therapist) — full content pack

The AquaOasis Demo agency from R026 (chapter #133) has the brand kit
+ plugin installs but no real marketing content. This round writes
the marketing copy, founder story, services description, FAQ tailored
to therapists. Proves a satellite agency can be visually distinct AND
content-distinct from Milesy Media.

## Pre-read

- T7 R001 (domain-aware marketing).
- T7 R002 (per-agency lead magnet — therapist HC questions live there).
- Chapter #133 (AquaOasis Demo seed shape).
- Existing Milesy marketing copy in `_marketing/` for tone reference
  — do NOT reuse verbatim; therapist niche has different language.

## Scope

**A** — Marketing pages (JSX inside `(agency-marketing)/` route group
from R001). When agency=AquaOasis, these render:
- Home: "Marketing for therapists who actually care about their
  clients" + 3-feature strip + testimonial placeholder + HC CTA.
- About: founder/agency story (placeholder — operator fills later
  with real positioning).
- Services: 3-4 service cards (e.g. SEO for therapists / Google
  Business Profile setup / monthly content / referral systems).
- FAQ: 5-7 niche-specific Qs (HIPAA mentions / how to attract right
  clients / niche keywords / testimonial ethics).
- Contact: form → ticket via `@aqua/plugin-support-desk`.

**B** — All copy honest per chapter #68 — no fabricated client
names, no "we've helped 1,000 therapists" claims. Use language like
"built for therapists" / "designed around therapy practice
realities" — claims operator can defend.

**C** — Brand kit drives EVERY colour (CSS-vars from agency.brand).
No teal hardcoded — it's whatever AquaOasis's brand kit says.

**D** — Smoke `§ AquaOasis content` (≥8 — each page renders under
agency.slug=aquaoasis-demo host context; brand colors flow; no
hardcoded teal; copy unique to therapist niche).

**E** — Chapter `04-aquaoasis-content-pack-therapist.md` + MASTER row.

## NOT in scope

- Real client testimonials (post-ship — operator collects from real
  AquaOasis clients).
- Niche-specific tools beyond shared Resources (post-ship — could
  build "rank-my-therapy-practice" extension later).
- Other niche packs (R005+ if Ed wants more — fitness, coaches, etc).

## When done
DONE referencing `004-niche-content-pack-therapist.md`.
