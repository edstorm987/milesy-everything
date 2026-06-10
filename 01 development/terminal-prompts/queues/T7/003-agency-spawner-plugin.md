/loop

# T7 — Round 003: `@aqua/plugin-agency-spawner` — manual-input v1

Plugin scaffold for spawning new niche-agency satellites. v1 takes
manual operator input (name, slug, niche, brand colors, lead-magnet
domain) → idempotent agency seed + pack folder + brand kit. v2/post-
ship adds prompt-driven LLM generation; this round is the scaffold.

Plan ref: chapter #123 §"Gaps to close" item #5. chapter #124 Phase 12 R5.

## Pre-read

- T1 R025 multi-agency users (`bootstrapAgency` + `agencyIds[]`).
- T1 R026 + AquaOasis seed pattern (`aquaOasisSeed.ts`).
- T7 R001 + R002 (domain-aware + lead-magnet pack patterns).

## Scope

**A** — `@aqua/plugin-agency-spawner` manifest, `scopePolicy:
"agency"` gated to Milesy master. Founder-only access.

**B** — Admin form `/portal/agency/spawn-agency`:
- Name (display)
- Slug (kebab-case validation)
- Niche tag (therapist / fitness / coach / agency / custom)
- Brand colors (primary / accent / heritage)
- Marketing domain (e.g. `aquaoasis-web.com`)
- HC pack: empty / copy-from-AquaOasis-demo / copy-from-default

**C** — Submit creates: agency row via `bootstrapAgency` →
brand kit applied → `public/agencies/<slug>/health-check/` directory
created with selected pack contents → `agency.metadata.marketingDomain`
set so R001 resolver picks it up.

**D** — Idempotent: if slug exists, returns existing agency with a
"already exists" notice. Operator can re-run safely.

**E** — Smoke `§ Agency spawner` (≥10 — submit creates everything;
slug clash detected; lead-magnet pack copied; brand kit applies; HC
URL resolves; idempotent re-submit).

**F** — Chapter `04-plugin-agency-spawner.md` + MASTER row.

## NOT in scope

- Real LLM prompt-driven generation (post-ship).
- Auto-creating Vercel project + DNS (T6 territory; defer to manual
  for now — operator runs `vercel link` after spawn).
- Per-agency staff seeding (operator manual via portal).

## When done
DONE referencing `003-agency-spawner-plugin.md`.
