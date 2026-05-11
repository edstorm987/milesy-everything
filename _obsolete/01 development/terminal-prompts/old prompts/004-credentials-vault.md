/loop

# T2 — Round 004: Credentials vault plugin

Closes the last canonical sidebar slot from chapter §2 — Passwords &
Access. Per-client credential vault so Ed (and authorised staff) can
store login info, 2FA recovery codes, and access notes per client.

## HARD BOUNDARIES

- Standard.

## Mandatory pre-read

1. `04-aqua-internals-reference.md` §2 (Passwords & Access slot) + §7
   (Communication SOP — 2FA via Passwords vault).
2. Your most-recent T2 plugin chapter for shape mirror.

## Scope

**Goal A — `@aqua/plugin-credentials-vault`**
- `scopePolicy: "either"` (works at agency or per-client).
- Domain: `Credential { id, label, type: "login"|"api-key"|"2fa-recovery"|
  "note", url?, username?, password? (encrypted), notes?, tags[],
  lastRotated?, sharedWith: userId[] }`.
- Encryption at rest using foundation's per-install encryption helper
  (or inline AES-GCM if not yet shipped — flag for foundation lift).

**Goal B — Admin UI**
- `CredentialListPage` — table of credentials with type chip, last-rotated
  date, copy-to-clipboard button (no auto-display of password).
- `CredentialDetailPage` — reveal-password button (logs `credential.viewed`
  activity event), edit form.
- Per-credential `sharedWith` picker (employee user ids).

**Goal C — API + smoke**
- ~6 routes: list / get / create / update / archive / view-password.
- view-password is rate-limited + activity-logged.
- Smoke: encryption round-trip, sharedWith access control, view event
  fires, rate limit kicks in. ≥8 cases.

**Goal D — Chapter + MASTER**
- `04-plugin-credentials-vault.md`. MASTER row.

## NOT in scope

- Real password manager integration (1Password / Bitwarden) — deferred.
- Auto-fill browser extension.
- 2FA TOTP generation — store recovery codes only.
- Touching milesymedia / business-os.

## When done

DONE referencing `004-credentials-vault.md`.
