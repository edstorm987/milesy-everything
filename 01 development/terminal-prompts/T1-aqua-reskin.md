/loop

# T1 — Aqua reskin: fold the agency shell into Ed's real Aqua

T1 R-prev shipped the generic agency shell (clients grid + add-client modal
+ per-client overview + Tools picker). Now reskin it so it matches Ed's
*actual* Aqua operating shape, captured in
**`01 development/context/prior research/04-aqua-internals-reference.md`**
(MASTER #59). Read that chapter end-to-end before starting — every fold-in
below traces back to a numbered section there.

## Working environment

- **Repo**: https://github.com/edsworld27/ker-v3 (branch `main`).
- **Local**: `~/Desktop/ker-v3/`. Folder `04-the-final-portal/`.
- After every commit: `git pull --rebase --autostash && git push`.
- Local dev server on http://localhost:3030.

## HARD BOUNDARIES — do NOT touch

- `04-the-final-portal/milesymedia website/` — Ed owns this.
- `04-the-final-portal/business-os/` — Ed owns this.

## Mandatory pre-read

1. **`04-aqua-internals-reference.md`** (MASTER #59) — the source of truth
   for everything below.
2. `04-agency-shell.md` (your previous round) for what's already built.
3. `01 development/messages/terminal-1/from-orchestrator.md`.

## Scope

**Goal A — Replace the placeholder phase progression** (chapter §5)
- The phase preset picker in "+ New client" currently lists Discovery /
  Development / Onboarding / Live. Replace with Aqua's real six phases:
  **Epic Intro · Blueprint Setup · Diagnostics / Foundations · Brand
  Builder + Verification · Traffic (Expansion) · Mastery & Ascension**.
- Update the fulfillment plugin's `DEFAULT_PHASE_PRESETS` accordingly
  (this is foundation-side, not plugin-side — you own it). The
  per-phase plugin install map is in chapter §5a.
- The phase chip on each client card (in the agency home grid) renders
  the new phase label.

**Goal B — Aqua-real "+ New client" modal fields** (chapter §8)
- Add: **Therapist name** + **Practice name** (instead of generic
  "name"; both contribute to the display name "<Therapist> · <Practice>").
- Add: **Plan tier** select (Foundational / Expansion / Mastery — chapter
  §4); store on `client.metadata.planTier`.
- Add: **Starting phase** picker (the new six phases from Goal A;
  default = "Epic Intro").
- Add: **WhatsApp group invite link** (URL field, optional; stored on
  `client.metadata.whatsappLink`).
- Add: **Lock-in deposit paid** checkbox (boolean; stored on
  `client.metadata.lockInPaid`).
- Add: **Stripe / invoice link** (URL field, optional; stored on
  `client.metadata.stripeLink`).
- Most live in `metadata: {}` so no schema changes — keep the existing
  client model.

**Goal C — Aqua HQ six-section sidebar** (chapter §2)
- Replace the current "Tools" ballpark group (HR / Finance / Marketing /
  Forms / Email / Ops / Domains / Affiliates) with the canonical six:
  - **Leads & Clients HQ** → links to `/portal/agency` (the home itself)
  - **Client Billing & Finance** → links to agency-finance plugin's main page
  - **Tasks & To-Do's** → links to kanban plugin's BoardListPage (agency-scope)
  - **SOPs, Docs & Templates** → for v1, link to a placeholder page or to
    a website-editor "SOPs" page if one exists (graceful: hide row if no
    target)
  - **Social Media Planner** → links to agency-marketing plugin's main page
  - **Passwords & Access** → for v1, link to a placeholder page (or hide
    row — credentials vault not built yet, chapter §12)
- Keep the existing "Tools" group as a secondary collapsed section
  (rename "More tools") so HR / Email / Ops / Domains / Affiliates / Forms
  still discoverable but out of the way.

**Goal D — Brand voice in welcome copy** (chapter §1)
- Welcome banner on `/portal/agency`: pair the existing "Welcome back, Ed"
  with a small subtitle line *"Where Healing Meets Revolution."*.
- Empty-state copy (no clients yet): a sentence that frames the audience
  ("Add your first therapist client to get started"). Keep the tone
  direct + slightly mythos — match Ed's register from the chapter §1.

**Goal E — Per-client overview surfaces the Aqua phase**
- The Phase chip on the per-client overview shows the new Aqua phase
  label. Add a small "Plan tier: <Foundational/Expansion/Mastery>"
  caption beside it. Pull from `client.metadata`.
- "Open WhatsApp group" quick-action link in the Overview tab when
  `client.metadata.whatsappLink` is set.

**Goal F — Smoke + chapter**
- Extend smoke: add-client with new fields persists; phase preset list
  returns the six Aqua phases; per-client overview renders WhatsApp link
  when set; sidebar renders the six canonical rows.
- Chapter `04-agency-shell-aqua-reskin.md` (or append a "Round 2 — Aqua
  reskin" section to the existing `04-agency-shell.md` — your call).
  MASTER row updated/added.

## NOT in scope

- Touching milesymedia / business-os (HARD BOUNDARY).
- Building Employee HQ / Role Builder (chapter §9 — its own future round).
- Building the SOP shelf (chapter §9c — deferred).
- Building Aqua AI general-purpose chat (deferred).
- New plugins.

## Loop discipline

Standard. Q-ASSUMED + continue. 3 empty wakes → end.

## When done

DONE + COMMIT in outbox; chapter; MASTER row; tasks row.
