# `_archived/` — parked code, not in build

Code that was pulled out of the active site but kept intact for later
revival. Nothing in here is loaded by the live app. Move things back
out one folder at a time when ready.

## Current contents

### `incubator-public/`
The full static **Incubator** app — was at `public/incubator/`.
Includes phase 1–4 HTML pages, copy packs, lib, onboarding flow,
discover/resources, and the portal bridge.

Reason archived (2026-05-09): Incubator is a **client-only** experience
going forward — no longer surfaced in Business OS or the public
marketing site. Bring back when the client portal needs it.

### `incubator-app/`
The Next.js route at `src/app/incubator/` (single `page.tsx`).
Archived alongside the public folder for the same reason — keep them
together so a future revive moves both as a pair.

## To revive

```bash
mv _archived/incubator-public public/incubator
mv _archived/incubator-app    src/app/incubator
```

…then re-add the sidebar link in `public/business-os/bos.js` and any
marketing nav references you want.
