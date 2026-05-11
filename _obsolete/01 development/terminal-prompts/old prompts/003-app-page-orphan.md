/loop

# T4 — Round 003: `app/page.tsx` orphan resolution

`src/app/page.tsx` is shadowed by the `/` rewrite to
`/_marketing/index.html` (chapter #123 §"Open follow-ups" item 1).
Decide its fate this round.

## Pre-read

- Chapter #123 §"Open follow-ups" item 1.
- `next.config.ts` — the `beforeFiles` rewrite for `/`.
- Existing `app/page.tsx` content (likely dead-code).

## Scope

Pick **one** of these paths and ship it. Default recommendation:
**Option A (delete the orphan)**, since (a) the static index is
working and shipped, (b) JSX rewrite is non-trivial and not on the
ship-gate critical path, and (c) deleting reduces confusion.

**Option A — Delete the orphan.**
- `git rm` `src/app/page.tsx`.
- Verify Next.js boots cleanly (no missing-route warnings).
- Document in chapter that the marketing home is static-HTML for v1
  and JSX rewrite is post-ship.

**Option B — JSX rewrite the marketing home.**
- Port `_marketing/index.html` content into `app/page.tsx` using
  SiteShell. Drop the `/` rewrite. Marketing static index moves to
  `public/_marketing/index.html.legacy.bak` for one cycle then
  deletes.
- Mirror current visual exactly — pixel-perfect not required, but
  Resources mega-menu / sticky bar / hero / sections must all read
  the same.
- Smoke against `:3030/` to confirm.

In either case:
- Chapter `04-app-page-orphan-resolution.md` documents the choice.
- MASTER row.
- Log Q-ASSUMED for whichever option you pick if you didn't ask Ed
  first; Q-BLOCKED if it's not obvious.

## NOT in scope

- Niche-page JSX rewrite (separate round — niche pages stay static
  HTML this sprint).
- Touching `_marketing/styles.css` beyond what the chosen option
  requires.

## When done
DONE referencing `003-app-page-orphan.md`.
