/loop

# T1 — Round 036: Profile picture upload + circular avatar

Today the topbar `ProfileMenu` shows initials in a circle. Ed wants
a real uploadable circular profile picture (click on `/portal/account`
→ choose file → preview → save → menu reflects).

## Pre-read

- `src/components/chrome/ProfileMenu.tsx` (avatar render).
- `src/app/portal/account/page.tsx` (profile form).
- Existing `client-files` plugin (file storage pattern — match its
  shape; foundation can either reuse or add a slim user-avatar slot).

## Scope

**A** — Schema: `ServerUser.avatarUrl?: string` (data URL OR
external ref). For v1, store as a base64 data URL on the user record
(small — 256×256 cap). R+1 swaps to external ref via `client-files`
plugin once foundation has user-scoped file storage.

**B** — UI: `/portal/account` adds an upload zone (click or drag
file). Client-side resize to 256×256 via `<canvas>`, then POST to
`/api/auth/profile/avatar` as JSON `{dataUrl}`. Server validates
mime type + cap size to ~50KB.

**C** — `<ProfileMenu>` reads `avatarUrl` (new prop, optional).
Renders `<img>` when present, falls back to initials.

**D** — Topbar layouts thread `avatarUrl` from `getUserById(...).avatarUrl`.

**E** — Smoke ≥8: upload flow round-trip · cap enforcement · mime
guard · ProfileMenu fallback to initials when missing · cleared
avatar (DELETE) reverts to initials.

**F** — Chapter `04-profile-picture-upload.md` + MASTER row.

## NOT in scope

- External file storage / S3 (post-ship — base64 cap covers v1).
- Cropping UI (R+1 — initial release auto-centres).
- Per-agency default avatars (post-ship).

## When done
DONE referencing `036-profile-picture-upload.md`.
