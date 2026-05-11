/loop

# T2 — Round 023: `@aqua/plugin-rank-my-website` (WS-B R023)

First Resources tool — public-facing rank-my-website diagnostic.
Honest scoring (no fabricated numbers per chapter #68). Captures email
→ creates lead (via R021 public-funnel) → drops into BOS.

Plan: chapter #124 WS-B R023.

## Pre-read

- T2 R021 public-funnel plugin (lead capture endpoint).
- T3 R031 a11y audit + R036 sitemap (similar diagnostic shape).
- Honesty contract chapter #68.

## Scope

**A** — Manifest: `id: "@aqua/plugin-rank-my-website"`,
`scopePolicy: "global"`. Exposes `/resources/rank-my-website` route
(replaces the chapter #123 stub).

**B** — Form: URL input + "Run" button. POST → server endpoint
fetches the URL (5s timeout, 3MB max body), runs lightweight checks:
- Title tag length (50-60 sweet spot)
- Meta description length (120-160)
- H1 count (1 ideal, 0/multi flags)
- Image alt-tag coverage
- Open Graph tags presence
- Canonical link presence
- robots.txt + sitemap.xml reachable
- HTTPS + HSTS

**C** — Score: A-F band per check + an overall band. NO numeric
percentage out of 100 (false precision); just bands + the actual
findings ("3 of 12 images missing alt").

**D** — Capture form: post-results email-capture CTA → calls
`/api/portal/public-funnel/tool-complete` with source `"tool"` +
sourceMeta `{ tool: "rank-my-website", url, scoreBands }`.

**E** — Smoke `§ rank-my-website` (≥10 — fetch happy path; timeout
handled; private/local URLs rejected; each check produces expected
band; capture flow creates lead).

**F** — Chapter `04-plugin-rank-my-website.md` + MASTER row.

## NOT in scope
- Real Lighthouse / PSI integration (post-ship — heavy dep).
- Per-user history (post-ship).

## When done
DONE referencing `023-rank-my-website.md`.
