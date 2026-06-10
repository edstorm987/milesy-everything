# 04 — Aqua AI conversation memory across sessions (T4 R029)

R007 stored chat history per-tab via `aqua.ai.session.incubator`
localStorage key. R029 promotes that to **per-business persistent
memory** at `bos.aiHistory[]`, capped at 20 user+bot pairs (40 entries),
mirrored via R012 BOSStorage so each business keeps its own thread.

> Per prompt: real conversational memory in the scripted AI is out of
> scope. R007's keyword router still answers each turn fresh — what
> R029 adds is the visible *thread* persistence, not contextual recall.

## Storage

| Key                            | Type           | Notes                                                            |
| ------------------------------ | -------------- | ---------------------------------------------------------------- |
| `bos.aiHistory[]` *(NEW)*      | array          | `{role:'user'|'bot', text, actions?}`. Cap 40 entries. Per-business via R012 mirror. |
| `bos.aiHistory.lastWriteISO` *(NEW)* | string ISO | Stamp on every write — drives the "Continuing conversation from <date>" header. |
| `aqua.ai.session.incubator`    | legacy R007    | Read once on first load + migrated into `bos.aiHistory`, then deleted. |

`bos.aiHistory` added to R012 `NAMESPACED_KEYS` so the switch-by-mirror
pattern flips threads when the business switches.

## Migration

`readHistory()` checks `bos.aiHistory` first. If absent, it pulls
the legacy `aqua.ai.session.incubator` value, writes it through to
`bos.aiHistory`, removes the legacy key, and returns the array. One-time,
honest, no data loss.

## "Continuing conversation from <date>" header

Rendered into the panel body above the message list when:
- `bos.aiHistory` is non-empty AND
- `lastWriteISO` is older than 60 seconds (so opening mid-conversation
  doesn't add a banner for the just-sent message).

Format:
- Within 24h → "earlier today, HH:MM"
- Otherwise → "Mon, May 5"

Blue-tinted (`.inc-ai-resume`) banner using existing R012-resume
colour family for visual continuity.

## Disclaimer expansion

Panel head now shows two sub-lines:

1. R007 line — "Aqua AI is currently scripted — full AI lands when
   you upgrade to Pro." (unchanged)
2. R029 line — "*I don't actually remember beyond text on this device
   — script runs fresh each time.*" (italic muted)

Honesty contract: explicit that the persistence is text-only, not
contextual recall. The bot replies are still per-message router calls
through R007 `respondTo()`.

## Cap + write path

`writeHistory(arr)` truncates to last 40 entries (20 user+bot pairs)
on every write. Both `localStorage.setItem('bos.aiHistory', …)` AND
`BOSStorage.set('bos.aiHistory', …)` (when R012 loaded) — keeps the
per-business namespaced mirror in sync.

`stampWrite()` updates `bos.aiHistory.lastWriteISO` on every user +
bot message persist (called twice per turn — before bot reply
arrives, then after).

## Clear conversation

Existing R007 "Clear conversation" footer link still works; R029
patches `clearHistory()` to also wipe the BOSStorage mirror via
`set(HISTORY_KEY, null)` so the next switch back to this business
genuinely shows an empty thread.

## CSS — `.inc-ai-resume` (~12L)

Blue-tinted small-font centered banner above message list. Matches
R012 BOS-Storage resume-card colour family (R012 uses
`#4a6e8e`/`#9ec5e8` for the "Pick up where you left off" pattern; this
mirrors it).

## Smoke (verified 2026-05-07)

- `lib/aqua-ai-ui.js`, `lib/storage.js`, Incubator root all 200.
- Manual flow:
  1. Open Aqua AI panel on Incubator → empty state (no banner since
     no history).
  2. Send a few messages → history populates; close panel.
  3. Re-open → "Continuing conversation from earlier today, 22:54"
     banner above the conversation; messages preserved.
  4. Refresh page → same conversation persists.
  5. Switch business via R012 sidebar swap → opens fresh empty
     conversation for that business; switch back → original thread
     restored via mirror.
  6. Click "Clear conversation" → bos.aiHistory cleared; banner
     gone; empty state restored.
- Disclaimer panel shows both lines (scripted + no-real-memory).
- Legacy `aqua.ai.session.incubator` migrates on first load and is
  removed after.

## Q-ASSUMED + R029 follow-ups

- **Real conversational memory** explicitly out per prompt — R007's
  scripted router still answers each turn fresh; R029 adds visible
  thread persistence only. The system-prompt context for T6 real-
  Claude wiring would carry the last N exchanges as background.
- **Per-message timestamps** — current shape is `{role, text,
  actions?}`; lastWriteISO covers the "continuing from" header but
  per-bubble timestamps would be R+1 (cap at last-N hour-stamps).
- **Conversation export** — could add a "Download conversation as
  Markdown" button to settings R024 Data tab. R+1.
- **History cap = 20 pairs** is conservative; raise to 50 if user
  feedback says memory feels too short.
- **Cross-tab sync** — open Aqua AI in two tabs, send in one, the
  other doesn't update until reload. `storage` event listener R+1.

## Cross-refs

- R007 (#83) Aqua AI scripted — `respondTo()` is unchanged; only the
  UI persistence layer flipped.
- R012 (#88) BOSStorage — `bos.aiHistory` joins NAMESPACED_KEYS so
  per-business threads mirror on switch.
- R023 (#99) prompt library — empty-state still renders the 6
  category chips when history is empty; "Continuing" banner shows
  when history exists.
- R024 (#100) settings — R+1 could surface "Clear AI memory" + per-
  business reset there alongside the existing data-export.
- Chapter #66 storage schema — `bos.aiHistory` + `.lastWriteISO`
  added.
- Chapter #68 honesty — disclaimer expansion documented above.
