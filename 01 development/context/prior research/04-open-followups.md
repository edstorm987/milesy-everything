# 04 · Open follow-ups, Q-FLAGs, mesh hazards

Author: T4
Updated: 2026-05-07.

The catch-all running list. Newest at the top. When something is closed, leave the line and add `RESOLVED YYYY-MM-DD: <how>`.

## Production routing — needs chief commander / T6

- **Q-FLAG**: root `vercel.json` and `04-the-final-portal/portal/next.config.ts` only rewrite `/`, `/index.html`, `/login.html`, `/admin.html`, `/styles.css` → `/_milesy/...`. Direct visits to `/health-check.html`, `/lead magnet app/`, `/business-os app/` (and any sub-pages: `/lead magnet app/index.html`, `/business-os app/app.html`, etc.) will 404 in production until rewrite entries are added.
- Same-origin links from the rewritten pages work today via a JS shim in `index.html` (`a[href="health-check.html"]` → `/_milesy/health-check.html`). The shim becomes a no-op safety net once the rewrites land.

## Real connectors — not wired

The HC results "What we'd verify against" panel names them; nothing's plugged in. Build order I'd suggest:

1. **Lighthouse via PageSpeed Insights API** — free, no OAuth, just an API key. Tiny Vercel Edge function on `04-the-final-portal/portal/src/app/api/audit/lighthouse/route.ts`, returns perf/SEO/a11y/best-practice/LCP/CLS for a given URL. Lead-magnet Pro tier calls it.
2. **GMB lookup via Places API** — search by name + town, return profile state (claimed? photos? reviews count? recent posts?).
3. **Search Console** — needs OAuth. Bigger build.
4. **GA4 / Stripe / QuickBooks** — all need OAuth.

Until any of these land, stay honest: range-not-point, "self-reported", transparency block.

## Quick-win blog URLs — placeholder slugs

Every `quickwins(slot)` builder in `lead magnet app/hc-questions.js` links to URLs like `https://milesymedia.co/blog/gmb-setup`, `https://milesymedia.co/blog/homepage-hero`, `https://milesymedia.co/blog/post-purchase-flow`, `https://milesymedia.co/blog/referral-script`, `https://milesymedia.co/blog/keyword-starter`, `https://milesymedia.co/blog/5-second-test`, `https://milesymedia.co/blog/second-channel`, `https://milesymedia.co/blog/flagship-offer`. **None of these exist yet.** Either ship the posts, or repoint the links at the BOS lessons (some are direct matches: e.g. GMB → `module.html?id=…`, Referrals → `module.html?id=referral-alchemy`).

## Lessons library — 15+ rows still locked

Five lessons are written: `chrome-profile`, `core-principles`, `super-sales`, `ops-sustainability`, `referral-alchemy`. The library shows the rest as Pro-locked rows with a 🔒 tag. To unlock more on the free tier, write the lesson and add an entry to `lessons.js` keyed by id, then change the database.html row to use `module.html?id=…`.

## Admin questions editor — open items

- No "Preview as fresh user" button — admin opens HC in new tab, but `hc.contact` / `bos.healthCheck` from earlier sessions linger. A "wipe + preview" button would help.
- No undo / version history. Last-write-wins.
- `quickwins(slot)` builders not editable — admin can edit question structure but not action-mappings.
- Admin gate is a `prompt()` with hardcoded passwords (`milesy` or `aqua`). Throwaway dev gate. Real auth lands when this becomes a portal plugin.

## Niche packs — only labels today

The 8 niche tiles (Therapist / Roofer / Salon / Coach / Restaurant / Retailer / Agency / Generic) only set a label and a tagline. Plugin tier should ship per-niche:

- niche-specific module sets (e.g. Roofer OS gets `module.html?id=gmb-photoshoot`)
- niche-specific HC questions (1 swap per topic minimum)
- niche-specific KPI definitions
- niche-specific SOP pack

## Plugin extraction (future)

When the BOS becomes `@aqua/plugin-business-os`:

- Mounts on portal sidebar under "Resources" (label-swap by tenant tier).
- Reads from portal auth (replaces `localStorage['bos.user']`).
- Writes to per-tenant Postgres tables (schema mapping in `04-business-os-plugin-handoff.md`).
- Inherits portal session (no second login).
- The HC sub-app and admin sub-app become routes inside the plugin.

## Mesh hazards (recurring)

- **Shared `.git/index`** — multiple terminals editing simultaneously have repeatedly absorbed each other's WIP into the wrong commit. Mitigation: stage by path explicitly (`git add -- "04-the-final-portal/milesymedia website/"`) and commit immediately, never rely on `git add -A` or `git pull --rebase --autostash`.
- 2026-05-07 incident: T4's `31d1764` push hit T1+T3 unstaged WIP on pull-rebase. Multiple stash-rescue cycles got my commit to origin, but stash pops conflicted with newer origin content. Stashes dropped — T1/T3 saw unmerged residue (T1-router.md, EditorPage.tsx). Logged in outbox.

## Branding modal — limitations

- Logo capped at 1MB (FileReader → data URL stored in localStorage). Bigger logos either fail or bloat localStorage.
- No SVG sanitisation. If a user uploads an SVG with embedded JS, we'd execute it. Low risk on a single-user dev origin; needs sanitiser before plugin extraction.
- No drag-and-drop. File picker only.

## Health-check progress save

- `hc.contact` is captured but only stored locally and mirrored into `bos.leads`. There's no real "send me my saved progress" email/SMS flow yet — the modal copy promises we'll keep their spot, but nothing actually happens server-side. Either add a tiny mailto, or wire a real backend endpoint.

## Email a copy / share / PDF

- "📧 Email me a copy" → `mailto:` with `[results URL placeholder]`.
- "🔗 Get a shareable link" → copies the current URL (no actual share-link, the state is local).
- "📄 Download as PDF" → `window.print()` (browser print dialog).
- All three are honest UI placeholders; need real implementation when there's a backend.

## Tasks editor / branding / company profile / leads

All persist to localStorage. When the user clears their browser they lose everything. Once the plugin lands, all of these read/write Postgres. No migration UX yet for "I started on free tier, now upgraded — keep my data" — open Q for chief commander when the plugin extraction starts.
