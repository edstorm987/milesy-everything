# `04` Default favicons + Aqua HQ sidebar polish (T1 R17)

> Authored 2026-05-07. Two follow-ups bundled:
> 1. Default favicon assets so T3 R014's `deriveFaviconUrls` fallback
>    has files to point at.
> 2. Sidebar Aqua HQ section restructured to the canonical 6 items per
>    chapter §1 (Dashboard / Clients / Inbox / SOPs / Finance /
>    Settings) with R007 effective-role gating.

## Files touched

- `portal/public/favicon-default-32.png` (NEW, 168 B, 32×32 RGBA)
- `portal/public/favicon-default-180.png` (NEW, ~966 B, 180×180 RGBA)
- `portal/public/favicon-default-192.png` (NEW, ~1.1 kB, 192×192 RGBA)
- `portal/public/favicon-default.ico` (NEW, ~138 B, ICONDIR-wrapping a 16×16 PNG)
  - Generator: hand-rolled PNG encoder (PNG signature + IHDR + IDAT
    + IEND chunks; CRC32 computed inline) emitting a 32-bit RGBA
    aqua-blue (#0EA5A4) circular fill on transparent background. ICO
    wraps the same 16×16 PNG in an ICONDIRENTRY (modern browsers
    accept embedded PNG). Brand-neutral droplet placeholder per
    prompt's NOT-in-scope on real branded SVG redesign.
- `portal/src/components/chrome/AgencyToolsBallpark.tsx`
  - `AQUA_HQ` array rewritten as the canonical 6 items per chapter §1:
    - Dashboard → `/portal/agency` (clients.view)
    - Clients → `/portal/agency#clients` (clients.view)
    - Inbox → `/portal/agency/activity-inbox` (clients.view)
    - SOPs → `/portal/agency/sops` (sops.view)
    - Finance → `/portal/agency/agency-finance` (finance.view)
    - Settings → `/portal/agency/settings` (clients.edit)
  - Each row carries `requires: string[]` (PermissionKey list).
  - Component now accepts optional `permissions: readonly string[]`
    + `isFounder: boolean` props. Computes `visibleAquaHq` by
    Founder-bypass + grid-intersection filter.
  - Existing "More tools" collapsible group preserved; tasks /
    kanban + social/marketing demoted into it (since Inbox + SOPs +
    Finance now live in the canonical six). HR/Forms/Email/Ops/
    Domains/Affiliates retained.
- `portal/src/app/portal/agency/layout.tsx`
  - Already computes `eff = effectiveRole(session)` (R007). Now
    threads `<AgencyToolsBallpark permissions={eff.permissions}
    isFounder={eff.isFounder}>` so the Founder-bypass + grid-filter
    fire client-side.
- `portal/scripts/smoke.mjs`
  - NEW `§ Aqua HQ sidebar polish` block: sidebar shows each of the
    6 labels (Dashboard / Clients / Inbox / SOPs / Finance /
    Settings) — Founder POV passes everything; favicon-default-*.png
    + .ico all 200.

## Goal coverage map

| Goal | Where |
| ---- | ----- |
| **A** static favicon assets | `portal/public/favicon-default-{32,180,192}.png` + `.ico` |
| **B** 6-section restructure | `AQUA_HQ` rewrite in `AgencyToolsBallpark.tsx` |
| **C** R007 role-gating | `permissions` + `isFounder` props threaded; `visibleAquaHq` filter |
| **D** smoke + chapter | this round |

## Q-ASSUMED log

1. **AgencyToolsBallpark vs Sidebar.tsx** — prompt says "Sidebar.tsx
   restructure" but the canonical Aqua-HQ rendering surface is
   `AgencyToolsBallpark` mounted into the agency layout's `extra`
   slot. Sidebar.tsx receives panel data from `buildSidebar` which
   doesn't carry the Aqua-HQ list — the ballpark is the right home.
2. **Inbox path** = `/portal/agency/activity-inbox` per the
   activity-inbox plugin's mount slug. If T2 ships a different
   plugin id, the link 404s — chapter calls this out as a one-line
   fix when known.
3. **Settings path** assumed `/portal/agency/settings` per the
   foundation default sidebar's existing settings entry.
4. **Hand-rolled PNG encoder** rather than pulling in an image
   library — keeps bundle clean. Output verified via `file(1)`:
   `PNG image data, 32x32, 8-bit/color RGBA, non-interlaced`.
5. **No real branded glyph yet** — brand-neutral aqua-blue circular
   fill placeholder. Chapter notes the polish path when T4 ships a
   real droplet SVG.

## NOT in scope

- Real branded favicon SVG redesign (T4 polish round).
- New routes — sidebar only links existing pages or anchors.
- Mobile sidebar mirror (already inherits via `MobileNav.tsx`).

## Smoke results

`§ Aqua HQ sidebar polish` block adds 10 checks (6 sidebar labels +
4 favicon assets). tsc clean. HARD BOUNDARY honoured.
