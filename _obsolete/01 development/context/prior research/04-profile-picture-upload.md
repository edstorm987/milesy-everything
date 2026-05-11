# T1 R036 — Profile picture upload (circular avatar)

## Why
The topbar `ProfileMenu` previously rendered initials in a black chip. Ed
wanted a real uploadable circular profile picture: open `/portal/account`
→ click upload (or drag a file) → see the menu reflect immediately across
agency / client / customer surfaces.

## Shape (v1 — inline data URL)
- `ServerUser.avatarUrl?: string` — `data:image/<mime>;base64,...`
- Cap: `AVATAR_MAX_DATA_URL_BYTES = 50_000` (encoded length).
- Mime allow-list: `image/png`, `image/jpeg`, `image/webp`.
- SVG rejected (XSS). GIF rejected (animation noise — static circular
  avatar only). Anything else → 400.
- R+1: swap inline for an external ref via the client-files plugin once
  foundation has user-scoped file storage. Schema field is forward-
  compatible (the same string slot can carry an `https://…` URL).

## Files (foundation only — HARD BOUNDARY honoured)
- `src/server/types.ts` — adds `ServerUser.avatarUrl?: string`.
- `src/server/users.ts` — `UpdateUserPatch.avatarUrl?: string | null`
  with `null` = clear, `undefined` = leave alone, `string` = save.
- `src/lib/avatarDataUrl.ts` (NEW) — pure validator (`validateAvatarDataUrl`,
  `AVATAR_MAX_DATA_URL_BYTES`). Outside `server-only` so smoke can import.
- `src/app/api/auth/profile/avatar/route.ts` (NEW) — POST + DELETE.
  POST validates + saves; 413 on `too_large`, 400 on other validation,
  401 unauth, 404 if user vanished, 500 on save failure. DELETE clears.
- `src/app/portal/account/AvatarUploader.tsx` (NEW, `"use client"`) —
  click or drag → `createImageBitmap` → 256×256 cover-fit canvas →
  JPEG q=0.85 → POST JSON `{dataUrl}`. Remove-photo button hits DELETE.
- `src/app/portal/account/page.tsx` — mounts `AvatarUploader` with
  `initialAvatarUrl` + initials fallback string.
- `src/components/chrome/ProfileMenu.tsx` — accepts optional `avatarUrl`,
  renders `<img class="mm-profile-avatar-img">` when present, else falls
  back to the existing initials chip.
- `src/components/chrome/Topbar.tsx` — accepts `avatarUrl?: string`
  and threads through to `<ProfileMenu>`.
- `src/app/portal/agency/layout.tsx` ·
  `src/app/portal/clients/[clientId]/layout.tsx` ·
  `src/app/portal/customer/layout.tsx` — pass
  `avatarUrl={getUserById(session.userId)?.avatarUrl}` to `<Topbar>`.
- `public/_marketing/styles.css` — adds `.mm-profile-avatar-img`
  (28×28 circle, `object-fit: cover`, neutral border).

## Smoke (§ Profile picture upload — 21/21)
`scripts/smoke-profile-picture-upload.test.ts` ·
`npm run smoke:profile-picture-upload` (~1.7s) ·
8 suites covering:
- **Validator round-trip** — PNG fixture round-trips; JPEG + WebP accepted.
- **Cap enforcement** — `too_large` on payload > 50KB; cap constant pinned.
- **Mime guard** — SVG + GIF + non-data-URL + missing rejected; bad-base64
  payload (length not multiple of 4) returns `bad_base64`.
- **Schema + store** — `ServerUser.avatarUrl?: string` exists; `UpdateUserPatch`
  carries `string | null` w/ null→clear semantics.
- **Route handler** — POST + DELETE behind `requireSession`; 413 on
  too_large; DELETE wires `avatarUrl: null`.
- **ProfileMenu fallback** — renders `<img>` w/ `avatarUrl`; falls back to
  initials chip when absent; CSS ships the image variant.
- **Topbar + layout wire-up** — Topbar prop + threading; agency / client /
  customer layouts all thread `getUserById(...).avatarUrl`.
- **Account page upload zone** — client component, POSTs JSON to avatar
  route, uses `<canvas>` resize at 256, DELETE wired for clear→initials,
  page mounts `AvatarUploader` with current avatar + initials.

## NOT in scope (R+1 candidates)
- External file storage (S3 / client-files plugin) — base64 cap covers v1.
- Cropping UI (auto-centre cover-fit ships now).
- Per-agency default avatars.
- Animated avatars / GIF support.
- Avatar moderation (NSFW filter / review queue).
- ETag/Cache headers on the data URL response (it's small + per-user).

## Q-ASSUMED
- 50KB encoded cap matches the round prompt's "~50KB" target — comfortable
  for 256×256 JPEG q=0.85. R+1 tunes after real-world distribution data.
- JPEG q=0.85 over PNG passthrough — predictable size, lossless not
  required for circular 28-px chip rendering.
- Cover-fit centre-crop over letterbox — circular avatars prefer fill;
  R+1 ships a cropping UI for off-centre subjects.
- SVG explicitly rejected even though common — inline `<svg>` allows
  `<script>`; we don't render via `<img>` only contract (browsers honour
  it from `<img>`, but we keep allow-list tight as a defence-in-depth).
- GIF rejected — v1 renders a static chip, no value in animation; allow-
  list extension trivial later if Ed asks.
- `null` as the clear sentinel on `UpdateUserPatch` — distinguishes
  "leave alone" (`undefined`) from "clear" (`null`); avoids overloading
  empty-string semantics.
- Source-marker smoke style for the route handler (carries `server-only`
  ripple via `requireSession`/`updateUser` so we can't import under tsx);
  pure validator + constants are runtime-imported.
