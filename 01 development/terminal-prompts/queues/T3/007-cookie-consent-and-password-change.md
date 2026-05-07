/loop

# T3 — Round 007: Cookie consent + force password change

Two small lift-inventory wins (chapter #58, Tier 3): cookie consent
banner block (storefront) and force-password-change flow (foundation
hook surfaced through the editor's account pages).

## HARD BOUNDARIES — standard

## Mandatory pre-read

1. Chapter `04-lift-inventory.md` (#58) — both items in Tier 3.
2. Existing form-render block + auth pages — for shape mirror.

## Scope

**Goal A — `cookie-consent` storefront block**
- New block. Props `{ message, acceptLabel, declineLabel?, policyUrl?,
  position: "bottom-bar"|"corner"|"modal" }`.
- Uses localStorage `aqua_cookie_consent_v1 = "accepted"|"declined"`.
- Renders only when consent absent. Accept → analytics fire; decline →
  analytics suppressed (event hook for plugins to listen to).
- Auto-injected via existing `pageTemplates` for new sites (toggleable
  in editor settings).

**Goal B — Force-password-change flow**
- Foundation flag `user.metadata.requirePasswordChange = true` triggers
  a forced redirect to `/account/change-password` after login.
- Editor surfaces a "Force password reset on next login" toggle in the
  user-detail admin (per-user) and a "Force on all" button per agency.
- Reuse existing password-change endpoint; gate on the flag.

**Goal C — Smoke + chapter**
- Smoke: cookie block reads/writes localStorage, renders only when
  unset, accept → consent stored, decline → suppress flag set.
  Force-password redirect kicks on flagged user, clears flag on
  successful change.
- Chapter `04-cookie-consent-and-password-change.md`. MASTER row.

## NOT in scope

- Granular consent categories (analytics / marketing / strict). Single
  binary for v1; categories deferred.
- 2FA enforcement — separate round.
- Touching milesymedia / business-os.

## When done

DONE referencing `007-cookie-consent-and-password-change.md`.
