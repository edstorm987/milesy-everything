/loop

# T4 — Round 024: BOS settings + preferences page

Single page for: business profile (name/niche/logo), notifications
(per-kind toggle), AI preferences, billing entitlement, export data,
delete business.

## Mandatory pre-read

1. T4 R012 multi-business storage shim.
2. T4 R022 notifications inbox.
3. T4 R011 Pro upgrade entitlement.

## Scope

**A** — `business-os app/settings.html` new page. Tabs: Profile ·
Notifications · AI · Billing · Data.

**B** — Profile tab edits `bos.brand.{companyName, niche, logoUrl,
primary, secondary}` with live preview swatch.

**C** — Notifications tab: per-kind toggle (`bos.notifyPrefs.<kind>=
{enabled,channel:'inbox'}`). Notify.push checks prefs before pushing.

**D** — AI tab: tone slider (formal/casual/playful) + length pref.
Q-ASSUMED scripted AI ignores tone today; documents what changes when
real AI lands.

**E** — Billing tab: shows current entitlement + trial countdown +
upgrade/downgrade CTAs.

**F** — Data tab: Export-as-JSON button (dumps all bos.* keys);
Delete-this-business with confirmation.

**G** — Chapter R024 + MASTER delta.

## NOT in scope

- Real billing changes (T6).
- Cross-business data migration.

## When done
DONE referencing `024-bos-settings-page.md`.
